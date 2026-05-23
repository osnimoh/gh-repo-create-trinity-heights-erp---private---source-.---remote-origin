import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

// Drives the admissions create flow through the browser end to end: form →
// server action → DB → redirect to the new application's detail page.
test("admin can create an application", async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto("/admissions/new");
  const name = `E2E Applicant ${Date.now()}`;
  await page.locator('input[name="full_name"]').fill(name);
  await page.getByRole("button", { name: /create application/i }).click();

  // Lands on the detail page showing the applicant's name (create + redirect).
  await expect(page.getByRole("heading", { name })).toBeVisible();

  // And it appears back in the list.
  await page.goto("/admissions");
  await expect(page.getByRole("link", { name })).toBeVisible();
});
