import { getCollection } from "astro:content";
import {
  buildPublicCatalogue,
  type CatalogueSource,
  type PublicCatalogue,
} from "./public-catalogue-core";

export * from "./public-catalogue-core";

let cataloguePromise: Promise<PublicCatalogue> | undefined;

export function getPublicCatalogue(): Promise<PublicCatalogue> {
  cataloguePromise ??= Promise.all([
    getCollection("garden"),
    getCollection("stream"),
  ]).then(([garden, stream]) =>
    buildPublicCatalogue([
      ...garden.map<CatalogueSource>(entry => ({
        id: entry.id,
        kind: "garden",
        title: entry.data.title,
        description: entry.data.description,
        publishDatetime: entry.data.publishDatetime,
        updateDatetime: entry.data.updateDatetime,
        tags: entry.data.tags,
        draft: entry.data.draft,
        state: entry.data.noteState,
        incomingLinks: entry.data.incomingLinks,
        outgoingLinks: entry.data.outgoingLinks,
      })),
      ...stream.map<CatalogueSource>(entry => ({
        id: entry.id,
        kind: "stream",
        title: entry.data.title,
        description: entry.data.description,
        publishDatetime: entry.data.publishDatetime,
        updateDatetime: entry.data.updateDatetime,
        tags: entry.data.tags,
        draft: entry.data.draft,
        streamType: entry.data.streamType,
        incomingLinks: entry.data.incomingLinks,
        outgoingLinks: entry.data.outgoingLinks,
      })),
    ])
  );
  return cataloguePromise;
}
