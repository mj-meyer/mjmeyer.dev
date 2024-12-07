import type { CollectionEntry } from "astro:content";

const getUniqueTags = (
  posts: CollectionEntry<"garden" | "stream">[]
): string[] => {
  const tagSet = new Set<string>();

  posts.forEach(post => {
    post.data.tags.forEach(tag => {
      tagSet.add(tag);
    });
  });

  return Array.from(tagSet);
};

export default getUniqueTags;
