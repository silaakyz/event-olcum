import { test, expect } from '@playwright/test';

test('CSV upload -> report summary renders', async ({ page }) => {
  const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';
  await page.goto(base);

  // Ensure textarea exists and fill CSV
  const textarea = page.locator('#csv-input');
  await expect(textarea).toBeVisible();
  await textarea.fill('nps,satisfaction\n9,5\n8,4\n7,5\n');

  // Click generate
  await page.click('button:has-text("Generate Report")');

  // Wait for the report summary header
  const header = page.locator('h2');
  await expect(header).toHaveText('Report Summary', { timeout: 15000 });

  // Validate key cards exist
  await expect(page.locator('text=NPS')).toBeVisible();
  await expect(page.locator('text=Satisfaction')).toBeVisible();
  await expect(page.locator('text=Rows')).toBeVisible();
});
