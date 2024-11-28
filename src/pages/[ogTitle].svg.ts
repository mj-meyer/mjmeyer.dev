import { getCollection } from "astro:content";
import generateOgImage from "@utils/generateOgImage";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, props }) => {
  const body = await generateOgImage(params.ogTitle, props.postTitle);
  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
    },
  });
};

const collections = await Promise.all([
  getCollection("garden"),
  getCollection("stream"),
  getCollection("now")
].map(p => p.catch(() => [])));

const posts = collections.flatMap(collection => 
  (collection ?? []).filter(({ data }) => !data.draft)
);

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
