import * as fs from "fs";
import chalk from "chalk";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { Package } from "../entities/package.entity.mjs";
import { Version } from "../entities/version.entity.mjs";

puppeteer.use(StealthPlugin());

export class RemoteRepository {
  constructor() {
    this.options = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    };
  }

  async #parsePackages({ page }) {
    return (
      await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a"))
          .filter(
            (el) =>
              el.href &&
              el.href.match(
                /^https:\/\/apkpure\.com\/[^\/]+\/[^\/]+\.[^\/]+$/
              ) &&
              !el.href.includes("com.apkpure.aegon")
          )
          .map((el) => ({
            url: el.href,
            rating: el.querySelector(".star")?.textContent.trim(),
          }));
      })
    ).map((pkg) => {
      return new Package({
        url: pkg.url,
        alias: pkg.packageName,
        rating: pkg.rating,
      });
    });
  }

  async #parseVersions({ page, pkg }) {
    return (
      await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a.ver_download_link")).map(
          (el) => {
            return {
              url: el.href,
              tag: decodeURIComponent(el.href.split("/").slice(-1)[0].trim()),
              createdAt: el.querySelector(".update-on")?.textContent.trim(),
            };
          }
        );
      })
    ).map(
      (item) =>
        new Version({
          pkg: new Package({
            url: pkg.url,
            alias: pkg.alias,
            rating: pkg.rating,
          }),
          url: item.url,
          tag: item.tag,
          createdAt: item.createdAt,
        })
    );
  }

  async #waitDownload({ page }) {
    return new Promise((resolve, reject) => {
      page._client().on("Page.downloadProgress", (e) => {
        if (e.state === "completed") resolve(e.state);
        else if (e.state === "canceled") reject(e.state);
      });
    });
  }

  async #setDownloadBehavior({ page, downloadPath }) {
    await (
      await page.target().createCDPSession()
    ).send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath,
    });
  }

  async #renameFile({ downloadPath, versionTag }) {
    const lastFile = fs.readdirSync(downloadPath).pop();

    const ext = lastFile.split(".").pop();
    const newName = `${versionTag}.${ext}`;

    fs.renameSync(`${downloadPath}/${lastFile}`, `${downloadPath}/${newName}`);
  }

  async #download({ browser, version }) {
    return new Promise(async (resolve) => {
      try {
        const downloadUrl = version.url.replace("download", "downloading");
        const downloadPath = `./downloads/${version.pkg.packageName}`;

        fs.mkdirSync(downloadPath, { recursive: true });

        // detect if a file that contains the version tag already exists
        if (
          fs
            .readdirSync(downloadPath)
            .some((file) => file.includes(version.tag))
        ) {
          console.log(
            chalk.yellow(
              `file with tag ${chalk.magenta(
                version.tag
              )} already exists. skipping download.`
            )
          );
          resolve(true);
          return;
        }

        const page = await browser.newPage();

        await this.#setDownloadBehavior({ page, downloadPath });

        await page.goto(downloadUrl, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        await this.#waitDownload({ page });

        await page.close();

        this.#renameFile({ downloadPath, versionTag: version.tag });

        console.log(
          chalk.green(
            `downloaded ${version.pkg.alias} ${version.tag} to ${downloadPath}`
          )
        );

        resolve(true);
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });
  }

  async search({ terms }) {
    const browser = await puppeteer.launch(this.options);
    const page = await browser.newPage();
    const packages = [];

    try {
      for (const term of terms) {
        await page.goto(
          `https://apkpure.com/search?q=${encodeURIComponent(term)}.`
        );
        packages.push(...(await this.#parsePackages({ page })));
      }
    } finally {
      await page.close();
      await browser.close();
    }

    return packages.filter(
      (item, index, self) => index === self.findIndex((t) => t.url === item.url)
    );
  }

  async show({ packages, last }) {
    const browser = await puppeteer.launch(this.options);
    const page = await browser.newPage();

    try {
      for (const pkg of packages) {
        await page.goto(`${pkg.url}/versions`);
        (await this.#parseVersions({ page, pkg: pkg }))
          .slice(0, last)
          .forEach((version, index) => {
            console.log(
              `${chalk.yellow(version.pkg.alias)} ${chalk.magenta(
                version.tag
              )} ${version.createdAt}${
                index === 0 ? chalk.yellow("*") : ""
              } ${chalk.grey(`${version.url}`)}`
            );
          });
      }
    } finally {
      await page.close();
      await browser.close();
    }

    return true;
  }

  async pull({ packages, last, threads }) {
    const browser = await puppeteer.launch(this.options);
    const page = await browser.newPage();

    try {
      for (const pkg of packages) {
        await page.goto(`${pkg.url}/versions`);
        const toPull = (await this.#parseVersions({ page, pkg: pkg })).slice(
          0,
          last
        );

        for (const version of toPull) {
          console.log(
            `${version.pkg.alias} ${chalk.yellow(
              version.pkg.packageName
            )} ${chalk.magenta(version.tag)} ${version.createdAt} ${chalk.grey(
              `${version.url}`
            )}`
          );

          await this.#download({
            browser,
            version,
          });
        }
      }
    } finally {
      await page.close();
      await browser.close();
    }

    return true;
  }
}
