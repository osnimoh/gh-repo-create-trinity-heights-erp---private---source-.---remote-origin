import { test, expect } from "@playwright/test";
import { E2E_ADMIN } from "./credentials";
import { loginAsAdmin } from "./helpers";

test("logged-out users are redirected to /login", async ({ page }) => {
  await page.goto("/students");
  await expect(page).toHaveURL(/\/login$/);
});

test("rejects bad credentials", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(E2E_ADMIN.email);
  await page.locator('input[name="password"]').fill("wrong-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("admin can log in and reach the dashboard", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("admin sees admin-only nav (desktop)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "sidebar nav is desktop-only");
  await loginAsAdmin(page);
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Admissions" })).toBeVisible();
});
