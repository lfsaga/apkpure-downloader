import { PromptAdapter } from "../../infraestructure/adapters/prompt.adapter";
import { LocalRepository } from "../../infraestructure/repositories/local.repository";

class ClearUntrackedFilesUseCase {
  constructor(private localRepository: LocalRepository) {}

  async execute(): Promise<void> {
    await this.localRepository.init();
    const trackedPackages = await this.localRepository.getTrackedPackages();
    const outputDirs = await this.localRepository.getOutputDirs();

    // get the strings present on outputDirs that not present on tracked Packages map(item.alias)
    const untrackedPackages = outputDirs.filter(
      (dir) => !trackedPackages.map((item) => item.getAlias()).includes(dir)
    );

    console.log(untrackedPackages);
    process.exit();

    // ask for delete n untracked packages foldres with files
    const c = await PromptAdapter.getConfirmation(
      "Do you want to delete the untracked packages folders?"
    );
  }
}

export { ClearUntrackedFilesUseCase };
