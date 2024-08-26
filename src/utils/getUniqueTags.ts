import type { CollectionEntry } from "astro:content";

const getUniqueTags = (posts: CollectionEntry<"blog">[]) => {
  let tags: string[] = [];
  const filteredPosts = posts.filter(({ data }) => !data.draft);
  filteredPosts.forEach(post => {
    tags = [...tags, ...post.data.tags].filter(
      (value: string, index: number, self: string[]) =>
        self.indexOf(value) === index
    );
  });
  return tags;
};

export default getUniqueTags;
