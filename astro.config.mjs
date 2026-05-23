import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config";
import tokyoNight from "./shiki-themes/tokyo-night-theme.json";
import vercel from "@astrojs/vercel";
import rehypeExternalLinks from "rehype-external-links";
import mdx from "@astrojs/mdx";
import embeds from "astro-embed/integration";
import remarkObsidianCallout from "remark-obsidian-callout";
import { rehypeUnpublishedLinks } from './src/utils/rehypeUnpublishedLinks'

// Tailwind v4 renders opacity modifiers (e.g. `bg-skin-card/30`) as
// `color-mix(in oklab, <color> 30%, transparent)`, which differs from Tailwind
// v3's `rgba(<channels>, 0.3)` by ~1-2/255. Mixing in `srgb` against a fully
// transparent color is mathematically identical to that rgba() (premultiplied
// alpha preserves the hue), so rewriting the interpolation space to srgb makes
// every translucent element byte-identical to the previous (v3) build.
const swapOklab = css => css.replaceAll("color-mix(in oklab", "color-mix(in srgb");
const oklabToSrgb = {
  name: "tw-color-mix-oklab-to-srgb",
  enforce: "post",
  // Dev: CSS is served per-module; rewrite as it passes through.
  transform(code, id) {
    if (id.includes(".css") && code.includes("color-mix(in oklab")) {
      return { code: swapOklab(code), map: null };
    }
  },
  // Build: Tailwind injects its generated CSS into the final asset after the
  // transform stage, so rewrite the emitted CSS assets too.
  generateBundle(_options, bundle) {
    for (const file of Object.values(bundle)) {
      if (file.type === "asset" && file.fileName.endsWith(".css") && typeof file.source === "string") {
        file.source = swapOklab(file.source);
      }
    }
  },
};

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  integrations: [
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
  },
  vite: {
    plugins: [tailwindcss(), oklabToSrgb],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  output: "static",
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
});
