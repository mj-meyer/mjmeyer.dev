import type { CollectionEntry } from "astro:content";
import { normalizeTag } from "./tagUtils";

const getPostsByTag = (
  posts: CollectionEntry<"garden" | "stream">[],
  tag: string
) =>
  posts.filter(post =>
    post.data.tags.some(postTag => normalizeTag(postTag) === normalizeTag(tag))
  );

export default getPostsByTag;
