import inquirer from "inquirer";

export class PromptAdapter {
  static async getCommand({ choices }) {
    const { input } = await inquirer.prompt([
      {
        type: "list",
        name: "input",
        message: "choose a command",
        choices: choices,
      },
    ]);
    return input;
  }

  static async getAliases({ packages }) {
    const aliases = {};
    for (const pkg of packages) {
      const { input } = await inquirer.prompt([
        {
          type: "input",
          name: "input",
          message: `provide an alias (${pkg.packageName})`,
          default: pkg.packageName,
          validate: (input) => input.length > 0 || "alias cannot be empty",
        },
      ]);
      aliases[pkg.packageName] = input;
    }

    return aliases;
  }

  static async getSearchTerms() {
    const { input } = await inquirer.prompt([
      {
        loop: false,
        type: "input",
        name: "input",
        message: "enter search terms (comma-separated)",
        validate: (input) =>
          input.length > 0 || "please enter at least one search term",
      },
    ]);
    return input.split(",");
  }

  static async getSearchAction({ packages }) {
    const selection = await this.getChosenPackages({
      packages,
      message: "choose package(s) from search results",
    });

    if (selection.length === 0) {
      return { selection: [], action: null };
    }

    const { input } = await inquirer.prompt([
      {
        type: "list",
        name: "input",
        message: `choose action for ${selection.length} package(s):`,
        choices: ["track", "show", "pull"],
      },
    ]);

    return { selection, action: input };
  }

  static async getChosenPackages({ packages, message = "choose package(s)" }) {
    const { selection } = await inquirer.prompt([
      {
        loop: false,
        type: "checkbox",
        name: "selection",
        message: message,
        choices: packages.map((pkg) => ({
          value: pkg,
          name: `${pkg.beautyName} (${pkg.alias ?? pkg.packageName}) ${
            pkg.rating?.length > 0 ? `(${pkg.rating}⭐)` : ""
          }`,
        })),
        pageSize: 12,
      },
    ]);

    return selection;
  }

  static async getLast() {
    const { input } = await inquirer.prompt([
      {
        type: "input",
        name: "input",
        message: "last n versions to show",
        default: 1,
        validate: (value) => {
          const num = parseInt(value);
          return (!isNaN(num) && num > 0) || "please enter a positive number";
        },
        filter: (value) => parseInt(value),
      },
    ]);
    return input;
  }

  static async getThreads() {
    const { input } = await inquirer.prompt([
      {
        type: "input",
        name: "input",
        message: "max threads (up to 10)",
        default: 1,
        validate: (value) => {
          const num = parseInt(value);
          return (
            (!isNaN(num) && num > 0 && num <= 10) ||
            "please enter a number between 1 and 10"
          );
        },
        filter: (value) => parseInt(value),
      },
    ]);
    return input;
  }

  static async getConfirmation({ message }) {
    const { input } = await inquirer.prompt([
      {
        type: "confirm",
        name: "input",
        message: message,
      },
    ]);
    return input;
  }
}
