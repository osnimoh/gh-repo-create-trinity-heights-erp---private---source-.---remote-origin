import { type Page, expect } from "@playwright/test";
import { E2E_ADMIN } from "./credentials";

// Logs in through the real UI and waits for the dashboard. Uses name-attribute
// locators (robust to label markup).
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(E2E_ADMIN.email);
  await page.locator('input[name="password"]').fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL("/");
}
