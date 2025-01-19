#!/usr/bin/env node

import { Command } from "commander";
import { CommandAdapter } from "./infraestructure/adapters/command.adapter";

const program = new Command();
const command = new CommandAdapter();

program
  .name("apkpure")
  .description("https://github.com/lfsaga/apkpure-downloader")
  .version("0.1.0");

program.action(() => command.default());

program
  .command("list")
  .alias("ls")
  .description("list-only tracked packages")
  .action(() => command.list());

program
  .command("search [terms]")
  .alias("s")
  .description("search and interact with results")
  .action((terms) =>
    command.search(terms?.split(",").map((term: string) => term.trim()))
  );

program
  .command("info [aliases]")
  .alias("i")
  .description("print details from tracked packages")
  .option("-l, --last <last>", "skip last n versions prompt")
  .option("-a, --all", "skip choose package prompt")
  .action((aliases, options) =>
    command.info(
      aliases?.split(",").map((term: string) => term.trim()),
      options.last,
      options.all
    )
  );

program
  .command("pull [aliases]")
  .alias("p")
  .description("pull last files from packages")
  .option("-l, --last <last>", "skip last n versions prompt")
  .option("-a, --all", "skip choose package prompt")
  .option("-t, --threads <threads>", "max pull threads")
  .action((aliases, options) =>
    command.pull(
      aliases?.split(",").map((term: string) => term.trim()),
      options.last,
      options.all,
      options.threads
    )
  );

program
  .command("untrack [aliases]")
  .alias("u")
  .description("untrack packages")
  .option("-a, --all", "untrack all packages")
  .action((aliases, options) =>
    command.untrack(
      aliases?.split(",").map((term: string) => term.trim()),
      options.all
    )
  );

program
  .command("clear-cache")
  .description("clear untracked files")
  .action(() => command.clearUntracked());

program
  .command("help")
  .description("show help")
  .action(() => program.help());

program.parse();
