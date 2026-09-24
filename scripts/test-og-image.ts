import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const endpoints = [
  "2023-04-14.svg",
  "chasing-big-goals.svg",
  "creating-something-new.svg",
  "hello-world.svg",
  "learn-coding-through-games.svg",
  "navigating-lifes-seasons.svg",
  "shadcn-taxonomy-taillwind-indicator.svg",
  "software-engineering-excellence.svg",
  "what-is-a-digital-garden.svg",
];

function sourcePngManifest() {
  return readdirSync("public/assets")
    .filter(filename => filename.endsWith(".png"))
    .toSorted()
    .map(filename => {
      const pathname = join("public/assets", filename);
      const stat = statSync(pathname, { bigint: true });
      return {
        filename,
        sha256: createHash("sha256")
          .update(readFileSync(pathname))
          .digest("hex"),
        size: stat.size.toString(),
        mtimeNs: stat.mtimeNs.toString(),
      };
    });
}

const before = sourcePngManifest();
const build = spawnSync("pnpm", ["build"], {
  cwd: process.cwd(),
  encoding: "utf8",
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status ?? 1);

assert.deepEqual(
  sourcePngManifest(),
  before,
  "OG endpoint rendering must not write or replace public/assets PNG files"
);

for (const filename of endpoints) {
  const svg = readFileSync(join("dist", filename), "utf8");
  assert.match(svg, /^<svg\b/, filename);
  assert.match(svg, /\bwidth="1200"/, filename);
  assert.match(svg, /\bheight="630"/, filename);
}

console.log(
  `✅ ${endpoints.length} built OG SVG endpoints validated at 1200x630; ${before.length} source PNG assets were untouched.`
);
