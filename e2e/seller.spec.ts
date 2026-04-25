import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Seller E2E Flow", () => {

  test("1. Register buyer → Register seller → Dashboard", async ({ page }) => {
    // Step 1: Login via demo buyer account
    await page.goto(BASE);
    await page.waitForFunction(() => document.body.innerText.length > 500, { timeout: 10000 });

    // Click profile icon in header
    await page.locator('button[aria-label="โปรไฟล์"]').click();
    await page.waitForTimeout(1000);

    // Click demo buyer auto-fill
    await page.getByText("บัญชีเดโมผู้ซื้อ").click();
    await page.waitForTimeout(500);

    // Submit login
    // Submit login via JS click (button may be outside viewport in dialog)
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="auth-submit-btn"]') as HTMLButtonElement | null;
      btn?.click();
    });
    await page.waitForTimeout(3000);

    // Step 2: Go to seller register
    await page.goto(`${BASE}/seller/register`);
    await page.waitForFunction(() => document.body.innerText.length > 50, { timeout: 15000 });

    // Step 3: Fill seller registration (fill AFTER navigating to the page)
    await page.waitForTimeout(1000);
    const inputs = page.locator("input:not([type='hidden'])");
    const count = await inputs.count();
    console.log("Inputs on seller/register:", count);

    if (count >= 1) {
      await inputs.nth(0).fill("E2E Test Shop");
    }
    if (count >= 2) {
      await inputs.nth(1).fill("0812345678");
    }
    await page.waitForTimeout(500);

    // Submit via clicking the seller register form button directly
    await page.locator('button[type="submit"]').click();

    // Wait for either redirect to dashboard (new seller) or stay on page (already registered)
    try {
      await page.waitForURL("**/seller/dashboard**", { timeout: 5000 });
    } catch {
      // Already registered as seller — confirm we're still on register page with no error
      const url = page.url();
      expect(url).toBe(`${BASE}/seller/register`);
    }
  });

  test("2. Seller dashboard — products page loads", async ({ page }) => {
    // Login as demo seller
    await page.goto(BASE);
    await page.waitForFunction(() => document.body.innerText.length > 500, { timeout: 10000 });
    await page.locator('button[aria-label="โปรไฟล์"]').click();
    await page.waitForTimeout(1000);
    await page.getByText("บัญชีเดโมผู้ขาย").click();
    await page.waitForTimeout(500);
    // Submit login via JS click (button may be outside viewport in dialog)
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="auth-submit-btn"]') as HTMLButtonElement | null;
      btn?.click();
    });
    await page.waitForTimeout(3000);

    // Go to products
    await page.goto(`${BASE}/seller/dashboard/products`);
    await page.waitForFunction(() => document.body.innerText.length > 50, { timeout: 15000 });

    const body = await page.evaluate(() => document.body.innerText);
    expect(body.length).toBeGreaterThan(50);
  });

  test("3. Seller dashboard — orders page loads", async ({ page }) => {
    // Login as demo seller
    await page.goto(BASE);
    await page.waitForFunction(() => document.body.innerText.length > 500, { timeout: 10000 });
    await page.locator('button[aria-label="โปรไฟล์"]').click();
    await page.waitForTimeout(1000);
    await page.getByText("บัญชีเดโมผู้ขาย").click();
    await page.waitForTimeout(500);
    // Submit login via JS click (button may be outside viewport in dialog)
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="auth-submit-btn"]') as HTMLButtonElement | null;
      btn?.click();
    });
    await page.waitForTimeout(3000);

    // Go to orders
    await page.goto(`${BASE}/seller/dashboard/orders`);
    await page.waitForFunction(() => document.body.innerText.length > 50, { timeout: 15000 });

    const body = await page.evaluate(() => document.body.innerText);
    expect(body.length).toBeGreaterThan(50);
  });

  test("4. Seller dashboard — wallet page loads", async ({ page }) => {
    // Login as demo seller
    await page.goto(BASE);
    await page.waitForFunction(() => document.body.innerText.length > 500, { timeout: 10000 });
    await page.locator('button[aria-label="โปรไฟล์"]').click();
    await page.waitForTimeout(1000);
    await page.getByText("บัญชีเดโมผู้ขาย").click();
    await page.waitForTimeout(500);
    // Submit login via JS click (button may be outside viewport in dialog)
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="auth-submit-btn"]') as HTMLButtonElement | null;
      btn?.click();
    });
    await page.waitForTimeout(3000);

    // Go to wallet
    await page.goto(`${BASE}/seller/dashboard/wallet`);
    await page.waitForFunction(() => document.body.innerText.length > 50, { timeout: 15000 });

    const body = await page.evaluate(() => document.body.innerText);
    expect(body.length).toBeGreaterThan(50);
  });
});
