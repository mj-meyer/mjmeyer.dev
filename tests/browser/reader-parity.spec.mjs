import { test, expect } from "@playwright/test";

const expectedSummaries = [
  "Engineering, learning, and the craft of software.",
  "Ideas, side projects, and making things.",
  "Family, purpose, and life beyond work.",
];

async function readerMetrics(page) {
  return page.evaluate(() => {
    const metric = selector => {
      const element = document.querySelector(selector);
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        x: rect.x,
        width: rect.width,
        color: style.color,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        listStyleType: style.listStyleType,
        textDecorationStyle: style.textDecorationStyle,
        opacity: style.opacity,
        cursor: style.cursor,
      };
    };
    return {
      detail: metric(".reader-detail"),
      title: metric(".reader-heading h1"),
      connections: metric(".reader-connections"),
      columns: metric(".reader-connection-columns"),
      incoming: metric(".reader-connection-columns > section:first-child"),
      relatedIcon: metric(".reader-related-link svg"),
      tocIcon: metric(".reader-toc summary svg:first-child"),
      proseList: metric(".reader-prose > ul"),
      nestedList: metric(".reader-prose ul ul"),
      unpublished: metric(".reader-prose a[data-unpublished]"),
      otherPaths: metric(".reader-other-paths"),
      otherGrid: metric(".reader-other-paths > div"),
      otherCard: metric(".reader-entry-link"),
      connectionsHeading: metric(".reader-connections > h2"),
      otherHeading: metric(".reader-other-paths > h2"),
      otherCardHeading: metric(".reader-entry-link h3"),
      summaries: [...document.querySelectorAll(".reader-entry-link p")].map(
        element => element.textContent.trim()
      ),
    };
  });
}

for (const [theme, headingColor] of [
  ["dark", "rgb(240, 232, 244)"],
  ["light", "rgb(91, 44, 118)"],
]) {
  for (const [width, expected] of [
    [1440, { detail: 680, connection: 316, card: 328 }],
    [390, { detail: 350, connection: 350, card: 350 }],
  ]) {
    test(`Reader lower sections match accepted ${theme} ${width}px metrics`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto("/");
      await page.evaluate(value => localStorage.setItem("garden-theme:v1", value), theme);
      await page.goto("/chasing-big-goals");
      const metrics = await readerMetrics(page);

      expect(metrics.detail.width).toBe(expected.detail);
      expect(metrics.connections).toMatchObject({
        x: metrics.detail.x,
        width: expected.detail,
        paddingLeft: "0px",
        paddingRight: "0px",
      });
      expect(metrics.columns).toMatchObject({ x: metrics.detail.x, width: expected.detail });
      expect(metrics.incoming).toMatchObject({ width: expected.connection, paddingLeft: "0px", paddingRight: "0px" });
      expect(metrics.otherPaths).toMatchObject({ x: metrics.detail.x, width: expected.detail, paddingLeft: "0px", paddingRight: "0px" });
      expect(metrics.otherGrid).toMatchObject({ x: metrics.detail.x, width: expected.detail });
      expect(metrics.otherCard.width).toBe(expected.card);

      for (const heading of [metrics.title, metrics.connectionsHeading, metrics.otherHeading, metrics.otherCardHeading]) expect(heading.color).toBe(headingColor);
      expect(metrics.relatedIcon.width).toBe(14);
      expect(metrics.tocIcon.width).toBe(width === 1440 ? 16 : metrics.tocIcon.width);
      expect(metrics.proseList.listStyleType).toBe("disc");
      expect(metrics.nestedList.listStyleType).toBe("circle");
      expect(metrics.unpublished).toMatchObject({ textDecorationStyle: "dotted", opacity: "1", cursor: "pointer" });
      expect(metrics.summaries).toEqual(expectedSummaries);
    });
  }
}

test("Reader parity survives ClientRouter navigation and native interactions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await Promise.all([
    page.waitForURL(/\/chasing-big-goals\/?$/),
    page.locator(".garden-home-start [data-entry-id='chasing-big-goals']").click(),
  ]);
  await page.waitForFunction(
    () => document.querySelectorAll("[data-garden-preview-root]").length === 1
  );
  await page.waitForTimeout(100);
  const metrics = await readerMetrics(page);
  expect(metrics.connections.width).toBe(680);
  expect(metrics.incoming.width).toBe(316);
  expect(metrics.relatedIcon.width).toBe(14);
  expect(metrics.summaries).toEqual(expectedSummaries);

  const unavailable = page.locator(".reader-prose a[data-unpublished]").first();
  await unavailable.click();
  await expect(page.locator("#garden-unpublished-dialog")).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(page.locator("#garden-unpublished-dialog")).not.toHaveAttribute("open", "");

  const connection = page.locator(".reader-related-link[data-preview-note='what-is-a-digital-garden']");
  await connection.hover();
  await expect(page.locator("[data-slot='preview-card-content']")).toContainText("What is a Digital Garden?");
  await page.keyboard.press("Escape");
  await Promise.all([page.waitForURL(/\/what-is-a-digital-garden\/?$/), connection.click()]);
  await expect(page.getByRole("heading", { level: 1, name: "What is a Digital Garden?" })).toBeVisible();

  await page.goto("/creating-something-new");
  await expect(page.locator("html")).toHaveAttribute("data-garden-site", "");
  const migratedUnavailable = await page
    .locator(".reader-prose a[data-unpublished]")
    .first()
    .evaluate(element => {
      const style = getComputedStyle(element);
      return {
        opacity: style.opacity,
        cursor: style.cursor,
        textDecorationStyle: style.textDecorationStyle,
      };
    });
  expect(migratedUnavailable).toMatchObject({
    opacity: "1",
    cursor: "pointer",
    textDecorationStyle: "dotted",
  });
  await page.locator(".reader-prose a[data-unpublished]").first().click();
  await expect(page.locator("#garden-unpublished-dialog")).toHaveAttribute(
    "open",
    ""
  );
});
