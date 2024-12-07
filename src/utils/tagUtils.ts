export function transformTag(tag: unknown): { slug: string; display: string } {
  if (typeof tag !== "string") {
    console.warn(`Invalid tag type: ${typeof tag}. Expected string.`);
    return { slug: "", display: "" };
  }

  // Handle camelCase and already hyphenated tags
  const slug = tag
    .replace(/([a-z])([A-Z])/g, "$1-$2") // Split camelCase
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-"); // Replace any non-alphanumeric characters (except hyphens) with hyphens

  // Create display version
  const display = tag
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Split camelCase
    .replace(/-/g, " ") // Replace hyphens with spaces
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return { slug, display };
}

export function normalizeTag(tag: unknown): string {
  if (typeof tag !== "string") {
    console.warn(`Invalid tag type: ${typeof tag}. Expected string.`);
    return "";
  }
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
