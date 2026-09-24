import { getCollection } from "astro:content";
import generateOgImage from "@utils/generateOgImage";
import type { APIRoute } from "astro";
import { createOgImageResponse } from "../lib/og-image-response";

export const GET: APIRoute = async ({ props }) => {
  const body = await generateOgImage(props.postTitle);
  return createOgImageResponse(body);
};

const collections = await Promise.all(
  [getCollection("garden"), getCollection("stream"), getCollection("now")].map(
    p => p.catch(() => [])
  )
);

const posts = collections.flatMap(collection =>
  (collection ?? []).filter(({ data }) => !data.draft)
);

export function getStaticPaths() {
  return posts
    .filter(({ data }) => !data.ogImage)
    .map(({ data, id }) => ({
      params: {
        ogTitle: id,
      },
      props: {
        postTitle: data.title,
      },
    }));
}
