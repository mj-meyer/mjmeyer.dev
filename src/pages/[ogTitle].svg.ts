import { getCollection } from "astro:content";
import generateOgImage from "@utils/generateOgImage";
import type { APIRoute } from "astro";

export const get: APIRoute = async ({ params, props }) => {
  const body = await generateOgImage(params.ogTitle, props.postTitle);
  return new Response(body, {
    headers: {
      "Content-Type": "image/png", // Adjust this if your image is not a PNG
    },
  });
};

const postImportResult = await getCollection("blog", ({ data }) => !data.draft);
const posts = Object.values(postImportResult);

export function getStaticPaths() {
  return posts
    .filter(({ data }) => !data.ogImage)
    .map(({ data, slug }) => ({
      params: {
        ogTitle: slug,
      },
      props: {
        postTitle: data.title,
      },
    }));
}
