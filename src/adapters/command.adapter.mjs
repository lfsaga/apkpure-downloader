import ora from "ora";
import chalk from "chalk";

import { PromptAdapter } from "./prompt.adapter.mjs";

import { LocalRepository } from "../repositories/local.repository.mjs";
import { RemoteRepository } from "../repositories/remote.repository.mjs";

export class CommandAdapter {
  constructor() {
    this.local = new LocalRepository();
    this.remote = new RemoteRepository();
  }

  async default() {
    console.log(chalk.yellow("use 'help' to show available commands."));
    const choice = await PromptAdapter.getCommand({
      choices: [
        ...(!this.local.isInitialized()
          ? ["init"]
          : ["show", "pull", "search", "untrack"]),
        "exit",
      ],
    });

    switch (choice) {
      case "init":
        await this.init();
        break;
      case "search":
        await this.search({
          terms: await PromptAdapter.getSearchTerms(),
        });
        break;
      case "show":
        await this.show({
          packages: await PromptAdapter.getChosenPackages({
            packages: await this.local.getPackages(),
            message: "choose package(s) to show",
          }),
          options: {
            last: await PromptAdapter.getLast(),
          },
        });
        break;
      case "pull":
        await this.pull({
          packages: await PromptAdapter.getChosenPackages({
            packages: await this.local.getPackages(),
            message: "choose package(s) to show",
          }),
          options: {
            last: await PromptAdapter.getLast(),
            threads: 1,
          },
        });
        break;
      case "untrack":
        await this.untrack({
          packages: await PromptAdapter.getChosenPackages({
            packages: await this.local.getPackages(),
            message: "choose package(s) to untrack",
          }),
        });

        break;
      case "exit":
        return;
    }
  }

  async init() {
    (await this.local.initialize())
      ? console.log(`repository initialized successfully`)
      : console.log(chalk.yellow(`repository already initialized`));
  }

  async search({ terms }) {
    const isAlreadyTracked = (localPackages, remotePackage) =>
      localPackages.some((localPkg) => remotePackage.url === localPkg.url);

    if (!this.local.isInitialized()) {
      console.log(
        chalk.yellow(
          `repository not initialized. Run 'apkpure init' to initialize.`
        )
      );
      return;
    }

    if (!terms) {
      terms = await PromptAdapter.getSearchTerms();
    }

    const spinner = ora("searching ...").start();
    const remotePackages = await this.remote.search({ terms });

    spinner.stop();

    if (remotePackages.length === 0) {
      console.log(chalk.red("empty search"));
      return;
    }

    while (true) {
      const { selection: remoteSelection, action } =
        await PromptAdapter.getSearchAction({
          packages: remotePackages,
        });

      if (remoteSelection.length === 0) {
        console.log(chalk.red("no packages selected. exiting."));
        return;
      }

      switch (action) {
        case "track":
          const aliases = await PromptAdapter.getAliases({
            packages: remoteSelection,
          });

          const toAddData = remoteSelection.map((pkg, index) => ({
            alias: aliases[pkg.packageName],
            url: pkg.url,
          }));

          await this.local.addPackages(toAddData);
          return;
        case "show":
          await this.remote.show({
            packages: remoteSelection,
            last: await PromptAdapter.getLast(),
          });

          if (
            !(await PromptAdapter.getConfirmation({
              message: "want to choose again from search results?",
            }))
          ) {
            return;
          }

          break;
        case "pull":
          await this.remote.pull({
            packages: remoteSelection,
            last: await PromptAdapter.getLast(),
            threads: await PromptAdapter.getThreads(),
          });
          return;
      }
    }
  }

  async list() {
    if (!this.local.isInitialized()) {
      console.log(
        chalk.yellow(
          `repository not initialized. Run 'apkpure init' to initialize.`
        )
      );
      return;
    }

    const packages = await this.local.getPackages();

    if (packages.length === 0) {
      console.log(chalk.red("no tracked packages."));
      return;
    }

    packages.forEach((pkg) => {
      console.log(chalk.yellow(pkg.alias), chalk.grey(pkg.url));
    });
  }

  async show({ packages, options }) {
    if (!this.local.isInitialized()) {
      console.log(
        chalk.yellow(
          `repository not initialized. Run 'apkpure init' to initialize.`
        )
      );
      return;
    }

    if (packages.length === 0) {
      console.log(chalk.red("no choosen package(s)."));
      return;
    }

    if (!options.last) {
      options.last = await PromptAdapter.getLast();
    }

    await this.remote.show({
      packages: packages,
      last: options.last,
    });
  }

  async pull({ packages, options }) {
    if (!this.local.isInitialized()) {
      console.log(
        chalk.yellow(
          `repository not initialized. Run 'apkpure init' to initialize.`
        )
      );
      return;
    }

    if (packages.length === 0) {
      console.log(chalk.red("no choosen package(s)."));
      return;
    }

    if (!options.last) {
      options.last = await PromptAdapter.getLast();
    }

    if (!options.threads) {
      options.threads = 1;
    }

    await this.remote.pull({
      packages: packages,
      last: options.last,
      threads: options.threads,
    });
  }

  async untrack({ packages }) {
    if (!this.local.isInitialized()) {
      console.log(
        chalk.yellow(
          `repository not initialized. Run 'apkpure init' to initialize.`
        )
      );
      return;
    }

    if (packages.length === 0) {
      console.log(chalk.red("no choosen package(s)."));
      return;
    }

    await this.local.untrack({
      packages: packages,
    });
  }
}
