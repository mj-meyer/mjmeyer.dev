#!/usr/bin/env node
// Privacy gate for the notes publish pipeline.
//
// Checks the processor's output (and optionally the built site) against the
// vault itself, independently of garden-processor, so a processor bug cannot
// publish a private note. A note is public only when its front matter has
// `publish: true` (a real boolean) and it is outside the ignored folders in
// garden-processor.config.json. Everything else in the vault is private.
//
// Usage:
//   node scripts/privacy-gate.mjs --vault <path> [--dist dist] [--reveal]
//
// Text already committed to this repository is public by definition, so
// it counts as public too: the gate flags only private text that would be
// newly published.
//
// Failures name private notes by a short hash of their vault path, because CI
// logs of this public repository are public. Run locally with --reveal to see
// the paths; --reveal is refused when CI is set.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname, basename, dirname } from "node:path";
import { parseArgs } from "node:util";
import { parse as parseYaml } from "yaml";

const { values: args } = parseArgs({
  options: {
    vault: { type: "string" },
    config: { type: "string", default: "garden-processor.config.json" },
    dist: { type: "string" },
    reveal: { type: "boolean", default: false },
  },
});

if (!args.vault) fail(["--vault <path> is required"]);
if (args.reveal && process.env.CI) fail(["--reveal is refused in CI"]);

const config = JSON.parse(readFileSync(args.config, "utf8"));
const contentDir = config.target.contentDir;
const ignored = config.source.ignore ?? [];
const publishKey = "publish"; // the vault convention, not read from the processor config
const generatedDirs = config.collections.map(c => join(contentDir, c.id));

// Front matter keys the processor must never emit.
const FORBIDDEN_KEYS = [
  "sourceDoc",
  "internal",
  "accessed",
  "depth",
  "coverage",
  "gaps",
];
const SHINGLE = 8; // words per fingerprint window
const LEAK_THRESHOLD = 3; // shared windows that count as a leak

const slugify = s =>
  s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
const noteId = path =>
  createHash("sha256").update(path).digest("hex").slice(0, 10);
const label = path => (args.reveal ? path : `private note #${noteId(path)}`);

function walk(dir, keep, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const full = join(dir, name);
    const stat = statSync(full, { throwIfNoEntry: false }); // skip broken links
    if (stat?.isDirectory()) walk(full, keep, out);
    else if (stat && keep(full)) out.push(full);
  }
  return out;
}

function splitFrontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: text, ok: true };
  try {
    return { data: parseYaml(m[1], { logLevel: "silent" }) ?? {}, body: text.slice(m[0].length), ok: true };
  } catch {
    return { data: {}, body: text.slice(m[0].length), ok: false };
  }
}

// Reduce Markdown or HTML to blocks of lowercase words so the same prose
// matches across the vault, the processed MDX, and the rendered pages.
// Windows never span blocks, because list numbers and headings render
// differently in each.
const BLOCK_TAG =
  /<\/?(a|p|li|h[1-6]|div|blockquote|tr|td|th|br|ul|ol|pre|section|article|header|footer|nav|figure|figcaption|table|title|item|description)\b[^>]*>/gi;
function blocks(text, html = false) {
  let t = text;
  if (html) {
    t = t
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "\n")
      .replace(BLOCK_TAG, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&#x27;|&#39;|&apos;|&rsquo;|&lsquo;/g, "'")
      .replace(/&[a-z0-9#]+;/gi, " ");
  } else {
    t = t
      .replace(/!?\[\[([^\]|]*)\|?([^\]]*)\]\]/g, (_, a, b) => b || a)
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/https?:\/\/\S+/g, " ");
  }
  return t.split("\n").map(line =>
    line
      .toLowerCase()
      .replace(/[’‘']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
  );
}

function shingles(parts) {
  const out = new Set();
  for (const ws of parts)
    for (let i = 0; i + SHINGLE <= ws.length; i++)
      out.add(ws.slice(i, i + SHINGLE).join(" "));
  return out;
}

// 1. Classify every vault note.
const vault = args.vault;
const isHidden = rel => rel.split("/").some(seg => seg.startsWith("."));
const isIgnored = rel => ignored.some(prefix => rel.startsWith(prefix));
const publicSlugs = new Set();
const publicShingles = new Set();
const privateNotes = [];
for (const file of walk(vault, f => extname(f) === ".md")) {
  const rel = relative(vault, file);
  const text = readFileSync(file, "utf8");
  const { data, body, ok } = splitFrontMatter(text);
  const isPublic =
    ok && data[publishKey] === true && !isIgnored(rel) && !isHidden(rel);
  const slug = slugify(basename(rel, ".md"));
  if (isPublic) {
    publicSlugs.add(slug);
    for (const s of shingles(blocks(text))) publicShingles.add(s);
  } else {
    privateNotes.push({ rel, slug, body });
  }
}

// Committed site files (Garden, Now, pages, fonts) are already public.
const tracked = execFileSync("git", ["ls-files", "-z", "src", "public"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(f => /\.(mdx?|astro|ts|txt|html|json)$/.test(f) && existsSync(f));
for (const file of tracked)
  for (const s of shingles(blocks(readFileSync(file, "utf8"))))
    publicShingles.add(s);

// A file named after a private note would name that note in a public log.
const privateSlugs = new Set(
  privateNotes.map(n => n.slug).filter(slug => !publicSlugs.has(slug))
);
const shown = file => {
  const name = basename(file).replace(/\.[^.]+$/, "");
  const slug = name === "index" ? basename(dirname(file)) : name;
  return args.reveal || !privateSlugs.has(slug)
    ? file
    : join(dirname(file), `file #${noteId(file)}`);
};

const problems = [];

// 2. Check what the processor generated.
const corpus = []; // { where, shingles }
for (const dir of generatedDirs) {
  if (!existsSync(dir)) continue;
  const files = walk(dir, () => true);
  const noteFiles = files.filter(f => /\.mdx?$/.test(f));
  const noteText = [];
  for (const file of noteFiles) {
    const text = readFileSync(file, "utf8");
    const { data, body, ok } = splitFrontMatter(text);
    const slug = basename(file).replace(/\.mdx?$/, "");
    if (!ok) problems.push(`${shown(file)}: front matter does not parse`);
    if (data.publish !== true)
      problems.push(`${shown(file)}: front matter lacks publish: true`);
    if (!publicSlugs.has(slug))
      problems.push(`${shown(file)}: no public vault note has its slug`);
    for (const key of FORBIDDEN_KEYS)
      if (key in data) problems.push(`${shown(file)}: emits private field "${key}"`);
    if (body.includes("<!--"))
      problems.push(`${shown(file)}: contains an HTML comment`);
    noteText.push(text);
    corpus.push({ where: file, shingles: shingles(blocks(text)) });
  }
  for (const file of files) {
    if (/\.mdx?$/.test(file)) continue;
    const name = basename(file);
    if (!noteText.some(t => t.includes(name)))
      problems.push(`${shown(file)}: asset no published note embeds`);
  }
}

// 3. Check the built site.
if (args.dist) {
  if (!existsSync(args.dist)) fail([`--dist ${args.dist} does not exist`]);
  const pages = walk(args.dist, f => /\.(html|xml|json|txt)$/.test(f));
  for (const file of pages)
    corpus.push({
      where: file,
      shingles: shingles(blocks(readFileSync(file, "utf8"), true)),
    });
}

// 4. Fingerprint every private note against everything that would ship.
// Windows a public note also contains (a shared quote) do not count.
for (const note of privateNotes) {
  const own = [...shingles(blocks(note.body))].filter(s => !publicShingles.has(s));
  if (own.length === 0) continue;
  for (const { where, shingles: have } of corpus) {
    const shared = own.filter(s => have.has(s)).length;
    if (shared >= LEAK_THRESHOLD)
      problems.push(`${shown(where)}: contains text from ${label(note.rel)} (${shared} passages)`);
  }
}

if (problems.length) fail(problems);
console.log(
  `privacy gate: passed (${publicSlugs.size} public and ${privateNotes.length} private vault notes; ` +
    `${corpus.length} shipped files checked)`
);

function fail(lines) {
  console.error("privacy gate: FAILED");
  for (const line of lines) console.error(`  - ${line}`);
  process.exit(1);
}
