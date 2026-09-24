export const PUBLIC_SITE_ORIGIN = "https://mjmeyer.dev";

export type PublicFeedCollection = "garden" | "stream" | "now";

export function nowArchivePath(id: string): `/now/${string}/${string}` {
  const [year, month] = id.split("-");
  return `/now/${year}/${month}`;
}

export function publicContentPath(
  collection: PublicFeedCollection,
  id: string
): `/${string}` {
  return collection === "now" ? nowArchivePath(id) : `/${id}`;
}

export function absolutePublicUrl(pathname: `/${string}`): string {
  return new URL(pathname, PUBLIC_SITE_ORIGIN).href;
}

export function stableRssGuid(
  collection: PublicFeedCollection,
  id: string
): string {
  return `${PUBLIC_SITE_ORIGIN}/${collection}/${id}/`;
}
