#!/usr/bin/env node

import { Command } from "commander";

import { PromptAdapter } from "./adapters/prompt.adapter.mjs";
import { CommandAdapter } from "./adapters/command.adapter.mjs";

const program = new Command();
const command = new CommandAdapter();
const prompt = new PromptAdapter();

program
  .name("apkpure")
  .description("https://github.com/lfsaga/apkpure-downloader")
  .version("0.1.0");

program.action(() => command.default());

program
  .command("init")
  .description("initialize in working directory")
  .action(() => command.init());

program
  .command("search [terms]")
  .description("search new packages (track or pull them)")
  .action((terms) =>
    command.search({
      terms: terms?.split(",").map((term) => term.trim()),
    })
  );

program
  .command("show")
  .description("show info about tracked packages")
  .argument("[aliases]", "comma-separated aliases (alias or package name)")
  .option("-l, --last <number>", "last n versions")
  .action(async (aliases, options) => {
    if (aliases === undefined) {
      await command.show({
        packages: await prompt.getChosenPackages({
          packages: await command.local.getPackages(),
        }),
        options,
      });
      return;
    }

    command.show({
      packages: await command.local.getPackagesByAliases({
        aliases: aliases.split(","),
      }),
      options,
    });
  });

program
  .command("list")
  .description("list tracked packages")
  .action(async (aliases, options) => {
    command.list();
  });

program
  .command("pull")
  .description("pull APK files for tracked packages")
  .argument("[aliases]", "comma-separated aliases (alias or package name)")
  .option("-l, --last <number>", "last n versions")
  .option("-t, --threads <number>", "number of threads")
  .action(async (aliases, options) => {
    command.pull({
      packages: await command.local.getPackagesByAliases({
        aliases: aliases.split(","),
      }),
      options: {
        last: 1,
        threads: options.threads,
      },
    });
  });

program
  .command("untrack")
  .description("no track a package anymore")
  .argument("[aliases]", "comma-separated aliases (alias or package name)")
  .action(async (aliases) => {
    command.untrack({
      packages: await command.local.getPackagesByAliases({
        aliases: aliases.split(","),
      }),
    });
  });

program
  .command("help")
  .description("show help")
  .action(() => program.help());

program.parse();
