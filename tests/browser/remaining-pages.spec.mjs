import fs from "node:fs";
import { test, expect } from "@playwright/test";

const notes = [
  {
    id: "chasing-big-goals",
    title: "Chasing Big Goals",
    description:
      "With tools like goal setting, digital gardening, and feedback loops, I map out the steps to make progress—in both my craft and personal life.",
    kind: "Entry point",
  },
  {
    id: "creating-something-new",
    title: "Creating Something New",
    description:
      "Every idea starts as a seed of curiosity. This is where I document my indie hacking journey, side projects, and the big ideas I’m turning into reality.",
    kind: "Entry point",
  },
  {
    id: "hello-world",
    title: "Hello world!",
    description:
      "The obligatory hello world! What would a developer's little corner on the internet be without saying hello to the world.",
    kind: "Garden note",
  },
  {
    id: "learn-coding-through-games",
    title: "Learn coding through games",
    description:
      "Fun interactive games that help teach programming concepts. Perfect for beginners or anyone looking to improve their coding skills while having fun.",
    kind: "Garden note",
  },
  {
    id: "navigating-lifes-seasons",
    title: "Navigating Life’s Seasons",
    description:
      "Life is like navigating through seasons—sometimes sunny, sometimes stormy, but always teaching us something new.",
    kind: "Entry point",
  },
  {
    id: "software-engineering-excellence",
    title: "Software Engineering Excellence",
    description:
      "The craft of software engineering is a perpetual dance between learning, building, and reflecting.",
    kind: "Entry point",
  },
  {
    id: "what-is-a-digital-garden",
    title: "What is a Digital Garden?",
    description:
      "Imagine a place where your ideas don’t need to be perfect or complete to have a purpose. A digital garden is a home for the seeds of your thoughts, a space for cultivating knowledge, and watching your understanding bloom over time.",
    kind: "Garden note",
  },
  {
    id: "shadcn-taxonomy-taillwind-indicator",
    title: "shadcn taxonomy taillwind indicator",
    description:
      "A helpful little utility component that shows you what breakpoint you're at in the corner of your browser.",
    kind: "Stream note",
  },
];

async function goto(page, url) {
  return page.goto(url, { waitUntil: "domcontentloaded" });
}

async function waitForGarden(page) {
  await expect(page.locator("html")).toHaveAttribute("data-garden-site", "");
  await page.waitForFunction(
    () => document.querySelectorAll("[data-garden-effects-root]").length === 1
  );
  await page.waitForTimeout(100);
}

async function expectMetadata(page, path, title, description, image) {
  expect(await page.title()).toBe(title);
  await expect(page.locator("meta[name='description']")).toHaveAttribute(
    "content",
    description
  );
  for (const selector of [
    "link[rel='canonical']",
    "meta[property='og:url']",
    "meta[property='twitter:url']",
  ]) {
    await expect(page.locator(selector)).toHaveCount(1);
    await expect(page.locator(selector)).toHaveAttribute(
      selector.startsWith("link") ? "href" : "content",
      `https://mjmeyer.dev${path}`
    );
  }
  await expect(page.locator("meta[property='og:image']")).toHaveAttribute(
    "content",
    `https://mjmeyer.dev${image}`
  );
}

async function clientClick(page, locator, path) {
  await Promise.all([
    page.waitForURL(url => url.pathname.replace(/\/$/, "") === path),
    locator.click(),
  ]);
  await waitForGarden(page);
}

for (const note of notes) {
  test(`root reader preserves ${note.id} content and metadata`, async ({ page }) => {
    await goto(page, `/${note.id}`);
    await waitForGarden(page);
    await expect(page.getByRole("heading", { level: 1, name: note.title })).toBeVisible();
    await expect(page.locator(".reader-note-kind")).toContainText(note.kind);
    await expectMetadata(
      page,
      `/${note.id}`,
      note.title,
      note.description,
      `/assets/${note.id.replaceAll("-", "")}.png`
    );
    await expect(page.locator(".reader-prose")).not.toBeEmpty();
    await expect(page.locator(".reader-detail")).toHaveCSS("width", "680px");
    await expect(page.locator("[data-garden-preview-root]")).toHaveCount(1);
  });
}

test("expandable authored callouts retain accessible disclosure behavior", async ({ page }) => {
  await goto(page, "/creating-something-new");
  const callout = page.locator(".reader-prose .callout[data-expandable='true']");
  const title = callout.locator(".callout-title");
  const content = callout.locator(".callout-content");
  await expect(title).toHaveAttribute("role", "button");
  await expect(title).toHaveAttribute("aria-expanded", "true");
  await expect(content).toBeVisible();
  await title.click();
  await expect(title).toHaveAttribute("aria-expanded", "false");
  await expect(content).toBeHidden();
  await title.focus();
  await page.keyboard.press("Enter");
  await expect(title).toHaveAttribute("aria-expanded", "true");
  await expect(content).toBeVisible();
});

test("Stream keeps authored commentary and accessible source fallbacks", async ({ page }) => {
  await goto(page, "/shadcn-taxonomy-taillwind-indicator");
  await expect(page.locator(".reader-note-meta")).toContainText("twitter");
  await expect(page.locator(".reader-note-meta")).not.toContainText("seedling");
  await expect(page.locator(".reader-prose")).toContainText(
    "small little utilities can make such a large difference"
  );
  const source = page.locator(
    ".reader-prose astro-embed-tweet a[href*='FelipeG51780447/status/1646562524496527372']"
  );
  await expect(source).toBeVisible();
  await expect(source).toContainText("April 13, 2023");
  await expect(page.locator(".reader-prose astro-embed-tweet blockquote")).toContainText(
    "@tailwindcss Indicator component"
  );
  await expect(page.locator("script[src*='twitter'], script[src*='platform.x.com']")).toHaveCount(0);
  const github = page.getByRole("link", { name: /GitHub - Tailwind Indicator/ });
  await expect(github).toHaveAttribute(
    "href",
    "https://github.com/shadcn-ui/taxonomy/blob/main/components/tailwind-indicator.tsx"
  );
  await expect(github).toHaveAttribute("target", "_blank");
  const externalSchemes = await page
    .locator(".reader-prose a[href^='http']")
    .evaluateAll(links => links.map(link => new URL(link.href).protocol));
  expect(new Set(externalSchemes)).toEqual(new Set(["https:"]));
});

test("Now, archive, historical Now, About, and Uses preserve published material", async ({ page }) => {
  await goto(page, "/now");
  await expectMetadata(
    page,
    "/now",
    "Now | MJ Meyer",
    "Now page showing what's going on at this point in my life",
    "/mjmeyer-og.jpg"
  );
  await expect(page.getByRole("heading", { level: 2, name: "April 2023" })).toBeVisible();
  await expect(page.locator(".now-snapshot-heading")).toContainText(
    "An older update, not a current status report."
  );
  await expect(page.locator(".now-prose")).toContainText(
    "It was my birthday this month. My first one in New Zealand since we immigrated."
  );
  await expect(page.locator(".now-archive a")).toHaveAttribute(
    "href",
    "/now/2023/04"
  );
  await goto(page, "/now/2023/04");
  await expectMetadata(
    page,
    "/now/2023/04",
    "Now — April 2023 | MJ Meyer",
    "Now page from April 2023",
    "/mjmeyer-og.jpg"
  );
  await expect(page.locator(".now-snapshot-heading")).toContainText("Archived snapshot");
  await expect(page.getByRole("link", { name: /Latest Now page/ })).toHaveAttribute(
    "href",
    "/now"
  );

  await goto(page, "/nowold");
  await expect(page.locator(".personal-eyebrow")).toHaveText("Historical page");
  await expect(page.locator(".personal-prose")).toContainText(
    "An intermittently refreshed record of my reading, investigations, and contemplations."
  );
  await expect(page.locator(".personal-prose")).toContainText(
    "I also restarted my twitter account."
  );
  await expect(page.getByRole("link", { name: /Read the dated Now archive/ })).toHaveAttribute(
    "href",
    "/now"
  );

  await goto(page, "/about");
  await expect(page.locator(".personal-page")).toContainText(
    "more than 15 years of hands-on experience"
  );
  await expect(page.locator(".personal-prose > ol.relative > li")).toHaveCount(4);
  await expect(page.locator(".personal-prose details")).toHaveCount(11);
  await expect(page.locator(".personal-prose time")).toHaveText([
    "March 2020",
    "Jun 2016",
    "Sep 2014",
    "Jan 2009",
  ]);
  await page.locator(".personal-prose details").first().locator("summary").click();
  await expect(page.locator(".personal-prose details").first()).toHaveAttribute("open", "");

  await goto(page, "/uses");
  await expect(page.locator(".personal-prose")).toContainText(
    "2019 16” Macbook Pro 2.3 GHz 8-Core Intel Core i9"
  );
  await expect(page.locator(".personal-prose")).toContainText(
    "My editor is Neovim with LunarVim"
  );
  await expect(page.getByRole("link", { name: "uses.tech" })).toHaveAttribute(
    "href",
    "https://uses.tech/"
  );
});

test("unavailable query and built 404 are safe, useful utility pages", async ({ page }) => {
  await goto(page, "/unpublished?note=%3Cimg%20src=x%20onerror=alert(1)%3E");
  await expectMetadata(
    page,
    "/unpublished",
    "Note unavailable | MJ Meyer",
    "This garden note is not publicly available.",
    "/mjmeyer-og.jpg"
  );
  await expect(page.locator("[data-unpublished-name]")).toHaveText(
    "“<img src=x onerror=alert(1)>”"
  );
  await expect(page.locator("[data-unpublished-name] img")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Browse the garden/ })).toHaveAttribute(
    "href",
    "/garden"
  );

  await goto(page, "/404.html");
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await expect(page.locator(".utility-code")).toHaveText("404");
  await expect(page.getByRole("link", { name: /Go home/ })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: /Browse the garden/ })).toHaveAttribute(
    "href",
    "/garden"
  );
  await expect(page.locator("link[rel='canonical']")).toHaveAttribute(
    "href",
    "https://mjmeyer.dev/404"
  );
});

test("new page families survive ClientRouter Back and Forward with bounded roots", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => localStorage.setItem("garden-theme:v1", "light"));
  await goto(page, "/stream");
  await waitForGarden(page);
  await clientClick(
    page,
    page.locator("[data-content-id='shadcn-taxonomy-taillwind-indicator'] a"),
    "/shadcn-taxonomy-taillwind-indicator"
  );
  await expect(page.locator(".reader-prose astro-embed-tweet")).toBeVisible();
  await clientClick(page, page.getByRole("link", { name: "About" }).first(), "/about");
  await expect(page.locator(".personal-prose details")).toHaveCount(11);
  await clientClick(page, page.getByRole("link", { name: "Now", exact: true }).last(), "/now");
  await expect(page.locator(".now-snapshot")).toContainText("April 2023");

  for (const expectedPath of ["/about", "/shadcn-taxonomy-taillwind-indicator", "/stream"]) {
    await page.goBack();
    await page.waitForURL(url => url.pathname.replace(/\/$/, "") === expectedPath);
    await waitForGarden(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("[data-garden-effects-root]")).toHaveCount(1);
    await expect(page.locator("[data-garden-preview-root]")).toHaveCount(
      ["/stream", "/shadcn-taxonomy-taillwind-indicator"].includes(expectedPath)
        ? 1
        : 0
    );
  }
  for (const expectedPath of ["/shadcn-taxonomy-taillwind-indicator", "/about", "/now"]) {
    await page.goForward();
    await page.waitForURL(url => url.pathname.replace(/\/$/, "") === expectedPath);
    await waitForGarden(page);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("[data-garden-effects-root]")).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

test("Now matches the accepted study geometry and type at desktop and compact widths", async ({
  page,
}) => {
  for (const [theme, colors] of Object.entries({
    dark: { body: "rgb(205, 191, 213)", muted: "rgb(185, 166, 197)" },
    light: { body: "rgb(97, 67, 133)", muted: "rgb(111, 85, 127)" },
  })) {
    await goto(page, "/");
    await page.evaluate(value => localStorage.setItem("garden-theme:v1", value), theme);
    for (const [width, expected] of [
      [
        1440,
        {
          outerX: 128,
          outerWidth: 1184,
          innerWidth: 700,
          headingSize: "44px",
          headingLine: "51.04px",
          introSize: "20px",
          introLine: "31px",
          proseSize: "20px",
          proseLine: "35px",
          portraitWidth: 84,
          portraitHeight: 92,
        },
      ],
      [
        390,
        {
          outerX: 20,
          outerWidth: 350,
          innerWidth: 350,
          headingSize: "34px",
          headingLine: "39.44px",
          introSize: "18px",
          introLine: "27.9px",
          proseSize: "19px",
          proseLine: "32.3px",
          portraitWidth: 64,
          portraitHeight: 78,
        },
      ],
    ]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await goto(page, "/now");
      const metrics = await page.evaluate(() => {
        const box = selector => document.querySelector(selector).getBoundingClientRect();
        const style = selector => getComputedStyle(document.querySelector(selector));
        const portrait = [...document.querySelectorAll(".now-person img")].find(
          image => getComputedStyle(image).display !== "none"
        );
        return {
          outer: box(".now-page"),
          inner: box(".now-snapshot"),
          introWidth: box(".now-intro").width,
          introTextMaxWidth: style(
            ".now-intro > p:not(.personal-eyebrow)"
          ).maxWidth,
          heading: {
            fontSize: style(".now-intro h1").fontSize,
            lineHeight: style(".now-intro h1").lineHeight,
          },
          intro: {
            fontSize: style(".now-intro > p:not(.personal-eyebrow)").fontSize,
            lineHeight: style(".now-intro > p:not(.personal-eyebrow)").lineHeight,
          },
          prose: {
            fontSize: style(".now-prose").fontSize,
            lineHeight: style(".now-prose").lineHeight,
          },
          firstParagraphColor: style(".now-prose > p:first-child").color,
          noticeColor: style(".now-snapshot-heading p").color,
          portrait: {
            width: portrait.getBoundingClientRect().width,
            height: portrait.getBoundingClientRect().height,
            objectFit: getComputedStyle(portrait).objectFit,
          },
          published: {
            fontSize: style(".personal-published").fontSize,
            marginTop: style(".personal-published").marginTop,
          },
        };
      });
      expect(metrics.outer.x).toBe(expected.outerX);
      expect(metrics.outer.width).toBe(expected.outerWidth);
      expect(metrics.inner.width).toBe(expected.innerWidth);
      expect(metrics.introWidth).toBe(expected.outerWidth);
      expect(metrics.introTextMaxWidth).toBe("640px");
      expect(metrics.heading).toEqual({
        fontSize: expected.headingSize,
        lineHeight: expected.headingLine,
      });
      expect(metrics.intro).toEqual({
        fontSize: expected.introSize,
        lineHeight: expected.introLine,
      });
      expect(metrics.prose).toEqual({
        fontSize: expected.proseSize,
        lineHeight: expected.proseLine,
      });
      expect(metrics.firstParagraphColor).toBe(colors.body);
      expect(metrics.noticeColor).toBe(colors.muted);
      expect(metrics.portrait).toEqual({
        width: expected.portraitWidth,
        height: expected.portraitHeight,
        objectFit: "contain",
      });
      expect(metrics.published).toEqual({
        fontSize: "13px",
        marginTop: "48px",
      });
    }
  }
});

for (const theme of ["dark", "light"]) {
  for (const width of [1440, 390]) {
    test(`Stream, Now, and About keep accepted geometry in ${theme} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await goto(page, "/");
      await page.evaluate(value => localStorage.setItem("garden-theme:v1", value), theme);
      const expectedHeading = theme === "dark" ? "rgb(240, 232, 244)" : "rgb(91, 44, 118)";
      const expectedWidth = width === 1440 ? { reader: 680, now: 700, about: 760 } : { reader: 350, now: 350, about: 350 };

      await goto(page, "/shadcn-taxonomy-taillwind-indicator");
      const stream = await page.evaluate(() => {
        const box = selector => document.querySelector(selector).getBoundingClientRect();
        const style = selector => getComputedStyle(document.querySelector(selector));
        return {
          width: box(".reader-prose").width,
          headingColor: style(".reader-heading h1").color,
          kindIcon: box(".reader-note-kind svg").width,
          metaIcon: box(".reader-note-meta svg").width,
          connectionWidth: box(".reader-connections").width,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      expect(stream).toMatchObject({
        width: expectedWidth.reader,
        headingColor: expectedHeading,
        kindIcon: 17,
        metaIcon: 16,
        connectionWidth: expectedWidth.reader,
        overflow: 0,
      });

      await goto(page, "/now");
      const now = await page.evaluate(() => ({
        width: document.querySelector(".now-snapshot").getBoundingClientRect().width,
        headingColor: getComputedStyle(document.querySelector(".now-intro h1")).color,
        profileWidth: [...document.querySelectorAll(".now-person img")]
          .find(image => getComputedStyle(image).display !== "none")
          .getBoundingClientRect().width,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      expect(now).toMatchObject({
        width: expectedWidth.now,
        headingColor: expectedHeading,
        profileWidth: width === 1440 ? 84 : 64,
        overflow: 0,
      });

      await goto(page, "/about");
      const about = await page.evaluate(() => ({
        width: document.querySelector(".personal-prose").getBoundingClientRect().width,
        headingColor: getComputedStyle(document.querySelector(".personal-intro h1")).color,
        timelineDot: document.querySelector(".personal-prose > ol.relative > li > div:first-child").getBoundingClientRect().width,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      expect(about).toMatchObject({
        width: expectedWidth.about,
        headingColor: expectedHeading,
        timelineDot: 11,
        overflow: 0,
      });
    });
  }
}

test("genuine footnote focus follows the equivalent presentation on resize", async ({ page }) => {
  const fixture = fs.readFileSync("tests/fixtures/genuine-footnote.html", "utf8");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await goto(page, "/what-is-a-digital-garden");
  await page.locator(".reader-prose").evaluate((prose, html) => {
    prose.insertAdjacentHTML("beforeend", html);
    document.dispatchEvent(new Event("astro:page-load"));
  }, fixture);
  const trigger = page.locator(".reader-footnote-trigger");
  await expect(trigger).toHaveCount(1);
  await trigger.click();
  await expect(page.locator(".reader-sidenote")).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".reader-inline-footnote summary")).toBeFocused();
  await expect(page.locator(".reader-inline-footnote")).toContainText(
    "Test-only genuine footnote content."
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator(".reader-sidenote")).toBeFocused();
});

test("representative remaining pages retain readable native no-JavaScript paths", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: "http://127.0.0.1:4322",
  });
  const page = await context.newPage();
  await goto(page, "/shadcn-taxonomy-taillwind-indicator");
  await expect(page.locator(".reader-prose")).toContainText(
    "small little utilities can make such a large difference"
  );
  await expect(
    page.locator("astro-embed-tweet a[href*='FelipeG51780447/status/1646562524496527372']")
  ).toBeVisible();
  await goto(page, "/now");
  await expect(page.locator(".now-prose")).toContainText("It was my birthday this month.");
  await goto(page, "/about");
  await expect(page.locator(".personal-prose details")).toHaveCount(11);
  await goto(page, "/unpublished?note=private-note");
  await expect(page.getByRole("heading", { level: 1, name: "Note unavailable" })).toBeVisible();
  await expect(page.locator("[data-unpublished-name]")).toBeHidden();
  await expect(page.getByRole("link", { name: /Browse the garden/ })).toHaveAttribute(
    "href",
    "/garden"
  );
  await context.close();
});
