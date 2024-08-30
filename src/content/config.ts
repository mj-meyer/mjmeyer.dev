import { z, defineCollection } from "astro:content";

const baseSchema = z.object({
  title: z.string(),
  publishDatetime: z.date(),
  updateDatetime: z.date(),
  tags: z.array(z.string()).default([]),
  description: z.string(),
  draft: z.boolean().optional(),
  ogImage: z.string().optional(),
});

const aliasField = {
  alias: z.array(z.string()).optional(),
};

const linkFields = {
  incomingLinks: z.array(z.string()).optional(),
  outgoingLinks: z.array(z.string()).optional(),
};

const gardenCollection = defineCollection({
  type: "content",
  schema: baseSchema.extend({
    ...aliasField,
    ...linkFields,
    noteState: z.enum(["seedling", "budding", "evergreen"]),
  }),
});

const streamCollection = defineCollection({
  type: "content",
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
      "other",
    ]),
  }),
});

// const nowCollection = defineCollection({
//   type: "content",
//   schema: baseSchema.extend({
//     month: z.number().min(1).max(12),
//     year: z.number().min(2000),
//   }),
// });

const pageCollection = defineCollection({
  type: "content",
  schema: baseSchema.extend({
    ...aliasField,
    order: z.number().nonnegative(),
  }),
});

export const collections = {
  garden: gardenCollection,
  stream: streamCollection,
  // now: nowCollection,
  page: pageCollection,
};
