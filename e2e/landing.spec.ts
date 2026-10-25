import { expect, test } from "@playwright/test";
import { stubSession } from "./fixtures";

test("a visitor sees the pitch and a GitHub sign-in", async ({ page }) => {
  await stubSession(page, null);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /See your impact/ }),
  ).toBeVisible();
  const signIn = page.getByRole("link", { name: /Continue with GitHub/ });
  await expect(signIn).toHaveAttribute("href", "/api/auth/login?scope=public");
  await page
    .getByRole("radio", { name: /Include private repositories/ })
    .check();
  await expect(signIn).toHaveAttribute("href", "/api/auth/login?scope=private");
});

test("the sign-in route sends the visitor to GitHub with a state cookie", async ({
  page,
  context,
}) => {
  const response = await page.request.get("/api/auth/login?scope=private", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(302);
  const location = new URL(response.headers()["location"]!);
  expect(location.hostname).toBe("github.com");
  expect(location.searchParams.get("scope")).toBe("read:user repo");
  expect(location.searchParams.get("redirect_uri")).toContain(
    "/api/auth/callback",
  );
  await page.goto("/");
  const cookies = await context.cookies();
  expect(
    cookies.find((cookie) => cookie.name === "prismy_oauth_state")?.httpOnly,
  ).toBe(true);
});

test("the page never scrolls sideways", async ({ page }) => {
  await stubSession(page, null);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
