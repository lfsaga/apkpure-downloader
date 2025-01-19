import { PromptAdapter } from "../../infraestructure/adapters/prompt.adapter";
import { LocalRepository } from "../../infraestructure/repositories/local.repository";
import { Package } from "../../domain/entities/package.entity";

class UntrackUseCase {
  constructor(private localRepository: LocalRepository) {}

  async execute(
    aliases: string[] | null | undefined,
    all: boolean | null | undefined
  ): Promise<void> {
    await this.localRepository.init();

    const packages = await this.localRepository.getTrackedPackages();

    if (packages.length === 0) {
      console.log("No local packages are tracked. Nothing to untrack.");
      return;
    }

    let chosen: Package[] = [];

    if (all) {
      chosen = packages;
    } else if (aliases) {
      chosen = packages.filter((pkg) => aliases.includes(pkg.getAlias()));

      if (chosen.length === 0) {
        console.log(
          `No packages found for the given aliases: ${aliases.join(", ")}.`
        );
        return;
      }
    } else {
      chosen = await PromptAdapter.getChosenPackages(
        packages,
        "Select packages to untrack"
      );

      if (chosen.length === 0) {
        console.log("No selected packages.");
        return;
      }
    }

    await this.localRepository.untrackPackages(chosen);

    console.log("Packages untracked successfully.");
  }
}

export { UntrackUseCase };
