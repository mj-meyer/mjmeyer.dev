import { slug as slugger } from "github-slugger";
import type { CollectionEntry } from "astro:content";

export const slugifyStr = (str: string) =>
  slugger(str.replace(/[^\w\s]|_/g, ""));

const slugify = (post: CollectionEntry<"garden">["data"]) =>
  post.slug ? slugger(post.slug) : slugger(post.title);

export const slugifyAll = (arr: string[]) => arr.map(str => slugifyStr(str));

export default slugify;
