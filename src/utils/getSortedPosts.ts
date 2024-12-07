import type { CollectionEntry } from "astro:content";

type PostsType = CollectionEntry<"garden" | "stream" | "now">[];

const getSortedPosts = (posts: PostsType): PostsType =>
  posts
    .filter(({ data }) => !data.draft)
    .sort(
      (a, b) =>
        Math.floor(new Date(b.data.publishDatetime).getTime() / 1000) -
        Math.floor(new Date(a.data.publishDatetime).getTime() / 1000)
    );

export default getSortedPosts;
