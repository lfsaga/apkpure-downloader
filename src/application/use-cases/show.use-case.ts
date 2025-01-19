import { Package } from "../../domain/entities/package.entity";
import { PromptAdapter } from "../../infraestructure/adapters/prompt.adapter";
import { LocalRepository } from "../../infraestructure/repositories/local.repository";
import { RemoteRepository } from "../../infraestructure/repositories/remote.repository";
import { SearchUseCase } from "./search.use-case";

class ShowPackagesWithVersionsUseCase {
  constructor(
    private localRepository: LocalRepository,
    private remoteRepository: RemoteRepository
  ) {}

  async execute(
    aliases: string[] | null | undefined,
    last: number | null | undefined,
    all: boolean | null | undefined
  ): Promise<void> {
    await this.localRepository.init();

    const packages = await this.localRepository.getTrackedPackages();

    if (packages.length === 0) {
      console.log("No local packages are tracked. Please add packages first.");
      return;
    }

    let chosen: Package[] = [];

    if (all) {
      chosen = packages;
    } else if (aliases && aliases.length > 0) {
      const foundAliases: string[] = [];
      const localAliases = packages.map((pkg) => pkg.getAlias());

      for (const alias of aliases) {
        if (localAliases.includes(alias)) {
          foundAliases.push(alias);
        }
      }

      const unmatchedAliases = aliases.filter(
        (alias) => !foundAliases.includes(alias)
      );

      chosen = packages.filter((pkg) => foundAliases.includes(pkg.getAlias()));
      if (unmatchedAliases.length > 0) {
        console.log(
          `The following aliases were not found locally: ${unmatchedAliases.join(
            ", "
          )}`
        );

        const confirm = await PromptAdapter.getConfirmation(
          "Do you want to search these aliases remotely?"
        );

        if (confirm) {
          const useCase = new SearchUseCase(
            this.remoteRepository,
            this.localRepository
          );
          await useCase.execute(unmatchedAliases);
        }
      }

      if (chosen.length === 0 && unmatchedAliases.length > 0) {
        console.log(
          `No local packages matched the aliases [${aliases.join(", ")}].`
        );
        return;
      }
    } else {
      chosen = await PromptAdapter.getChosenPackages(
        packages,
        "Select packages to show info"
      );

      if (chosen.length === 0) {
        console.log("No selected packages.");
        return;
      }
    }

    const versionsToShow = last ?? (await PromptAdapter.getLast());

    await this.remoteRepository.showPackageInfo(chosen, {
      last: versionsToShow,
    });
  }
}

export { ShowPackagesWithVersionsUseCase };
