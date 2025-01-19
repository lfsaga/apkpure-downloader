import fs from "fs";
import path from "path";
import { executablePath, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Package } from "../../domain/entities/package.entity";
import { Version } from "../../domain/entities/version.entity";
import { ConfigService } from "../../domain/services/config.service";

puppeteer.use(StealthPlugin());

function formatBytesAsMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function renderProgressBar(
  percent: number,
  barWidth: number = 20,
  downloadedMB?: string,
  totalMB?: string
): string {
  const filled = Math.round((percent / 100) * barWidth);
  const bar = "#".repeat(filled) + "-".repeat(barWidth - filled);

  if (downloadedMB && totalMB) {
    return `[${bar}] ${percent}% (${downloadedMB} MB / ${totalMB} MB)`;
  } else {
    return `[${bar}] ${percent}%`;
  }
}

function writeProgressLine(message: string) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(message);
}

export class RemoteRepository {
  private readonly options = {
    executablePath: "/usr/bin/brave-browser",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
  };

  private async parsePackages(page: Page): Promise<Package[]> {
    const rawPackages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a"))
        .filter(
          (el) =>
            el.href &&
            el.href.match(/^https:\/\/apkpure\.com\/[^\/]+\/[^\/]+\.[^\/]+$/) &&
            !el.href.includes("com.apkpure.aegon")
        )
        .map((el) => ({
          url: el.href,
          rating: el.querySelector(".star")?.textContent?.trim() || null,
        }));
    });

    return rawPackages.map(
      (pkg: { url: string; rating: string | null }) =>
        new Package(
          pkg.url,
          pkg.url.split("/").pop() || "unknown",
          pkg.rating ? parseFloat(pkg.rating) : 0
        )
    );
  }

  private async parseVersions(page: Page, pkg: Package): Promise<Version[]> {
    const rawVersions = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a.ver_download_link")).map(
        (el) => ({
          //@ts-ignore
          url: el.href,
          //@ts-ignore
          tag: decodeURIComponent(el.href.split("/").pop()?.trim() || ""),
          timestamp:
            el.querySelector(".update-on")?.textContent?.trim() || "unknown",
        })
      );
    });

    return rawVersions.map(
      (item: { url: string; tag: string; timestamp: string }) =>
        new Version(
          new Package(pkg.getUrl(), pkg.getAlias(), pkg.getRating()),
          item.url,
          item.tag,
          item.timestamp
        )
    );
  }

  private async setBlockResource(page: Page) {
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (
        ["image", "stylesheet", "font", "media", "script"].includes(
          request.resourceType()
        )
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  private async setDownloadBehavior(page: Page, downloadPath: string) {
    //@ts-ignore
    await page._client().send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath,
    });
  }

  private async waitDownload(page: Page) {
    return new Promise((resolve, reject) => {
      let lastPercent = -1;
      //@ts-ignore
      page._client().on("Page.downloadProgress", (event) => {
        const { state, totalBytes, receivedBytes } = event;

        switch (state) {
          case "inProgress":
            if (totalBytes && totalBytes > 0) {
              const percent = Math.round((receivedBytes / totalBytes) * 100);
              if (percent !== lastPercent) {
                const downloadedMB = formatBytesAsMB(receivedBytes);
                const totalMB = formatBytesAsMB(totalBytes);
                writeProgressLine(
                  renderProgressBar(percent, 20, downloadedMB, totalMB)
                );
                lastPercent = percent;
              }
            } else {
              writeProgressLine(`[??????] ${receivedBytes} bytes`);
            }
            break;

          case "completed":
            writeProgressLine("");
            resolve(state);
            break;

          case "canceled":
            writeProgressLine("");
            console.log("Download canceled!");
            reject(new Error("Download canceled"));
            break;
        }
      });
    });
  }

  private async renameFile(
    downloadPath: string,
    versionTag: string
  ): Promise<string> {
    const files = fs.readdirSync(downloadPath);
    const lastFile = files[files.length - 1];
    const ext = lastFile.split(".").pop();
    fs.renameSync(
      `${downloadPath}/${lastFile}`,
      `${downloadPath}/${versionTag}.${ext}`
    );
    return `${versionTag}.${ext}`;
  }

  async searchPackages(terms: string[]): Promise<Package[]> {
    const browser = await puppeteer.launch(this.options);
    const page = await browser.newPage();
    const packages: Package[] = [];

    try {
      for (const term of terms) {
        await page.goto(
          `https://apkpure.com/search?q=${encodeURIComponent(term)}`
        );
        packages.push(...(await this.parsePackages(page)));
      }
    } finally {
      await page.close();
      await browser.close();
    }

    return packages.filter(
      (pkg, index, self) =>
        index === self.findIndex((p) => p.getUrl() === pkg.getUrl())
    );
  }

  async showPackageInfo(
    packages: Package[],
    { last }: { last: number }
  ): Promise<void> {
    const browser = await puppeteer.launch(this.options);
    const page = await browser.newPage();

    try {
      for (const pkg of packages) {
        await page.goto(`${pkg.getUrl()}/versions`);
        const versions = await this.parseVersions(page, pkg);
        console.log(pkg.toStringWithVersions(versions.slice(0, last)));
      }
    } finally {
      await page.close();
      await browser.close();
    }
  }

  async pullPackages(
    packages: Package[],
    { last, threads }: { last: number; threads: number }
  ): Promise<void> {
    const browser = await puppeteer.launch(this.options);
    const config = ConfigService.getInstance();

    try {
      for (const pkg of packages) {
        const page = await browser.newPage();
        await page.goto(`${pkg.getUrl()}/versions`);
        const versions = await this.parseVersions(page, pkg);
        const toPull = versions.slice(0, last);

        for (const version of toPull) {
          const downloadPath = path.join(config.getOutputPath(), pkg.getName());
          fs.mkdirSync(downloadPath, { recursive: true });

          const crDownloads = fs
            .readdirSync(downloadPath)
            .filter((file) => file.endsWith(".crdownload"));

          crDownloads.forEach((file) => {
            fs.unlinkSync(`${downloadPath}/${file}`);
          });

          const alreadyDownloaded = fs
            .readdirSync(downloadPath)
            .map((file) => file.split(".").slice(0, -1).join("."))
            .find((file) => file === version.getTag());

          if (alreadyDownloaded) {
            console.log(
              `\x1b[33mdetected locally ${version.getFullTag()} \x1b[90m${downloadPath}/${alreadyDownloaded}`
            );
            continue;
          }

          console.log(`\x1b[33mpulling ${version.getFullTag()}`);

          await this.setDownloadBehavior(page, downloadPath);
          await this.setBlockResource(page);
          await page.goto(version.getUrl().replace("download", "downloading"));

          await this.waitDownload(page);

          const filename = await this.renameFile(
            downloadPath,
            version.getTag()
          );

          console.log(
            `\x1b[33msaved locally ${version.getFullTag()} \x1b[90m${downloadPath}/${filename}`
          );
        }
      }
    } finally {
      await browser.close();
    }
  }
}
