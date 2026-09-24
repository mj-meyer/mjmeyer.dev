# mjmeyer.dev

MJ Meyer’s digital garden, built with Astro. The site publishes garden notes, stream items, dated Now snapshots, discovery pages, and a small set of personal pages through one shared production presentation system.

## Requirements

- Node.js 24
- pnpm

## Setup

```sh
pnpm install --frozen-lockfile
pnpm start
```

The development server uses Astro’s default local address unless host or port flags are supplied.

## Commands

| Command                 | Purpose                                                                         |
| ----------------------- | ------------------------------------------------------------------------------- |
| `pnpm start`            | Start the Astro development server                                              |
| `pnpm build`            | Build the static site and Vercel output                                         |
| `pnpm lint`             | Run ESLint                                                                      |
| `pnpm exec astro check` | Run Astro and TypeScript diagnostics                                            |
| `pnpm test:contracts`   | Check content, catalogue, URL, RSS, and OG contracts                            |
| `pnpm test:journey`     | Run the Playwright browser suite                                                |
| `pnpm test:migration`   | Run contracts, a production build, and browser tests                            |
| `pnpm og:test`          | Build and validate the nine SVG OG endpoints without mutating source PNG assets |
| `pnpm format:check`     | Check repository formatting                                                     |
| `pnpm format`           | Format supported files                                                          |

## Architecture

### Content and catalogue

Published content lives in Astro content collections:

- `src/content/garden` — durable garden notes with growth stages and explicit note links
- `src/content/stream` — short resources with a stream type
- `src/content/now` — dated snapshots

`src/lib/public-catalogue.ts` adapts Astro collections into the typed, build-time catalogue implemented in `src/lib/public-catalogue-core.ts`. Draft entries are excluded. Garden and Stream details publish at root-level `/{slug}` URLs. Topics are discovery tags only; relationships come from explicit outgoing note links, with backlinks derived at build time.

The older files under `src/content/blog` are preserved source material but are not registered public catalogue inputs.

### Routes and layouts

- `src/layouts/GardenLayout.astro` owns the shared shell, metadata, theme-before-paint behavior, ClientRouter integration, header, and footer.
- `src/layouts/GardenReader.astro` renders every Garden and Stream detail page.
- `src/components/garden/DiscoveryIndex.astro` supports Garden, Stream, topic, and Search discovery while retaining server-rendered no-JavaScript listings.
- `src/components/garden/NowSnapshot.astro` owns latest and archived Now pages.
- `src/layouts/AboutLayout.astro` presents About, Uses, and the historical `nowold` page without rewriting their Markdown.
- `src/scripts/garden-lifecycle.ts` owns abortable route setup and teardown for filters, dialogs, theme controls, callouts, contents navigation, previews, footnotes, and optional effects.

Client-side enhancements do not replace native links or server-rendered content. URL-backed discovery state uses replacement history rather than one history entry per keystroke.

### Visual effects and fallbacks

The production shell uses local Space Grotesk and Source Sans 3 fonts from `public/garden/fonts`. Optional React enhancements are mounted lazily and disposed on ClientRouter transitions:

- reduced-motion and compact views keep static pixel fallbacks;
- WebGL is restricted to capable larger viewports and suspends when hidden or offscreen;
- typing remains pausable;
- note previews are supplementary to native anchors.

Source and adaptation notices are retained beside the production components under `src/components/garden/effects` and `src/components/garden/ui`.

### RSS and social images

`/rss.xml` emits slashless public links. Existing collection-prefixed GUID strings remain opaque, non-permalink subscriber identifiers.

The nine `/{id}.svg` routes render 1200×630 SVG cards in memory. They do not write into `public/assets`; existing PNG metadata images there are authoritative static assets.

## Publishing conventions

1. Add or update an entry in the appropriate content collection.
2. Keep authored dates, draft state, stage/type, tags, and explicit note links accurate.
3. Run `pnpm test:migration` before publishing.
4. Review and publish through the project’s normal manual hosting workflow.

This repository does not claim an automated private-vault import or newsletter delivery pipeline.

## Build-network caveats

- OG SVG generation currently fetches Montserrat font files during the build.
- `astro-embed` may require network access while generating supported embed fallbacks.
- The optional Three.js effect produces the largest lazy client chunk; it is intentionally not loaded for compact or reduced-motion pixel rendering.

## Licensing

Repository code is covered by [LICENSE](./LICENSE). Third-party adaptations and local fonts retain their own notices:

- React Bits-derived effects: `src/components/garden/effects/LICENSE.md` and `PROVENANCE.md`
- Base UI/shadcn preview composition: `src/components/garden/ui/LICENSE.md` and `PROVENANCE.md`
- Local font licenses: `public/garden/fonts/*-OFL.txt`

Those component-specific terms and notices remain applicable; they are not replaced by the repository-level license.
