import type { CollectionEntry } from "astro:content";
import { PUBLIC_SITE_ORIGIN } from "./public-urls.ts";

export const ENTRY_POINT_IDS = [
  "software-engineering-excellence",
  "chasing-big-goals",
  "creating-something-new",
  "navigating-lifes-seasons",
] as const;

export { PUBLIC_SITE_ORIGIN };

export type PublicContentKind = "garden" | "stream";
export type GardenState = CollectionEntry<"garden">["data"]["noteState"];
export type StreamType = CollectionEntry<"stream">["data"]["streamType"];

export interface CatalogueSource {
  id: string;
  kind: PublicContentKind;
  title: string;
  description: string;
  publishDatetime: Date;
  updateDatetime: Date;
  tags: string[];
  draft?: boolean;
  state?: GardenState;
  streamType?: StreamType;
  incomingLinks?: string[];
  outgoingLinks?: string[];
}

export interface PublicContentItem {
  id: string;
  url: `/${string}`;
  kind: PublicContentKind;
  title: string;
  description: string;
  publishDatetime: Date;
  updateDatetime: Date;
  publishDate: string;
  updateDate: string;
  tags: readonly string[];
  state?: GardenState;
  streamType?: StreamType;
  isEntryPoint: boolean;
  incomingIds: readonly string[];
  outgoingIds: readonly string[];
}

export interface CatalogueDiagnostic {
  type:
    | "missing-entry-point"
    | "unknown-outgoing-link"
    | "incoming-link-disagreement";
  id: string;
  detail: string;
}

export interface PublicCatalogue {
  items: readonly PublicContentItem[];
  garden: readonly PublicContentItem[];
  stream: readonly PublicContentItem[];
  entryPoints: readonly PublicContentItem[];
  activity: readonly PublicContentItem[];
  byId: ReadonlyMap<string, PublicContentItem>;
  diagnostics: readonly CatalogueDiagnostic[];
}

const entryPointSet = new Set<string>(ENTRY_POINT_IDS);
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Resolve only URLs that unambiguously identify public content on this site.
 *
 * Accepted forms are root/relative paths, the existing garden/stream prefixes,
 * optional md/mdx/html source extensions, and canonical HTTPS URLs on
 * https://mjmeyer.dev. Protocol-relative URLs, foreign origins, credentials,
 * and every non-HTTPS scheme (including HTTP) are deliberately rejected.
 */
export function normalizeContentId(value: string): string | undefined {
  const raw = value.trim();
  if (
    !raw ||
    raw.startsWith("#") ||
    raw.startsWith("//") ||
    raw.startsWith("\\")
  )
    return undefined;

  let parsed: URL;
  try {
    parsed = new URL(raw, PUBLIC_SITE_ORIGIN);
  } catch {
    return undefined;
  }
  if (
    parsed.origin !== PUBLIC_SITE_ORIGIN ||
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password
  )
    return undefined;

  const segments = parsed.pathname
    .replace(/\.(?:md|mdx|html)$/i, "")
    .split("/")
    .filter(Boolean);
  if (!segments.length || segments[0] === "unpublished") return undefined;
  if (["garden", "stream"].includes(segments[0])) segments.shift();
  return segments.length === 1 && /^[a-z0-9-]+$/.test(segments[0])
    ? segments[0]
    : undefined;
}

export function resolveCatalogueHref<T extends { url: `/${string}` }>(
  href: string,
  byId: ReadonlyMap<string, T>
): { destination: string; item: T | undefined } {
  const hashIndex = href.indexOf("#");
  const path = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : href.slice(hashIndex);
  const id = normalizeContentId(path);
  const item = id ? byId.get(id) : undefined;
  return { destination: item ? `${item.url}${hash}` : href, item };
}

function compareChronology(a: CatalogueSource, b: CatalogueSource) {
  return (
    b.updateDatetime.getTime() - a.updateDatetime.getTime() ||
    a.title.localeCompare(b.title)
  );
}

function asSortedUnique(values: Iterable<string>) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function buildPublicCatalogue(
  sources: readonly CatalogueSource[]
): PublicCatalogue {
  const publicSources = sources
    .filter(source => !source.draft)
    .toSorted(compareChronology);
  const sourceById = new Map(publicSources.map(source => [source.id, source]));
  const outgoingById = new Map<string, string[]>();
  const incomingById = new Map(
    publicSources.map(source => [source.id, [] as string[]])
  );
  const diagnostics: CatalogueDiagnostic[] = [];

  for (const source of publicSources) {
    const outgoing: string[] = [];
    for (const rawLink of source.outgoingLinks ?? []) {
      const linkedId = normalizeContentId(rawLink);
      if (!linkedId || !sourceById.has(linkedId)) {
        diagnostics.push({
          type: "unknown-outgoing-link",
          id: source.id,
          detail: rawLink,
        });
        continue;
      }
      outgoing.push(linkedId);
      incomingById.get(linkedId)?.push(source.id);
    }
    outgoingById.set(source.id, asSortedUnique(outgoing));
  }

  for (const source of publicSources) {
    const declared = asSortedUnique(
      (source.incomingLinks ?? [])
        .map(normalizeContentId)
        .filter((id): id is string => Boolean(id && sourceById.has(id)))
    );
    const derived = asSortedUnique(incomingById.get(source.id) ?? []);
    if (declared.join("\0") !== derived.join("\0")) {
      diagnostics.push({
        type: "incoming-link-disagreement",
        id: source.id,
        detail: `declared=${declared.join(",") || "none"}; derived=${derived.join(",") || "none"}`,
      });
    }
  }

  const items = publicSources.map<PublicContentItem>(source => ({
    id: source.id,
    url: `/${source.id}`,
    kind: source.kind,
    title: source.title,
    description: source.description,
    publishDatetime: source.publishDatetime,
    updateDatetime: source.updateDatetime,
    publishDate: dateFormatter.format(source.publishDatetime),
    updateDate: dateFormatter.format(source.updateDatetime),
    tags: source.tags,
    state: source.state,
    streamType: source.streamType,
    isEntryPoint: entryPointSet.has(source.id),
    incomingIds: asSortedUnique(incomingById.get(source.id) ?? []),
    outgoingIds: outgoingById.get(source.id) ?? [],
  }));
  const byId = new Map(items.map(item => [item.id, item]));
  const entryPoints = ENTRY_POINT_IDS.flatMap(id => {
    const item = byId.get(id);
    if (!item) {
      diagnostics.push({ type: "missing-entry-point", id, detail: id });
      return [];
    }
    return [item];
  });

  return {
    items,
    garden: items.filter(item => item.kind === "garden"),
    stream: items.filter(item => item.kind === "stream"),
    entryPoints,
    activity: items.filter(item => !item.isEntryPoint),
    byId,
    diagnostics,
  };
}
