import { PullPackagesWithVersionsUseCase } from "../../application/use-cases/pull.use-case";
import { ShowPackagesWithVersionsUseCase } from "../../application/use-cases/show.use-case";
import { ListPackagesUseCase } from "../../application/use-cases/list.use-case";
import { SearchUseCase } from "../../application/use-cases/search.use-case";

import { LocalRepository } from "../repositories/local.repository";
import { RemoteRepository } from "../repositories/remote.repository";
import { UntrackUseCase } from "../../application/use-cases/untrack.use-case";
import { ClearUntrackedFilesUseCase } from "../../application/use-cases/clear-untracked.use-case";
import { ConfigService } from "../../domain/services/config.service";

export class CommandAdapter {
  default() {
    console.log("Use 'help' or '-h' to see available commands.");
  }

  async list() {
    const useCase = new ListPackagesUseCase(new LocalRepository());
    await useCase.execute();
  }

  async info(aliases: string[], last: number, all: boolean) {
    const usecase = new ShowPackagesWithVersionsUseCase(
      new LocalRepository(),
      new RemoteRepository()
    );
    await usecase.execute(aliases, last, all);
  }

  async pull(aliases: string[], last: number, all: boolean, threads: number) {
    const usecase = new PullPackagesWithVersionsUseCase(
      new LocalRepository(),
      new RemoteRepository()
    );

    await usecase.execute(aliases, last, all, threads);
  }

  async untrack(aliases: string[], all: boolean) {
    const useCase = new UntrackUseCase(new LocalRepository());
    await useCase.execute(aliases, all);
  }

  async search(terms: string[]) {
    const useCase = new SearchUseCase(
      new RemoteRepository(),
      new LocalRepository()
    );
    await useCase.execute(terms);
  }

  async clearUntracked() {
    const useCase = new ClearUntrackedFilesUseCase(new LocalRepository());
    await useCase.execute();
  }
}
