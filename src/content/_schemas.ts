import { z } from "astro:content";

export const blogSchema = z
  .object({
    author: z.string().optional(),
    pubDatetime: z.date(),
    updatetime: z.date(),
    title: z.string(),
    noteState: z.enum(["stream", "seedling", "budding", "evergreen"]),
    streamType: z
      .enum([
        "article",
        "code",
        "video",
        "podcast",
        "book",
        "course",
        "tool",
        "other",
      ])
      .optional(),
    postSlug: z.string().optional(),
    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).default(["others"]),
    ogImage: z.string().optional(),
    description: z.string(),
  })
  .strict();

export type BlogFrontmatter = z.infer<typeof blogSchema>;
