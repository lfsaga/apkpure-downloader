import * as fs from "fs";
import chalk from "chalk";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { Package } from "../entities/package.entity.mjs";

const REPO_FILENAME = ".apkpure.json";
const REPO_DEFAULT_CONTENT = {
  packages: [
    {
      url: "https://apkpure.com/github/com.github.android",
      alias: "github",
    },
  ],
  output: "./output",
};

export class LocalRepository {
  constructor() {
    this.path = REPO_FILENAME;
    this.repository = new Low(new JSONFile(this.path), REPO_DEFAULT_CONTENT);
  }

  isInitialized() {
    return fs.existsSync(`${process.cwd()}/${this.path}`);
  }

  async initialize() {
    if (this.isInitialized()) {
      await this.repository.read();
      return false;
    }

    await this.repository.write();
    return true;
  }

  async getOutputPath() {
    await this.repository.read();
    return this.repository.data.output;
  }

  async getPackages() {
    await this.repository.read();
    return this.repository.data.packages.map(
      (item) =>
        new Package({
          beautyName: item.beautyName,
          alias: item.alias,
          url: item.url,
        })
    );
  }

  async getPackagesByAliases({ aliases }) {
    await this.repository.read();

    if (aliases.includes("all")) {
      return this.repository.data.packages;
    }

    return this.repository.data.packages.filter((item) =>
      aliases.includes(item.alias)
    );
  }

  async addPackages(packagesMinimalData) {
    await this.repository.read();
    this.repository.data.packages = [
      ...this.repository.data.packages,
      ...packagesMinimalData,
    ];

    console.log(
      chalk.green(
        `${packagesMinimalData.length} package(s) added. use 'show' to see them.`
      )
    );
    await this.repository.write();
  }

  async untrack({ packages }) {
    await this.repository.read();
    this.repository.data.packages = this.repository.data.packages.filter(
      (item) => !packages.includes(item.alias)
    );

    console.log(chalk.green(`${packages.length} package(s) untracked.`));
    await this.repository.write();
  }
}
