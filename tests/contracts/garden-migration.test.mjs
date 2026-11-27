import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { parse } from "yaml";
import {
  buildPublicCatalogue,
  normalizeContentId,
  resolveCatalogueHref,
} from "../../src/lib/public-catalogue-core.ts";

const expectedHashes = {
  "src/content/blog/hello-world.md": "f400dae814cd17307841d341a5ca71c08e7855efa4d3fc460a6909f8ff859cfb",
  "src/content/blog/what-is-a-digital-garden.md": "4e67211d89c9982d123c33fcf4592fcc9b590fcc6c103bdb7315a73615c53973",
  "src/content/garden/chasing-big-goals.mdx": "6572cb2c28abd2658c4900bcea73c4781deaa2fa77344e9da6ae22dcc22ceb45",
  "src/content/garden/creating-something-new.mdx": "36c39b1837faebdf8383e7aa81508689ccbcb50396b5ec62e8b06b42211ce17d",
  "src/content/garden/hello-world.mdx": "b4c454300521b4043af5dbd80c50349d953e6db5f6f693cbba483a50a9d4564d",
  "src/content/garden/learn-coding-through-games.mdx": "05ef56d557ddc4a1e950ac8be0691fcd764302d72fd5499241f361fd65d20104",
  "src/content/garden/navigating-lifes-seasons.mdx": "c1a377c650ac4ca15c66807e27d4fa0e6fe9af8b4459c3d8abbef7204de6f875",
  "src/content/garden/software-engineering-excellence.mdx": "b31806a4f4d1008bc4d6b73a9785c444b5526a8abe8dfe0eb992290c8b679dbe",
  "src/content/garden/what-is-a-digital-garden.mdx": "62bf3e9264f75682fe87d26bb0168579555ad812d1daf2402e4471042025a127",
  "src/content/now/2023-04-14.mdx": "9b2084934e378b191d3cf316bc43557399af4fdb9713cfd981e024a38c89f7ce",
  "src/content/stream/shadcn-taxonomy-taillwind-indicator.mdx": "170d3212b779478cf157f8dead563e08fbbfb9bb4778e6ab75209fad852e31e0",
};
const personalPageHashes = {
  "src/pages/about.md": "8333a75611af7282715c49432e5accc4719fe92c9c4ff96630f95138e3827e89",
  "src/pages/uses.md": "079f3aa72dc81b8a5b009ae34574de15da6febf6984741fbbb0347959ec9cace",
  "src/pages/nowold.md": "911f3d43528146bbc42c0eb014c22715baa0f116abdd1b4adc3dc949f0f22169",
};
const entryIds = ["software-engineering-excellence", "chasing-big-goals", "creating-something-new", "navigating-lifes-seasons"]; 
const latestIds = ["hello-world", "what-is-a-digital-garden", "shadcn-taxonomy-taillwind-indicator", "learn-coding-through-games"];
const expectedEdges = [
  ["software-engineering-excellence", "chasing-big-goals"],
  ["software-engineering-excellence", "learn-coding-through-games"],
  ["chasing-big-goals", "what-is-a-digital-garden"],
];
function frontmatter(source) { const match = source.match(/^---\n([\s\S]*?)\n---/); assert.ok(match, "frontmatter is present"); return parse(match[1]); }

test("authorized public content remains byte-for-byte unchanged", async () => {
  for (const [path, expected] of Object.entries(expectedHashes)) {
    const digest = createHash("sha256").update(await readFile(path)).digest("hex");
    assert.equal(digest, expected, path);
  }
});

test("published personal-page Markdown remains byte-for-byte unchanged", async () => {
  for (const [path, expected] of Object.entries(personalPageHashes)) {
    const digest = createHash("sha256").update(await readFile(path)).digest("hex");
    assert.equal(digest, expected, path);
  }
});

test("all public root notes use the shared production reader", async () => {
  const route = await readFile("src/pages/[slug].astro", "utf8");
  assert.match(route, /<GardenReader post=\{post\} \/>/);
  assert.doesNotMatch(route, /PostDetails/);
});

test("production catalogue preserves entry points, activity chronology, and the real graph", async () => {
  const sources = [];
  for (const kind of ["garden", "stream"]) {
    for (const filename of await readdir(`src/content/${kind}`)) {
      if (!/\.mdx?$/.test(filename)) continue;
      const id = filename.replace(/\.mdx?$/, "");
      const data = frontmatter(await readFile(`src/content/${kind}/${filename}`, "utf8"));
      sources.push({
        id,
        kind,
        title: data.title,
        description: data.description,
        publishDatetime: new Date(data.publishDatetime),
        updateDatetime: new Date(data.updateDatetime),
        tags: data.tags ?? [],
        draft: data.draft,
        state: data.noteState,
        streamType: data.streamType,
        incomingLinks: data.incomingLinks,
        outgoingLinks: data.outgoingLinks,
      });
    }
  }
  const catalogue = buildPublicCatalogue(sources);
  assert.deepEqual(catalogue.entryPoints.map(item => item.id), entryIds);
  assert.deepEqual(catalogue.activity.map(item => item.id), latestIds);
  const edges = catalogue.items.flatMap(item => item.outgoingIds.map(target => [item.id, target]));
  assert.deepEqual(edges.toSorted((a, b) => a.join("/").localeCompare(b.join("/"))), expectedEdges.toSorted((a, b) => a.join("/").localeCompare(b.join("/"))));
  assert.deepEqual(catalogue.diagnostics, []);
});

test("production URL normalization accepts only intended local content forms", () => {
  const accepted = new Map([
    ["target", "target"],
    [" target ", "target"],
    ["/target", "target"],
    ["./target", "target"],
    ["/garden/target", "target"],
    ["/stream/target.mdx", "target"],
    ["target.md", "target"],
    ["/garden/target.html?view=source#section", "target"],
    ["https://mjmeyer.dev/target", "target"],
    ["https://mjmeyer.dev/stream/target.mdx#section", "target"],
  ]);
  for (const [href, id] of accepted) assert.equal(normalizeContentId(href), id, href);

  const rejected = [
    "",
    "#section",
    "/unpublished?note=target",
    "https://external.example/target",
    "https://mjmeyer.dev.external.example/target",
    "https://mjmeyer.dev@external.example/target",
    "http://mjmeyer.dev/target",
    "//external.example/target",
    "//mjmeyer.dev/target",
    "\\\\external.example\\target",
    "mailto:target",
    "javascript:target",
    "data:text/plain,target",
    "ftp://mjmeyer.dev/target",
    "blob:https://mjmeyer.dev/target",
    "https://user@mjmeyer.dev/target",
    "http://[",
    "not a url",
    "/garden/too/many/segments",
  ];
  for (const href of rejected) assert.equal(normalizeContentId(href), undefined, href);
});

test("production catalogue excludes colliding foreign links from the graph", () => {
  const rejectedEdges = [
    "https://external.example/target",
    "//external.example/target",
    "mailto:target",
    "javascript:target",
    "data:text/plain,target",
  ];
  const date = new Date("2024-01-01T00:00:00.000Z");
  const source = {
    kind: "garden",
    description: "fixture",
    publishDatetime: date,
    updateDatetime: date,
    tags: [],
  };
  const catalogue = buildPublicCatalogue([
    { ...source, id: "source", title: "Source", outgoingLinks: ["target", "https://mjmeyer.dev/garden/other.mdx", ...rejectedEdges] },
    { ...source, id: "target", title: "Target", incomingLinks: ["source"] },
    { ...source, id: "other", title: "Other", incomingLinks: ["source"] },
    { ...source, id: "draft-collision", title: "Draft", draft: true, outgoingLinks: ["target"] },
  ]);
  assert.deepEqual(catalogue.byId.get("source").outgoingIds, ["other", "target"]);
  assert.deepEqual(catalogue.byId.get("target").incomingIds, ["source"]);
  assert.deepEqual(catalogue.byId.get("other").incomingIds, ["source"]);
  assert.equal(catalogue.byId.has("draft-collision"), false);
  assert.deepEqual(
    catalogue.diagnostics.filter(diagnostic => diagnostic.type === "unknown-outgoing-link").map(diagnostic => diagnostic.detail),
    rejectedEdges
  );
  assert.equal(catalogue.diagnostics.some(diagnostic => diagnostic.type === "incoming-link-disagreement"), false);
});

test("the production Reader resolver retains foreign destinations and resolves local notes", async () => {
  const item = { url: "/target" };
  const byId = new Map([["target", item]]);
  assert.deepEqual(resolveCatalogueHref("target#section", byId), { destination: "/target#section", item });
  assert.deepEqual(resolveCatalogueHref("https://mjmeyer.dev/target", byId), { destination: "/target", item });
  for (const href of ["https://external.example/target#section", "//external.example/target", "mailto:target", "javascript:target", "data:text/plain,target"]) {
    assert.deepEqual(resolveCatalogueHref(href, byId), { destination: href, item: undefined }, href);
  }

  const authored = await readFile("src/content/garden/chasing-big-goals.mdx", "utf8");
  assert.match(authored, /\]\(what-is-a-digital-garden\)/);
  const readerLink = await readFile("src/components/garden/ReaderLink.astro", "utf8");
  assert.match(readerLink, /resolveCatalogueHref\(href, catalogue\.byId\)/);
  assert.match(readerLink, /href=\{destination\}/);
  assert.match(readerLink, /data-preview-note=\{item\?\.id\}/);
});
