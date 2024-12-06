import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config";
import tokyoNight from "./shiki-themes/tokyo-night-theme.json";
import vercel from "@astrojs/vercel/static";
import rehypeExternalLinks from "rehype-external-links";
import mdx from "@astrojs/mdx";
import embeds from "astro-embed/integration";
import remarkObsidianCallout from "remark-obsidian-callout";
import { rehypeUnpublishedLinks } from './src/utils/rehypeUnpublishedLinks'

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  integrations: [
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
    react(),
    sitemap(),
    embeds(),
    mdx(),
  ],
  markdown: {
    remarkPlugins: [
      [
        remarkObsidianCallout,
        {
          blockquoteClass: "callout not-prose",
        },
      ],
      remarkToc,
      [
        remarkCollapse,
        {
          test: "Table of contents",
        },
      ],
    ],
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          content: {
            type: "element",
            tagName: "span",
            properties: {
              className: "External link icon",
            },
            children: [],
          },
          contentProperties: {
            className: ["external-link-icon"],
          },
        },
      ],
      rehypeUnpublishedLinks,
    ],
    shikiConfig: {
      theme: {
        name: "tokyo-night",
        type: "dark",
        settings: tokyoNight.tokenColors,
      },
      wrap: true,
    },
    extendDefaultPlugins: true,
  },
  vite: {
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  output: "static",
  adapter: vercel({
    analytics: true,
  }),
});
