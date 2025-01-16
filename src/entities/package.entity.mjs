const unslugify = ({ slug }) => {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export class Package {
  constructor({ url, alias = null, beautyName = null, rating = null }) {
    this.url = url;
    this.slug = url.split("/").slice(-2, -1).join("/");

    // official package name
    this.packageName = url.split("/").slice(-1).join("/");

    // custom alias
    this.alias = alias ?? this.packageName;
    this.beautyName = beautyName ?? unslugify({ slug: this.slug });
    this.rating = rating;
  }
}
