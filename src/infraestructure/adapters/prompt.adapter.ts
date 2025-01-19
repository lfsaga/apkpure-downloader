import inquirer from "inquirer";
import { Package } from "../../domain/entities/package.entity";

export class PromptAdapter {
  static async getCommand(choices: string[]): Promise<string> {
    const { input } = await inquirer.prompt([
      {
        type: "list",
        name: "input",
        message: "Choose a command:",
        choices,
      },
    ]);
    return input;
  }

  static async getAliases(
    packages: { name: string }[]
  ): Promise<Record<string, string>> {
    const aliases: Record<string, string> = {};

    for (const pkg of packages) {
      const { input } = await inquirer.prompt([
        {
          type: "input",
          name: "input",
          message: `Provide an alias for (${pkg.name}):`,
          default: pkg.name,
          validate: (input: string) =>
            input.length > 0 || "Alias cannot be empty",
        },
      ]);
      aliases[pkg.name] = input;
    }

    return aliases;
  }

  static async getSearchTerms(): Promise<string[]> {
    const { input } = await inquirer.prompt([
      {
        type: "input",
        name: "input",
        message: "Enter search terms (comma-separated):",
        validate: (input: string) =>
          input.length > 0 || "Please enter at least one search term",
      },
    ]);
    return input.split(",").map((term: string) => term.trim());
  }

  static async getSearchAction(
    remotePackages: Package[],
    localPackages: Package[]
  ): Promise<{
    selection: any[];
    action: string | null;
  }> {
    const selection = await this.getChosenPackages(
      remotePackages,
      "Choose package(s) from search results:",
      localPackages
    );

    if (selection.length === 0) {
      return { selection: [], action: null };
    }

    const { input } = await inquirer.prompt([
      {
        type: "list",
        name: "input",
        message: `Choose action for ${selection.length} package(s):`,
        choices: ["info", "track", "direct-pull"],
      },
    ]);

    return { selection, action: input };
  }

  static async getChosenPackages(
    packages: Package[],
    message = "Choose package(s):",
    existingPackages: Package[] = []
  ): Promise<any[]> {
    const { selection } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selection",
        loop: false,
        message,
        choices: packages.map((pkg) => ({
          value: pkg,
          name: `${pkg.getBeautyName()} (${pkg.getAlias() ?? pkg.getName()})${
            pkg.getRating() ? ` (${pkg.getRating()}⭐)` : ""
          }`,
          disabled: existingPackages.some((p) => p.getName() === pkg.getName()),
        })),
        pageSize: 12,
      },
    ]);

    return selection;
  }

  static async getLast(): Promise<number> {
    //@ts-ignore
    const question: inquirer.InputQuestion = {
      type: "input",
      name: "input",
      message: "Last N versions to take",
      default: 1,
      validate: (value: string) => {
        const num = parseInt(value, 10);
        return (!isNaN(num) && num > 0) || "Please enter a positive number";
      },
      filter: (value: string) => parseInt(value, 10),
    };

    const { input } = await inquirer.prompt([question]);
    return input;
  }

  static async getThreads(): Promise<number> {
    //@ts-ignore
    const question: inquirer.InputQuestion = {
      type: "input",
      name: "input",
      message: "Max threads (up to 10):",
      default: 1,
      validate: (value: string) => {
        const num = parseInt(value, 10);
        return (
          (!isNaN(num) && num > 0 && num <= 10) ||
          "Please enter a number between 1 and 10"
        );
      },
      filter: (value: string) => parseInt(value, 10),
    };

    const { input } = await inquirer.prompt([question]);
    return input;
  }

  static async getConfirmation(message: string): Promise<boolean> {
    const { input } = await inquirer.prompt([
      {
        type: "confirm",
        name: "input",
        message,
      },
    ]);
    return input;
  }
}
