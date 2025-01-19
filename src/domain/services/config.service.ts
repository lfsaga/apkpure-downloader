import * as os from "os";
import * as path from "path";
import storage from "node-persist";

export class ConfigService {
  private static instance: ConfigService;
  private readonly BASE_DIR: string;
  private readonly STORAGE_DIR: string;
  private readonly OUTPUT_DIR: string;

  private constructor() {
    const homeDir = os.homedir();
    this.BASE_DIR = path.join(homeDir, ".apkpure");
    this.STORAGE_DIR = path.join(this.BASE_DIR, "storage");
    this.OUTPUT_DIR = path.join(this.BASE_DIR, "output");
    this.initializeDirectories();
    this.initializeStorage();
  }

  private initializeDirectories(): void {
    const fs = require("fs");
    [this.BASE_DIR, this.STORAGE_DIR, this.OUTPUT_DIR].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private async initializeStorage(): Promise<void> {
    await storage.init({
      dir: this.STORAGE_DIR,
      stringify: JSON.stringify,
      parse: JSON.parse,
      encoding: "utf8",
    });
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public getBasePath(): string {
    return this.BASE_DIR;
  }

  public getStoragePath(): string {
    return this.STORAGE_DIR;
  }

  public getOutputPath(): string {
    return this.OUTPUT_DIR;
  }
}
