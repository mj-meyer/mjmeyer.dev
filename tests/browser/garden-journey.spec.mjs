import { test, expect } from "@playwright/test";

const entryHrefs = ["/software-engineering-excellence", "/chasing-big-goals", "/creating-something-new", "/navigating-lifes-seasons"];
const latestIds = ["hello-world", "what-is-a-digital-garden", "shadcn-taxonomy-taillwind-indicator", "learn-coding-through-games"];
function lifecycleCounts(page) {
  return page.evaluate(() => ({
    main: document.querySelectorAll("main").length,
    effects: document.querySelectorAll("[data-garden-effects-root]").length,
    previews: document.querySelectorAll("[data-garden-preview-root]").length,
    previewHosts: document.querySelectorAll(".garden-preview-host").length,
    canvases: document.querySelectorAll(".garden-pixel-renderer canvas").length,
    openDialogs: document.querySelectorAll("dialog[open]").length,
  }));
}
async function waitForEnhancements(page) {
  await page.waitForFunction(() => document.querySelectorAll("[data-garden-effects-root]").length === 1);
  await page.waitForTimeout(100);
}
async function assertBounded(page, expectedPreviewHosts) {
  const counts = await lifecycleCounts(page);
  expect(counts.main).toBe(1);
  expect(counts.effects).toBe(1);
  expect(counts.previews).toBeLessThanOrEqual(1);
  expect(counts.previewHosts).toBe(expectedPreviewHosts);
  expect(counts.canvases).toBeLessThanOrEqual(1);
  expect(counts.openDialogs).toBe(0);
}
async function clientClick(page, locator, path) {
  await Promise.all([page.waitForURL(url => url.pathname.replace(/\/$/, "") === path), locator.click()]);
  await expect(page.locator("html")).toHaveAttribute("data-garden-site", "");
  await waitForEnhancements(page);
}
async function computed(page, selector) {
  return page.locator(selector).first().evaluate(element => {
    const style = getComputedStyle(element);
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      marginTop: style.marginTop,
      borderTopWidth: style.borderTopWidth,
      borderTopStyle: style.borderTopStyle,
      borderRadius: style.borderRadius,
      textDecorationLine: style.textDecorationLine,
    };
  });
}
function contrastRatio(foreground, background) {
  const channels = value => {
    const values = value.match(/[\d.]+/g).slice(0, 3).map(Number);
    return (value.startsWith("color(srgb") ? values : values.map(channel => channel / 255)).map(normalized => normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4);
  };
  const luminance = value => {
    const [red, green, blue] = channels(value);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

test("first-slice journey preserves native navigation and bounded ClientRouter lifecycle", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await waitForEnhancements(page);
  const primaryEntries = page.locator(".garden-home-start [data-entry-id]");
  await expect(primaryEntries).toHaveCount(4);
  expect(await primaryEntries.evaluateAll(nodes => nodes.map(node => node.dataset.entryId))).toEqual(entryHrefs.map(path => path.slice(1)));
  expect(await page.locator("[data-content-id]").evaluateAll(nodes => nodes.map(node => node.dataset.contentId))).toEqual(latestIds);
  await page.getByRole("button", { name: "Preview the newsletter" }).click();
  await expect(page.locator("#garden-newsletter-dialog")).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(page.locator("#garden-newsletter-dialog")).not.toHaveAttribute("open", "");
  await page.getByRole("button", { name: "Garden", exact: true }).click();
  await expect(page.locator("[data-feed-kind]:visible")).toHaveCount(3);
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.locator("[data-feed-kind]:visible")).toHaveCount(4);
  await assertBounded(page, 0);

  for (let pass = 0; pass < 5; pass++) {
    await page.evaluate(() => { window.__gardenClientSentinel = (window.__gardenClientSentinel || 0) + 1; });
    await clientClick(page, page.locator(".garden-home-start [data-entry-id='chasing-big-goals']"), "/chasing-big-goals");
    expect(await page.evaluate(() => window.__gardenClientSentinel)).toBe(pass + 1);
    await expect(page.getByRole("heading", { level: 1, name: "Chasing Big Goals" })).toBeVisible();
    await expect(page.locator(".reader-prose .callout")).toContainText("Work in progress");
    await expect(page.locator(".reader-toc a")).toHaveCount(3);
    await assertBounded(page, 3);

    const authoredLink = page.locator(".reader-prose a[data-preview-note='what-is-a-digital-garden']");
    await expect(authoredLink).toHaveAttribute("href", /\/what-is-a-digital-garden$/);
    if (pass === 0) {
      await authoredLink.hover();
      await expect(page.locator("[data-slot='preview-card-content']")).toContainText("What is a Digital Garden?");
      await page.keyboard.press("Escape");
      await expect(page.locator("[data-slot='preview-card-content']")).toHaveCount(0);
    }
    await clientClick(page, authoredLink, "/what-is-a-digital-garden");
    await expect(page.getByRole("heading", { level: 1, name: "What is a Digital Garden?" })).toBeVisible();
    await expect(page.locator(".reader-prose")).toContainText("Maggie’s piece on A Brief History & Ethos of the Digital Garden");
    await expect(page.locator(".reader-prose")).toContainText("I know the feeling all too well; I’ve obsessed over the “right” way to start my digital garden for years");
    await expect(page.locator(".reader-sidenote, .reader-inline-footnote")).toHaveCount(0);
    await assertBounded(page, 1);
    if (pass === 0) {
      await page.setViewportSize({ width: 767, height: 900 });
      await expect(page.locator("[data-garden-preview-root]")).toHaveCount(0);
      await expect(page.locator(".garden-preview-host")).toHaveCount(0);
      await expect(page.locator(".garden-pixel-static")).toHaveCount(1);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await expect(page.locator("[data-garden-preview-root]")).toHaveCount(1);
      await expect(page.locator(".garden-preview-host")).toHaveCount(1);
    }

    await page.goBack(); await page.waitForURL(/\/chasing-big-goals\/?$/); await waitForEnhancements(page); await assertBounded(page, 3);
    await page.goBack(); await page.waitForURL(url => url.pathname === "/"); await waitForEnhancements(page); await assertBounded(page, 0);
  }
  expect(errors).toEqual([]);
});

test("theme and metadata remain correct across migrated page families", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("garden-theme:v1", "light"));
  await page.goto("/"); await waitForEnhancements(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveClass(/garden-light/);
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveClass(/garden-dark/);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.title()).toBe("MJ Meyer");
  await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", "https://mjmeyer.dev");
  await expect(page.locator("meta[property='og:image']")).toHaveAttribute("content", "https://mjmeyer.dev/mjmeyer-og.jpg");

  await clientClick(page, page.locator(".garden-home-start [data-entry-id='chasing-big-goals']"), "/chasing-big-goals");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveClass(/garden-light/);
  expect(await page.title()).toBe("Chasing Big Goals");
  await expect(page.locator("meta[name='description']")).toHaveAttribute("content", "With tools like goal setting, digital gardening, and feedback loops, I map out the steps to make progress—in both my craft and personal life.");
  await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", "https://mjmeyer.dev/chasing-big-goals");
  await expect(page.locator("meta[property='og:url']")).toHaveAttribute("content", "https://mjmeyer.dev/chasing-big-goals");
  await expect(page.locator("meta[property='twitter:url']")).toHaveAttribute("content", "https://mjmeyer.dev/chasing-big-goals");
  await expect(page.locator("meta[property='og:image']")).toHaveAttribute("content", "https://mjmeyer.dev/assets/chasingbiggoals.png");
  await expect(page.locator("title")).toHaveCount(1);
  await expect(page.locator("link[rel='canonical']")).toHaveCount(1);

  await clientClick(page, page.locator(".reader-prose a[data-preview-note='what-is-a-digital-garden']"), "/what-is-a-digital-garden");
  expect(await page.title()).toBe("What is a Digital Garden?");
  await expect(page.locator("meta[property='og:image']")).toHaveAttribute("content", "https://mjmeyer.dev/assets/whatisadigitalgarden.png");

  await Promise.all([page.waitForURL(url => url.pathname.replace(/\/$/, "") === "/about"), page.getByRole("link", { name: "About" }).first().click()]);
  await expect(page.locator("html")).toHaveAttribute("data-garden-site", "");
  await expect(page.locator("[data-garden-effects-root]")).toHaveCount(1);
  await expect(page.locator("[data-garden-preview-root]")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
});

test("Garden native scrollbars use theme colors without changing column widths", async ({ page }) => {
  const themes = {
    dark: { track: "rgb(38, 23, 53)" },
    light: { track: "rgb(247, 242, 248)" },
  };
  const thumbs = [];
  for (const [theme, colors] of Object.entries(themes)) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    await page.evaluate(value => localStorage.setItem("garden-theme:v1", value), theme);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

    const home = await page.evaluate(() => {
      const root = document.documentElement;
      const rootStyle = getComputedStyle(root);
      const nestedStyle = getComputedStyle(document.querySelector(".garden-home-reading"));
      const probe = document.createElement("span");
      probe.style.backgroundColor = "var(--garden-scrollbar-thumb)";
      document.body.append(probe);
      const expectedThumb = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        color: rootStyle.scrollbarColor,
        width: rootStyle.scrollbarWidth,
        nestedColor: nestedStyle.scrollbarColor,
        nestedWidth: nestedStyle.scrollbarWidth,
        thumb: getComputedStyle(root, "::-webkit-scrollbar-thumb").backgroundColor,
        track: getComputedStyle(root, "::-webkit-scrollbar-track").backgroundColor,
        expectedThumb,
        contentWidth: document.querySelector(".garden-home-reading").getBoundingClientRect().width,
      };
    });
    expect(home).toMatchObject({ width: "auto", nestedWidth: "auto", track: colors.track, contentWidth: 878 });
    expect(home.color).not.toBe("auto");
    expect(home.nestedColor).toBe(home.color);
    expect(home.thumb).toBe(home.expectedThumb);
    expect(home.thumb).not.toBe("rgb(168, 90, 255)");
    expect(contrastRatio(home.thumb, home.track)).toBeGreaterThanOrEqual(3);
    thumbs.push(home.thumb);

    await page.goto("/chasing-big-goals");
    const reader = await page.evaluate(() => {
      const root = document.documentElement;
      const rootStyle = getComputedStyle(root);
      const nestedStyle = getComputedStyle(document.querySelector(".reader-prose"));
      return {
        color: rootStyle.scrollbarColor,
        width: rootStyle.scrollbarWidth,
        nestedColor: nestedStyle.scrollbarColor,
        nestedWidth: nestedStyle.scrollbarWidth,
        thumb: getComputedStyle(root, "::-webkit-scrollbar-thumb").backgroundColor,
        track: getComputedStyle(root, "::-webkit-scrollbar-track").backgroundColor,
        contentWidth: document.querySelector(".reader-prose").getBoundingClientRect().width,
      };
    });
    expect(reader).toMatchObject({
      color: home.color,
      width: "auto",
      nestedColor: home.color,
      nestedWidth: "auto",
      thumb: home.thumb,
      track: colors.track,
      contentWidth: 680,
    });
    expect(reader.thumb).not.toBe("rgb(168, 90, 255)");
    expect(contrastRatio(reader.thumb, reader.track)).toBeGreaterThanOrEqual(3);
  }
  expect(thumbs[0]).not.toBe(thumbs[1]);

  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/chasing-big-goals");
  const forced = await page.evaluate(() => ({
    color: getComputedStyle(document.documentElement).scrollbarColor,
    width: getComputedStyle(document.documentElement).scrollbarWidth,
    thumb: getComputedStyle(document.documentElement, "::-webkit-scrollbar-thumb").backgroundColor,
  }));
  expect(forced).toMatchObject({ color: "auto", width: "auto" });
  expect(forced.thumb).not.toBe("rgb(168, 90, 255)");
  expect(forced.thumb).not.toBe(thumbs[0]);
  expect(forced.thumb).not.toBe(thumbs[1]);
});

test("Garden component cascade preserves accepted spacing, controls, links, and contrast", async ({ page }) => {
  const themes = {
    dark: {
      background: "rgb(38, 23, 53)",
      text: "rgb(240, 232, 244)",
      muted: "rgb(185, 166, 197)",
      accent: "rgb(210, 175, 234)",
      buttonText: "rgb(41, 21, 56)",
    },
    light: {
      background: "rgb(247, 242, 248)",
      text: "rgb(91, 44, 118)",
      muted: "rgb(111, 85, 127)",
      accent: "rgb(119, 67, 142)",
      buttonText: "rgb(250, 245, 252)",
    },
  };
  for (const [theme, colors] of Object.entries(themes)) {
    await page.goto("/");
    await page.evaluate(value => localStorage.setItem("garden-theme:v1", value), theme);
    for (const [width, compact] of [[1440, false], [390, true]]) {
      await page.setViewportSize({ width, height: compact ? 844 : 1000 });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      const intro = await computed(page, ".garden-home-intro p");
      const start = await computed(page, ".garden-home-start > p");
      const filter = await computed(page, ".garden-feed-filters button[data-feed-filter='garden']");
      const newsletter = await computed(page, ".garden-newsletter > button");
      const inlineLink = await computed(page, ".garden-inline-link");
      const card = await computed(page, ".garden-home-start .garden-paths a");
      const dialog = await computed(page, ".garden-dialog");
      const footer = await computed(page, ".garden-footer");
      expect(intro.marginTop).toBe(compact ? "13px" : "18px");
      expect(start.marginTop).toBe("12px");
      expect(filter).toMatchObject({ color: colors.muted, fontSize: "13px", borderTopWidth: "1px", borderTopStyle: "solid" });
      expect(newsletter).toMatchObject({ color: colors.buttonText, backgroundColor: colors.accent, fontSize: "12px" });
      expect(newsletter.fontFamily).toContain("Source Sans 3");
      expect(inlineLink.color).toBe(colors.accent);
      expect(card).toMatchObject({ borderTopWidth: "1px", borderTopStyle: "solid", borderRadius: "0px" });
      expect(dialog).toMatchObject({ borderTopWidth: "1px", borderTopStyle: "solid", borderRadius: "0px" });
      expect(footer.fontSize).toBe(compact ? "12px" : "13px");
      expect(contrastRatio(filter.color, colors.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(newsletter.color, newsletter.backgroundColor)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(inlineLink.color, colors.background)).toBeGreaterThanOrEqual(4.5);

      for (const path of ["/chasing-big-goals", "/what-is-a-digital-garden"]) {
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const firstH2 = page.locator(".reader-prose > h2").first();
        const paragraphStyle = await firstH2.evaluate(element => getComputedStyle(element.nextElementSibling).marginTop);
        const proseLink = await computed(page, ".reader-prose a:not([data-unpublished])");
        const heading = await computed(page, ".reader-prose > h2");
        expect(paragraphStyle).toBe("26px");
        expect(heading.color).toBe(colors.text);
        expect(proseLink).toMatchObject({ color: colors.accent, textDecorationLine: "underline" });
        expect(contrastRatio(proseLink.color, colors.background)).toBeGreaterThanOrEqual(4.5);
        if (path === "/chasing-big-goals") {
          expect((await computed(page, ".reader-prose > h2")).marginTop).toBe(compact ? "42px" : "52px");
          expect((await computed(page, ".reader-prose > h3")).marginTop).toBe("40px");
        } else {
          expect((await page.locator(".reader-prose > h2").nth(1).evaluate(element => getComputedStyle(element).marginTop))).toBe(compact ? "42px" : "52px");
        }
      }
    }
  }
});

test("mobile retains typing and pause while using a static pixel fallback", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/"); await waitForEnhancements(page);
  await expect(page.locator(".garden-pixel-static")).toHaveCount(1);
  await expect(page.locator(".garden-pixel-renderer canvas")).toHaveCount(0);
  const toggle = page.locator(".garden-motion-toggle");
  await expect(toggle).toBeEnabled();
  await expect(page.locator(".garden-heading-visual")).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".garden-text-type")).toContainText("software and life.");
});

test("first-slice content and links remain usable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:4322", javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Notes on software and life.");
  await expect(page.locator(".garden-home-start [data-entry-id]")).toHaveCount(4);
  await page.goto("/chasing-big-goals");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chasing Big Goals");
  const link = page.locator(".reader-prose a[href='/what-is-a-digital-garden']");
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/what-is-a-digital-garden\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What is a Digital Garden?");
  await context.close();
});
