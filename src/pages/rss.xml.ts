import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import getSortedPosts from "@utils/getSortedPosts";
import { SITE } from "@config";
import type { CollectionEntry } from "astro:content";
import {
  absolutePublicUrl,
  publicContentPath,
  stableRssGuid,
} from "../lib/public-urls";

type ContentItem = CollectionEntry<"garden" | "stream" | "now">;

const escapeXmlText = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export const GET = async () => {
  // Get all collections
  const gardenPosts = await getCollection("garden", ({ data }) => !data.draft);
  const streamPosts = await getCollection("stream", ({ data }) => !data.draft);
  const nowPosts = await getCollection("now", ({ data }) => !data.draft);

  // Combine and sort all posts
  const allPosts = [...gardenPosts, ...streamPosts, ...nowPosts];
  const sortedPosts = getSortedPosts(allPosts);

  // Helper to get collection-specific description
  const getItemDescription = (post: ContentItem) => {
    let prefix = "";
    switch (post.collection) {
      case "garden":
        prefix = `🌱 Digital Garden Note (${post.data.noteState}) | `;
        break;
      case "stream":
        prefix = `🌊 Stream Resource (${post.data.streamType}) | `;
        break;
      case "now":
        prefix = "📍 Now Update | ";
        break;
    }
    return prefix + post.data.description;
  };

  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    trailingSlash: false,
    items: sortedPosts.map(post => ({
      link: absolutePublicUrl(publicContentPath(post.collection, post.id)),
      title: post.data.title,
      description: getItemDescription(post),
      pubDate: new Date(post.data.publishDatetime),
      customData: `<guid isPermaLink="false">${escapeXmlText(stableRssGuid(post.collection, post.id))}</guid>`,
    })),
  });
};
