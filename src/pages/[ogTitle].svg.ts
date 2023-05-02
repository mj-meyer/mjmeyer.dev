import { getCollection } from "astro:content";
import generateOgImage from "@utils/generateOgImage";
import type { APIRoute } from "astro";
import { slugifyStr } from "@utils/slugify";

export const get: APIRoute = async ({ params, props }) => ({
  body: await generateOgImage(params.ogTitle, props.postTitle),
});

const postImportResult = await getCollection("blog", ({ data }) => !data.draft);
const posts = Object.values(postImportResult);

export function getStaticPaths() {
  return posts
    .filter(({ data }) => !data.ogImage)
    .map(({ data }) => ({
      params: {
        ogTitle: slugifyStr(data.title),
      },
      props: {
        postTitle: data.title,
      },
    }));
}
