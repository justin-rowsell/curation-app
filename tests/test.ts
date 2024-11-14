import { expect, test } from '@playwright/test';

test('index page has title Network Events', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle(/Network Events/);
});
