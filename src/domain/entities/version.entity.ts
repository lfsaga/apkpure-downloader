import { Package } from "./package.entity";

export class Version {
  constructor(
    private readonly pkg: Package,
    private readonly url: string,
    private readonly tag: string,
    private readonly timestamp: string
  ) {
    this.tag = tag.replace(/\s/g, "");
  }

  getPackage(): Package {
    return this.pkg;
  }

  getUrl(): string {
    return this.url;
  }

  getTag(): string {
    return this.tag;
  }

  getFullTag(): string {
    return `\x1b[0m${this.getPackage().getName()} \x1b[32m${this.getTag()}\x1b[0m`;
  }

  getTimestamp(): string {
    return this.timestamp;
  }

  toString(): string {
    return `
    ===> ${this.getPackage().getAlias()} [${this.getTag()}]
    > Timestamp: ${this.getTimestamp()}
    > URL: ${this.getUrl()}
    `;
  }
}
