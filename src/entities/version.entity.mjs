export class Version {
  constructor({ pkg, url, tag, createdAt }) {
    this.pkg = pkg;
    this.url = url;
    this.tag = tag;
    this.createdAt = createdAt;
  }
}
