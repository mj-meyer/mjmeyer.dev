import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const baseSchema = z.object({
  title: z.string(),
  publishDatetime: z.date(),
  updateDatetime: z.date(),
  tags: z.array(z.string()).default([]),
  description: z.string(),
  draft: z.boolean().optional(),
  ogImage: z.string().optional(),
  // Second privacy gate: only notes the processor marked public may build.
  publish: z.literal(true),
});

const aliasField = {
  alias: z.array(z.string()).optional(),
};

const linkFields = {
  incomingLinks: z.array(z.string()).optional(),
  outgoingLinks: z.array(z.string()).optional(),
};

const gardenCollection = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/garden" }),
  schema: baseSchema.extend({
    ...aliasField,
    ...linkFields,
    noteState: z.enum(["seedling", "budding", "evergreen"]),
  }),
});

const streamCollection = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/stream" }),
  schema: baseSchema.extend({
    ...aliasField,
    ...linkFields,
    streamType: z.enum([
      "article",
      "code",
      "video",
      "podcast",
      "book",
      "course",
      "tool",
      "service",
      "twitter",
      "x",
      "person",
      "framework",
      "quote",
      "other",
    ]),
    source: z.url().optional(),
    author: z.string().optional(),
  }),
});

const nowCollection = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/now" }),
  schema: z.object({
    title: z.string(),
    publishDatetime: z.date(),
    updateDatetime: z.date(),
    description: z.string(),
    draft: z.boolean().optional(),
    ogImage: z.string().optional(),
    publish: z.literal(true),
  }),
});

export const collections = {
  garden: gardenCollection,
  stream: streamCollection,
  now: nowCollection,
};
