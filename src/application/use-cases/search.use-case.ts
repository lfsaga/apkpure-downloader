import { LocalRepository } from "../../infraestructure/repositories/local.repository";
import { Package } from "../../domain/entities/package.entity";
import { PromptAdapter } from "../../infraestructure/adapters/prompt.adapter";
import { RemoteRepository } from "../../infraestructure/repositories/remote.repository";
import { SearchResultAction } from "../../domain/value-object/search-result-action.value-object";

class SearchUseCase {
  constructor(
    private remoteRepository: RemoteRepository,
    private localRepository: LocalRepository
  ) {}

  async execute(terms: string[]): Promise<Package[]> {
    await this.localRepository.init();

    if (!terms || terms.length === 0) {
      terms = await PromptAdapter.getSearchTerms();
    }

    console.log(`searching ${terms.length} term(s) ...`);

    const remotePackages = await this.remoteRepository.searchPackages(terms);

    if (remotePackages.length === 0) {
      throw new Error("No packages found for the given search terms.");
    }

    const localPackages = await this.localRepository.getTrackedPackages();

    let keepNavigating = true;
    while (keepNavigating) {
      const { selection, action } = await PromptAdapter.getSearchAction(
        remotePackages,
        localPackages
      );

      keepNavigating = await this.executeSearchAction(selection, action);
    }

    return [];
  }

  private async executeSearchAction(
    packages: Package[],
    action: string | null
  ): Promise<boolean> {
    if (packages.length === 0 && !action) {
      return false;
    }

    switch (action as SearchResultAction) {
      case SearchResultAction.Track:
        const aliases = await PromptAdapter.getAliases(
          packages.map((p) => ({ name: p.getName() }))
        );

        await this.localRepository.trackPackages(
          packages.map(
            (p) => new Package(p.getUrl(), aliases[p.getName()], p.getRating())
          )
        );

        return false;

      case SearchResultAction.Info:
        await this.remoteRepository.showPackageInfo(packages, {
          last: await PromptAdapter.getLast(),
        });

        return await PromptAdapter.getConfirmation(
          "Do you want to interact with the search result(s) again?"
        );

      case SearchResultAction.DirectPull:
        await this.remoteRepository.pullPackages(packages, {
          last: await PromptAdapter.getLast(),
          threads: await PromptAdapter.getThreads(),
        });

        return false;

      default:
        console.log("No valid action selected. Exiting.");
        return false;
    }
  }
}

export { SearchUseCase };
