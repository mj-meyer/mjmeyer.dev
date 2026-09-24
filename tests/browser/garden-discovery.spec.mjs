import { test, expect } from "@playwright/test";

const topicPaths = [
  "/topics/continuous-learning",
  "/topics/digital-garden",
  "/topics/faith",
  "/topics/family",
  "/topics/feedback-loops",
  "/topics/friends",
  "/topics/frontend",
  "/topics/goal-setting",
  "/topics/indie-hacking",
  "/topics/life-lessons",
  "/topics/map-of-content",
  "/topics/note-taking",
  "/topics/personal-growth",
  "/topics/projects",
  "/topics/software-engineering",
  "/topics/systems",
  "/topics/tailwind-css",
];
const discoveryPaths = [
  "/garden",
  "/garden/1",
  "/garden/2",
  "/garden/3",
  "/garden/seedling",
  "/garden/budding",
  "/garden/evergreen",
  "/stream",
  "/stream/1",
  "/stream/twitter",
  "/topics",
  ...topicPaths,
  "/search",
];

async function visibleIds(page) {
  return page
    .locator("[data-discovery-item]:visible")
    .evaluateAll(elements => elements.map(element => element.dataset.contentId));
}

async function assertMetadata(page, path, title, description) {
  await page.goto(path);
  expect(await page.title()).toBe(`${title} | MJ Meyer`);
  await expect(page.locator("title")).toHaveCount(1);
  await expect(page.locator("link[rel='canonical']")).toHaveCount(1);
  await expect(page.locator("link[rel='canonical']")).toHaveAttribute(
    "href",
    `https://mjmeyer.dev${path.split("?")[0].replace(/\/$/, "")}`
  );
  await expect(page.locator("meta[name='description']")).toHaveAttribute(
    "content",
    description
  );
  await expect(page.locator("meta[property='og:url']")).toHaveCount(1);
  await expect(page.locator("meta[property='twitter:url']")).toHaveCount(1);
}

test("all concrete discovery paths build with coherent static content and metadata", async ({ page, request }) => {
  for (const path of discoveryPaths) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
  }
  for (const path of [
    "/garden/4",
    "/garden/not-a-stage",
    "/stream/2",
    "/stream/not-a-type",
    "/topics/not-a-topic",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }

  await assertMetadata(
    page,
    "/garden",
    "Digital Garden Notes",
    "Notes on software and life. Follow a question, explore a connection, or see what’s been growing."
  );
  await expect(page.locator("[data-content-id]")).toHaveCount(7);
  await expect(page.getByText(/Numbered page URLs remain available/)).toHaveCount(0);
  expect(new Set(await page.locator("[data-content-id]").evaluateAll(nodes => nodes.map(node => node.dataset.contentId))).size).toBe(7);
  const entryPointLinks = page.locator(
    ".discovery-entry-nav [data-entry-point-id]"
  );
  await expect(entryPointLinks).toHaveCount(4);
  expect(
    await entryPointLinks.evaluateAll(links =>
      links.map(link => ({
        id: link.dataset.entryPointId,
        icon: link.dataset.entryPointIcon,
      }))
    )
  ).toEqual([
    { id: "software-engineering-excellence", icon: "code-2" },
    { id: "chasing-big-goals", icon: "target" },
    { id: "creating-something-new", icon: "lightbulb" },
    { id: "navigating-lifes-seasons", icon: "compass" },
  ]);
  await expect(page.getByRole("navigation", { name: "Garden pages" }).getByRole("link")).toHaveCount(3);
  await expect(page.getByRole("navigation", { name: "Garden pages" }).getByRole("link", { name: "Page 2" })).toHaveAttribute("href", "/garden/2");

  for (const [path, count] of [
    ["/garden/1", 3],
    ["/garden/2", 3],
    ["/garden/3", 1],
    ["/garden/seedling", 5],
    ["/garden/budding", 2],
  ]) {
    await page.goto(path);
    await expect(page.locator("[data-content-id]:visible")).toHaveCount(count);
  }
  await page.goto("/garden/evergreen");
  await expect(page.locator("[data-content-id]:visible")).toHaveCount(0);
  await expect(page.locator("[data-discovery-empty]")).toContainText("No evergreen notes yet");
  await expect(page.getByText(/stable path|canonical URL/)).toHaveCount(0);

  for (const path of ["/stream", "/stream/1", "/stream/twitter"]) {
    await page.goto(path);
    await expect(page.locator("[data-content-id='shadcn-taxonomy-taillwind-indicator']")).toHaveCount(1);
  }
  await page.goto("/stream");
  await expect(page.getByRole("navigation", { name: "Stream pages" }).getByRole("link", { name: "Page 1" })).toHaveAttribute("href", "/stream/1");
  await page.goto("/topics");
  await expect(page.locator(".topic-directory [data-discovery-item]")).toHaveCount(17);
  await page.goto("/search");
  await expect(page.locator("[data-content-id]")).toHaveCount(8);

  await assertMetadata(
    page,
    "/search?q=digital",
    "Search",
    "Search published garden and stream notes by title, description, or topic."
  );
  await expect(page.locator("link[rel='canonical']")).toHaveAttribute(
    "href",
    "https://mjmeyer.dev/search"
  );
  await expect(page.getByText(/history entry|per character/)).toHaveCount(0);
});

test("Garden filtering, sorting, reset, reload, and static route context stay coherent", async ({ page }) => {
  await page.goto("/garden");
  await expect(page.locator("[data-discovery-item]:visible")).toHaveCount(7);
  const initialHistoryLength = await page.evaluate(() => history.length);
  const search = page.getByRole("searchbox", { name: "Find a note" });
  await search.fill("digital");
  await expect(page).toHaveURL(/\?q=digital$/);
  expect(await page.evaluate(() => history.length)).toBe(initialHistoryLength);
  await expect(page.locator("[data-discovery-item]:visible")).toHaveCount(2);

  await page.getByLabel("Growth stage").selectOption("budding");
  await expect(page).toHaveURL(/stage=budding/);
  await expect(page.locator("[data-discovery-item]:visible")).toHaveCount(1);
  expect(await page.locator("[data-discovery-item]:visible").getAttribute("data-filter-value")).toBe("budding");

  await page.getByLabel("Order").selectOption("title");
  await expect(page).toHaveURL(/sort=title/);
  const beforeReload = await visibleIds(page);
  await page.reload();
  await expect(search).toHaveValue("digital");
  await expect(page.getByLabel("Growth stage")).toHaveValue("budding");
  await expect(page.getByLabel("Order")).toHaveValue("title");
  expect(await visibleIds(page)).toEqual(beforeReload);

  await search.fill("no result can match this phrase");
  await expect(page.locator("[data-discovery-empty]")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/garden\/?$/);
  await expect(page.locator("[data-discovery-item]:visible")).toHaveCount(7);
  await expect(search).toHaveValue("");

  await page.goto("/garden/evergreen");
  await expect(page.getByLabel("Growth stage")).toHaveValue("evergreen");
  await expect(page.locator("[data-discovery-empty]")).toBeVisible();
  await page.getByLabel("Growth stage").selectOption("seedling");
  await expect(page).toHaveURL(/stage=seedling/);
  await expect(page.locator("[data-discovery-item]:visible")).toHaveCount(5);
  await page.reload();
  await expect(page.getByLabel("Growth stage")).toHaveValue("seedling");
  await expect(page.locator("[data-discovery-item]:visible")).toHaveCount(5);
  await page.getByRole("searchbox", { name: "Find a note" }).fill("no match");
  await expect(page.locator("[data-discovery-empty]")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator("[data-discovery-empty]")).toBeVisible();
  await page.getByRole("link", { name: "Browse all garden notes" }).click();
  await expect(page).toHaveURL(/\/garden\/?$/);
  await expect(page.locator("[data-discovery-item]:visible")).toHaveCount(7);
});

test("topic search restores URL state and keeps tags separate from connections", async ({ page }) => {
  await page.goto("/topics?q=garden");
  const search = page.getByRole("searchbox", { name: "Find a topic" });
  await expect(search).toHaveValue("garden");
  await expect(page.locator(".topic-directory [data-discovery-item]:visible")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Digital Garden/ })).toHaveAttribute(
    "href",
    "/topics/digital-garden"
  );
  const historyLength = await page.evaluate(() => history.length);
  await search.fill("no topic matches");
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await expect(page.locator("[data-discovery-empty]")).toBeVisible();
  await page.reload();
  await expect(search).toHaveValue("no topic matches");
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page).toHaveURL(/\/topics\/?$/);
  await expect(page.locator(".topic-directory [data-discovery-item]:visible")).toHaveCount(17);
  await page.getByRole("link", { name: /Digital Garden/ }).click();
  await expect(page).toHaveURL(/\/topics\/digital-garden\/?$/);
  expect(await visibleIds(page)).toEqual([
    "chasing-big-goals",
    "what-is-a-digital-garden",
  ]);
  await expect(page.locator(".connections")).toHaveCount(0);
  await expect(page.getByText(/inferred connections|manufacture connections/)).toHaveCount(0);
});

test("Search query state survives native note navigation and browser history", async ({ page }) => {
  await page.goto("/search?q=garden&kind=garden&sort=title");
  const search = page.getByRole("searchbox", { name: "Find anything" });
  await expect(search).toHaveValue("garden");
  await expect(page.getByLabel("Collection")).toHaveValue("garden");
  await expect(page.getByLabel("Order")).toHaveValue("title");
  const initialHistoryLength = await page.evaluate(() => history.length);
  await search.fill("digital garden");
  expect(await page.evaluate(() => history.length)).toBe(initialHistoryLength);
  await expect(page.locator("[data-content-id='what-is-a-digital-garden']:visible")).toHaveCount(1);

  const result = page.locator("[data-content-id='what-is-a-digital-garden'] > a");
  await expect(result).toHaveAttribute("href", "/what-is-a-digital-garden");
  await result.click();
  await expect(page).toHaveURL(/\/what-is-a-digital-garden\/?$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/search\/?\?q=digital\+garden&kind=garden&sort=title$/);
  await expect(search).toHaveValue("digital garden");
  await expect(page.locator("[data-content-id='what-is-a-digital-garden']:visible")).toHaveCount(1);
  await page.goForward();
  await expect(page).toHaveURL(/\/what-is-a-digital-garden\/?$/);
});

test("discovery geometry and lifecycle remain bounded across desktop, compact, and themes", async ({ page }) => {
  for (const theme of ["dark", "light"]) {
    await page.goto("/");
    await page.evaluate(value => localStorage.setItem("garden-theme:v1", value), theme);
    for (const [width, expectedColumn] of [
      [1440, 862],
      [390, 350],
    ]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto("/garden");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const geometry = await page.evaluate(() => {
        const browse = document.querySelector(".discovery-layout > section");
        const rail = document.querySelector(".discovery-rail");
        const style = getComputedStyle(browse);
        return {
          browseWidth: browse.getBoundingClientRect().width,
          railWidth: rail.getBoundingClientRect().width,
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight,
          overflow: document.documentElement.scrollWidth > innerWidth,
          effects: document.querySelectorAll("[data-garden-effects-root]").length,
          previews: document.querySelectorAll("[data-garden-preview-root]").length,
        };
      });
      expect(geometry).toMatchObject({
        browseWidth: expectedColumn,
        paddingLeft: "0px",
        paddingRight: "0px",
        overflow: false,
        effects: 1,
      });
      expect(geometry.previews).toBeLessThanOrEqual(1);
      expect(geometry.railWidth).toBe(width === 1440 ? 258 : 350);
    }
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/garden");
  for (let pass = 0; pass < 3; pass++) {
    await page.getByRole("link", { name: "Stream", exact: true }).first().click();
    await expect(page).toHaveURL(/\/stream\/?$/);
    await expect(page.locator("[data-garden-effects-root]")).toHaveCount(1);
    await page.getByRole("link", { name: "Garden", exact: true }).first().click();
    await expect(page).toHaveURL(/\/garden\/?$/);
    await expect(page.locator("[data-garden-effects-root]")).toHaveCount(1);
    await expect(page.locator("[data-discovery-item]:visible")).toHaveCount(7);
  }
});

test("discovery remains browseable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:4322",
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("/garden");
  await expect(page.locator("[data-content-id]")).toHaveCount(7);
  await expect(page.locator(".discovery-noscript")).toBeVisible();
  await page.goto("/search?q=goal");
  await expect(page.locator("[data-content-id]")).toHaveCount(8);
  await expect(page.locator(".discovery-noscript")).toBeVisible();
  await page.goto("/topics");
  await expect(page.locator(".topic-directory a")).toHaveCount(17);
  await page.goto("/garden/1");
  const first = page.locator("[data-content-id] > a").first();
  await expect(first).toHaveAttribute("href", /^\/[a-z0-9-]+$/);
  await first.click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await context.close();
});
