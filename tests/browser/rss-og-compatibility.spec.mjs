import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const ogSvgPaths = [
  "/2023-04-14.svg",
  "/chasing-big-goals.svg",
  "/creating-something-new.svg",
  "/hello-world.svg",
  "/learn-coding-through-games.svg",
  "/navigating-lifes-seasons.svg",
  "/shadcn-taxonomy-taillwind-indicator.svg",
  "/software-engineering-excellence.svg",
  "/what-is-a-digital-garden.svg",
];

const expectedLinks = [
  "https://mjmeyer.dev/chasing-big-goals",
  "https://mjmeyer.dev/navigating-lifes-seasons",
  "https://mjmeyer.dev/software-engineering-excellence",
  "https://mjmeyer.dev/creating-something-new",
  "https://mjmeyer.dev/what-is-a-digital-garden",
  "https://mjmeyer.dev/hello-world",
  "https://mjmeyer.dev/shadcn-taxonomy-taillwind-indicator",
  "https://mjmeyer.dev/now/2023/04",
  "https://mjmeyer.dev/learn-coding-through-games",
];

async function parseFeed(page, source) {
  return page.evaluate(xml => {
    const document = new DOMParser().parseFromString(xml, "application/xml");
    if (document.querySelector("parsererror")) {
      throw new Error(document.querySelector("parsererror").textContent);
    }
    return [...document.querySelectorAll("channel > item")].map(item => {
      const guids = item.querySelectorAll(":scope > guid");
      return {
        title: item.querySelector(":scope > title")?.textContent,
        link: item.querySelector(":scope > link")?.textContent,
        description: item.querySelector(":scope > description")?.textContent,
        pubDate: item.querySelector(":scope > pubDate")?.textContent,
        guidCount: guids.length,
        guid: guids[0]?.textContent,
        isPermaLink: guids[0]?.getAttribute("isPermaLink"),
      };
    });
  }, source);
}

test("RSS preserves subscriber identity while linking to canonical public routes", async ({
  page,
  request,
}) => {
  const response = await request.get("/rss.xml");
  expect(response.ok()).toBe(true);
  const current = await parseFeed(page, await response.text());
  const baseline = await parseFeed(
    page,
    await readFile("tests/fixtures/rss-before-url-fix.xml", "utf8")
  );

  expect(current).toHaveLength(9);
  expect(
    current.map(({ title, description, pubDate }) => ({
      title,
      description,
      pubDate,
    }))
  ).toEqual(
    baseline.map(({ title, description, pubDate }) => ({
      title,
      description,
      pubDate,
    }))
  );
  expect(current.map(item => item.link)).toEqual(expectedLinks);

  for (const [index, item] of current.entries()) {
    expect(item.guidCount).toBe(1);
    expect(item.guid).toBe(baseline[index].guid);
    expect(item.isPermaLink).toBe("false");
    expect(item.link).not.toMatch(/\/$/);
    expect(item.link).not.toMatch(/mjmeyer\.dev\/(garden|stream)\//);

    const pathname = new URL(item.link).pathname;
    const pageResponse = await request.get(pathname);
    expect(pageResponse.ok(), pathname).toBe(true);
    expect(await pageResponse.text()).toContain(
      `<link rel="canonical" href="${item.link}">`
    );
  }
});

test("published OG endpoints retain SVG bodies, dimensions, and MIME", async ({
  page,
  request,
}) => {
  for (const pathname of ogSvgPaths) {
    const response = await request.get(pathname);
    expect(response.ok(), pathname).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
    const body = await response.text();
    const dimensions = await page.evaluate(svg => {
      const document = new DOMParser().parseFromString(svg, "image/svg+xml");
      const error = document.querySelector("parsererror");
      return error
        ? { error: error.textContent }
        : {
            name: document.documentElement.localName,
            width: document.documentElement.getAttribute("width"),
            height: document.documentElement.getAttribute("height"),
          };
    }, body);
    expect(dimensions, pathname).toEqual({
      name: "svg",
      width: "1200",
      height: "630",
    });
  }
});
