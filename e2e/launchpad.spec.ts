import { expect, test } from "@playwright/test";
import { stubApp } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await stubApp(page);
});

test("the launchpad sums up the viewer's pull requests", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Your impact" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: /Synced/ }),
  ).toBeVisible();

  const merged = page.getByRole("link", { name: /^Merged pull requests:/ });
  await expect(merged).toBeVisible();
  await expect(merged).toHaveAttribute(
    "href",
    /github\.com\/search\?q=is%3Apr\+author%3Apat\+merged/,
  );
  await expect(page.getByText("Lines changed", { exact: true })).toBeVisible();

  // Charts render and each has a table twin.
  await expect(page.getByRole("heading", { name: "Throughput" })).toBeVisible();
  await expect(page.locator(".recharts-surface").first()).toBeVisible();
  await page.getByRole("button", { name: "Table view" }).first().click();
  await expect(
    page.getByRole("columnheader", { name: "Merged" }).first(),
  ).toBeVisible();

  // Repos ranked by the viewer's merged PRs.
  const repos = page.getByRole("link", { name: /^acme\// });
  await expect(repos).toHaveCount(3);
});

test("throughput and code volume switch between weeks and days", async ({
  page,
}) => {
  await page.goto("/");
  for (const [title, description] of [
    ["Throughput", /opened and merged per day/],
    ["Code volume", /merged pull requests, per day/],
  ] as const) {
    const card = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByRole("heading", { name: title }) });
    const day = card.getByRole("button", { name: "Day", exact: true });
    await expect(
      card.getByRole("button", { name: "Week", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await day.click();
    await expect(day).toHaveAttribute("aria-pressed", "true");
    await expect(card.getByText(description)).toBeVisible();
    await card.getByRole("button", { name: "Table view" }).click();
    await expect(card.getByRole("columnheader").first()).toHaveText("Day");
  }
});

test("the window is in the URL and rescopes every number", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Your impact" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "30d" }).click();
  await expect(page).toHaveURL(/\?window=30d$/);
  await expect(page.getByRole("button", { name: "30d" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByText(/compared with the previous 30 days/),
  ).toBeVisible();
});

test("a repo row opens the repo focus with the viewer ranked", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "acme/app", exact: true }).click();
  await expect(page).toHaveURL(/\/repo\/acme\/app$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "acme/app",
  );
  await expect(
    page.getByRole("heading", { name: "Contributors" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /^Merged pull requests:/ }),
  ).toContainText(/#\d of \d/);
  await expect(page.getByRole("heading", { name: "Cycle time" })).toBeVisible();
  await expect(page.getByText("Everyone else")).toBeVisible();

  // The table toggles between the viewer's PRs and everyone's.
  await page.getByRole("button", { name: "Everyone" }).click();
  await expect(page.getByRole("cell", { name: "sam" }).first()).toBeVisible();
});

test("a day with too many pull requests is flagged as partial", async ({
  page,
}) => {
  await page.goto("/repo/acme/big?window=30d");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /at most 1,000 results per day/ }),
  ).toBeVisible({
    timeout: 20_000,
  });
});

test("the launchpad never scrolls sideways", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Throughput" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
