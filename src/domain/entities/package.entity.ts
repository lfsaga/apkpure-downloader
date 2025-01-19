import { Version } from "./version.entity";

const unslugify = ({ slug }: { slug: string }) => {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export class Package {
  private readonly slug: string;
  private readonly name: string;
  private readonly beautyName: string;

  constructor(
    private readonly url: string,
    private readonly alias: string,
    private readonly rating: number
  ) {
    this.slug = decodeURIComponent(url.split("/").slice(-2, -1).join("/"));
    this.name = url.split("/").slice(-1).join("/");
    this.alias = alias ?? this.name;
    this.beautyName = unslugify({ slug: this.slug });
  }

  getUrl(): string {
    return this.url;
  }

  getSlug(): string {
    return this.slug;
  }

  getName(): string {
    return this.name;
  }

  getAlias(): string {
    return this.alias;
  }

  getBeautyName(): string {
    return this.beautyName;
  }

  getRating(): number {
    return this.rating;
  }

  toString(): string {
    const nameDiffersFromAlias = this.getAlias() !== this.getName();
    return `\x1b[32m${this.getAlias()}\x1b[0m${
      nameDiffersFromAlias ? `(${this.getName()})` : ""
    }: ${this.getBeautyName()} (${this.getRating()}⭐)`;
  }

  toStringWithVersions(versionsData: Version[]): string {
    return `==> \x1b[32m ${this.getAlias()}
\x1b[0m> Name: ${this.getBeautyName()}
> Package: ${this.getName()}
> Market rating: ${this.getRating()}⭐
> Latest versions detected: ${versionsData.map((version: Version) => {
      return `\n... ${this.getName()} \x1b[32m ${version.getTag()}\x1b[0m ${version.getTimestamp()}\x1b[90m ${version
        .getUrl()
        .replace("download", "downloading")}\x1b[0m`;
    })}`;
  }

  toJSON(): { url: string; alias: string; rating: number } {
    return { url: this.url, alias: this.alias, rating: this.rating };
  }
}
