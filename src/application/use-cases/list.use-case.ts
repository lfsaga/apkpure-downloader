import { LocalRepository } from "../../infraestructure/repositories/local.repository";

class ListPackagesUseCase {
  constructor(private localRepository: LocalRepository) {}

  async execute(): Promise<void> {
    await this.localRepository.init();
    const trackedPackags = await this.localRepository.getTrackedPackages();

    if (trackedPackags.length === 0) {
      console.log("No local packages are tracked. Please add packages first.");
      return;
    }

    for (const pkg of trackedPackags) {
      console.log(pkg.toString());
      (await this.localRepository.getOutputVersions(pkg)).map(
        (localVersion) => {
          console.log(`  - ${localVersion}`);
        }
      );
    }
  }
}

export { ListPackagesUseCase };
