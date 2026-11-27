import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const gate = fileURLToPath(new URL("../../scripts/privacy-gate.mjs", import.meta.url));

const privateProse =
  "My salary negotiation went badly and I am thinking about quitting before the end of the year.";
const publicProse =
  "General methods that scale with computation beat systems built around human domain knowledge.";

const note = (fm, body) => `---\n${fm}\n---\n\n${body}\n`;

// A site checkout with the processor's output, beside a vault.
function fixture({ stream = {}, committed = {}, vault = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), "privacy-gate-"));
  const write = (base, files) => {
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(base, path)), { recursive: true });
      writeFileSync(join(base, path), text);
    }
  };
  write(join(root, "vault"), {
    "Stream/The Bitter Lesson.md": note("type: stream\npublish: true", publicProse),
    "Stream/Salary.md": note("type: stream\npublish: false", privateProse),
    ...vault,
  });
  const site = join(root, "site");
  write(site, {
    "garden-processor.config.json": JSON.stringify({
      source: { vaultPath: "../vault", ignore: ["Journal/"] },
      target: { contentDir: "src/content" },
      collections: [{ id: "stream" }],
    }),
    ...committed,
  });
  execFileSync("git", ["init", "-q"], { cwd: site });
  execFileSync("git", ["add", "."], { cwd: site });
  write(join(site, "src/content/stream"), {
    "the-bitter-lesson.mdx": note("title: The Bitter Lesson\npublish: true", publicProse),
    ...stream,
  });
  return site;
}

const run = site =>
  spawnSync(process.execPath, [gate, "--vault", "../vault"], {
    cwd: site,
    encoding: "utf8",
    env: { ...process.env, CI: "true" },
  });

test("passes output made only from public notes", () => {
  const result = run(fixture());
  assert.equal(result.status, 0, result.stderr);
});

test("fails when a private note is emitted, without naming it", () => {
  const result = run(
    fixture({ stream: { "salary.mdx": note("title: Salary\npublish: true", privateProse) } })
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /stream\/file #[0-9a-f]{10}: no public vault note has its slug/);
  assert.match(result.stderr, /contains text from private note #[0-9a-f]{10}/);
  assert.doesNotMatch(result.stderr, /salary|negotiation/i);
});

test("fails when private prose is pasted into a public note", () => {
  const result = run(
    fixture({
      stream: {
        "the-bitter-lesson.mdx": note(
          "title: The Bitter Lesson\npublish: true",
          `${publicProse}\n\n${privateProse}`
        ),
      },
    })
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /the-bitter-lesson\.mdx: contains text from private note/);
});

test("a note in an ignored folder stays private even with publish: true", () => {
  const result = run(
    fixture({
      vault: { "Journal/Diary.md": note("type: stream\npublish: true", privateProse) },
      stream: { "diary.mdx": note("title: Diary\npublish: true", "Dear diary.") },
    })
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no public vault note has its slug/);
});

test("fails on private fields and a string publish value", () => {
  const result = run(
    fixture({
      vault: { "Stream/Draft.md": note('type: stream\npublish: "true"', "Draft.") },
      stream: {
        "the-bitter-lesson.mdx": note(
          "title: The Bitter Lesson\npublish: true\ninternal: ['[[Agent harness]]']",
          publicProse
        ),
        "draft.mdx": note("title: Draft\npublish: true", "Draft."),
      },
    })
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /emits private field "internal"/);
  assert.match(result.stderr, /stream\/file #[0-9a-f]{10}: no public vault note has its slug/);
});

test("text already committed to the site is not a leak", () => {
  const result = run(
    fixture({
      committed: {
        "src/content/garden/salary.mdx": note("title: Salary\npublish: true", privateProse),
      },
      stream: {
        "the-bitter-lesson.mdx": note(
          "title: The Bitter Lesson\npublish: true",
          `${publicProse}\n\n${privateProse}`
        ),
      },
    })
  );
  assert.equal(result.status, 0, result.stderr);
});
