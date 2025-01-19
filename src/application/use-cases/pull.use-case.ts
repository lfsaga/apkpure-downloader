import { Package } from "../../domain/entities/package.entity";
import { PromptAdapter } from "../../infraestructure/adapters/prompt.adapter";
import { LocalRepository } from "../../infraestructure/repositories/local.repository";
import { RemoteRepository } from "../../infraestructure/repositories/remote.repository";

class PullPackagesWithVersionsUseCase {
  constructor(
    private localRepository: LocalRepository,
    private remoteRepository: RemoteRepository
  ) {}

  async execute(
    aliases: string[] | null | undefined,
    last: number | null | undefined,
    all: boolean | null | undefined,
    threads: number | null | undefined
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
        "Select packages to pull versions"
      );

      if (chosen.length === 0) {
        console.log("No selected packages.");
        return;
      }
    }

    const versionsToPull = last ?? (await PromptAdapter.getLast());

    const maxThreads = threads ?? 1;

    await this.remoteRepository.pullPackages(chosen, {
      last: versionsToPull,
      threads: maxThreads,
    });
  }
}

export { PullPackagesWithVersionsUseCase };
