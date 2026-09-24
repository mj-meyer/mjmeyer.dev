import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import {
  createOgImageResponse,
  OG_SVG_CONTENT_TYPE,
} from "../../src/lib/og-image-response.ts";
import {
  absolutePublicUrl,
  nowArchivePath,
  publicContentPath,
  stableRssGuid,
} from "../../src/lib/public-urls.ts";

const authoritativePngHashes = {
  "20230414.png": "e56a860516a01d0996e136ae7173955f0a7810866e68c8381c5ea8e25eda7fa9",
  "a-very-long-title-that-might-wrap-to-multiple-lines-and-need-special-handling-in-the-layout-and-maybe-could-extend-even-more-i-want-it-to-cut-off-so-we-can-see-what-happens-with-this-text.png":
    "de3f50ef9e485e53d449bf0d1e2a80475ed1ad8687802d1a767b2067c8b7a165",
  "a-very-long-title-that-might-wrap-to-multiple-lines-and-need-special-handling-in-the-layout.png":
    "b1d4fdca4c82f44288bd21c9c49d5bcc0f4a0fc0c454e4e042ef809b16d64729",
  "building-is-where-the-magic-happens.png":
    "77f03340d0250303baedd2661507e08383972f0b0de46500f399f10053553fa4",
  "chasingbiggoals.png": "88ef3d0f7ca440d965582a1aba535b7d76c9caf96ce7a074ef0524d12055820d",
  "creatingsomethingnew.png": "34a25bf73ec2fa60eb8d4988e345fe6092c6b4034100170d73a26b87e2268245",
  "helloworld.png": "5c106b2453fb6ba281231bd9c6d8dcf462672fa52ad3860123f45016ac9f40f4",
  "learncodingthroughgames.png": "198bc58b802c17f159d60597d64d0de79f48ff86129d76b251446701fdbbe0bc",
  "logo.png": "89aa21addfa8e04f9cfdc81ded320fd4129bd862fdd8743ae8ca75eff8fb3e1c",
  "navigatinglifesseasons.png": "0e3068d0b50699019acdfd7a6801a1e711fea6235da2c1528dd80b1e6084fd39",
  "shadcntaxonomytaillwindindicator.png":
    "16c33741dbdc8d69477916b382a2b73794f9bd9fdb848992718cf6b099340df1",
  "short-title.png": "56cec67c11a87de3d04e819aa3a92446481327edf32e3c189a3f0aa46f6c454c",
  "softwareengineeringexcellence.png":
    "ec8a45528c238e9b819b54daf1d41ac44080d654fe277923b5578e5fd77fd488",
  "this-is-a-test-title.png": "28e96fe7e48b3377142625f06371480e7dc285bc21690586ed4898ec225110f0",
  "whatisadigitalgarden.png": "04388a5e9065e3e1028904150ca943a19381989139d3b4e6519423894cb981c9",
};

const feedEntries = [
  ["garden", "chasing-big-goals", "/chasing-big-goals"],
  ["garden", "navigating-lifes-seasons", "/navigating-lifes-seasons"],
  ["garden", "software-engineering-excellence", "/software-engineering-excellence"],
  ["garden", "creating-something-new", "/creating-something-new"],
  ["garden", "what-is-a-digital-garden", "/what-is-a-digital-garden"],
  ["garden", "hello-world", "/hello-world"],
  ["stream", "shadcn-taxonomy-taillwind-indicator", "/shadcn-taxonomy-taillwind-indicator"],
  ["now", "2023-04-14", "/now/2023/04"],
  ["garden", "learn-coding-through-games", "/learn-coding-through-games"],
];

test("production public URL mapping keeps RSS links canonical and GUIDs stable", async () => {
  assert.equal(nowArchivePath("2023-04-14"), "/now/2023/04");

  for (const [collection, id, pathname] of feedEntries) {
    assert.equal(publicContentPath(collection, id), pathname);
    assert.equal(absolutePublicUrl(pathname), `https://mjmeyer.dev${pathname}`);
    assert.equal(
      stableRssGuid(collection, id),
      `https://mjmeyer.dev/${collection}/${id}/`
    );
  }

  const nowSnapshot = await readFile(
    "src/components/garden/NowSnapshot.astro",
    "utf8"
  );
  assert.match(nowSnapshot, /nowArchivePath\(entry\.id\)/);
});

test("OG production response is SVG and rendering cannot write source PNGs", async () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"></svg>';
  const response = createOgImageResponse(svg);
  assert.equal(response.headers.get("content-type"), OG_SVG_CONTENT_TYPE);
  assert.equal(await response.text(), svg);

  const route = await readFile("src/pages/[ogTitle].svg.ts", "utf8");
  assert.match(route, /createOgImageResponse\(body\)/);
  assert.doesNotMatch(route, /image\/png/);

  const generator = await readFile("src/utils/generateOgImage.tsx", "utf8");
  assert.doesNotMatch(generator, /writeFile|Resvg|public\/assets|asPng/);
  assert.match(generator, /satori\(ogImage\(postTitle\), options\)/);
});

test("authoritative static PNG metadata assets remain byte-identical", async () => {
  const pngs = (await readdir("public/assets"))
    .filter(filename => filename.endsWith(".png"))
    .toSorted();
  assert.deepEqual(pngs, Object.keys(authoritativePngHashes).toSorted());

  for (const filename of pngs) {
    const digest = createHash("sha256")
      .update(await readFile(`public/assets/${filename}`))
      .digest("hex");
    assert.equal(digest, authoritativePngHashes[filename], filename);
  }
});
