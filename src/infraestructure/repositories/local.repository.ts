import storage from "node-persist";
import fs from "fs";
import path from "path";
import { Package } from "../../domain/entities/package.entity";
import { ConfigService } from "../../domain/services/config.service";

interface StoredPackage {
  url: string;
  alias: string;
  rating: number;
}

export class LocalRepository {
  private readonly config: ConfigService;

  constructor() {
    this.config = ConfigService.getInstance();
  }

  public async init(): Promise<void> {
    await storage.init({
      dir: this.config.getStoragePath(),
      stringify: JSON.stringify,
      parse: JSON.parse,
      encoding: "utf8",
    });
  }

  async getTrackedPackages(): Promise<Package[]> {
    const packages: StoredPackage[] = (await storage.getItem("packages")) || [];
    return packages.map((pkg) => new Package(pkg.url, pkg.alias, pkg.rating));
  }

  async trackPackages(packages: Package[]): Promise<void> {
    const existingPackages: StoredPackage[] =
      (await storage.getItem("packages")) || [];

    const newPackages = packages.filter(
      (pkg) => !existingPackages.some((p) => p.url === pkg.getUrl())
    );
    await storage.setItem("packages", [...existingPackages, ...newPackages]);
  }

  async untrackPackages(packages: Package[]): Promise<void> {
    const existingPackages: StoredPackage[] =
      (await storage.getItem("packages")) || [];
    const filteredPackages = existingPackages.filter(
      (pkg) => !packages.some((p) => p.getUrl() === pkg.url)
    );
    await storage.setItem("packages", filteredPackages);
  }

  public async getOutputDirs(): Promise<string[]> {
    const service = ConfigService.getInstance();
    const outputPath = await service.getOutputPath();
    return fs.readdirSync(outputPath);
  }

  public async getOutputVersions(pkg: Package): Promise<string[]> {
    const service = ConfigService.getInstance();
    const outputPath = await service.getOutputPath();
    const pkgPath = path.join(outputPath, pkg.getName());
    return fs
      .readdirSync(pkgPath)
      .map((file) => file.substring(0, file.lastIndexOf(".")));
  }
}
