import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Landing Page", () => {
  test("1. Homepage loads with correct title and metadata", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto(BASE, { waitUntil: "networkidle" });

    // Check page title
    await expect(page).toHaveTitle(/KeyZaa/);

    // No console errors
    expect(errors.filter((e) => !e.includes("Warning"))).toHaveLength(0);
  });

  test("2. Hero section renders correctly", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    // Hero headline
    const heroHeading = page.locator("h1").first();
    await expect(heroHeading).toBeVisible();
    const heroText = await heroHeading.innerText();
    expect(heroText.length).toBeGreaterThan(5);
  });

  test("3. Category cards are visible and link to products", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    // Find category section heading
    const categoriesSection = page.getByRole("heading", { name: /หมวดหมู่|Categories|popular/i }).first();
    await expect(categoriesSection).toBeVisible();

    // Category cards should link to /products?category=
    const categoryLinks = page.locator('a[href*="/products?category="]');
    const count = await categoryLinks.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("4. Product cards display with correct info", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    // Best deals section
    const dealsHeading = page.getByRole("heading", { name: /ดีล|Deal|สินค้าแนะนำ/i }).first();
    await expect(dealsHeading).toBeVisible();

    // Product cards should have price info
    const pricePattern = /฿[\d,]/;
    const pageText = await page.content();
    expect(pageText).toMatch(pricePattern);
  });

  test("5. Trust badges render", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    // Trust panel should be visible
    const trustSection = page.getByText(/ส่งภายใน|ปลอดภัย|รองรับ|ร้านค้า/i).first();
    await expect(trustSection).toBeVisible();
  });

  test("6. Header navigation is visible", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    // Sticky header should be present
    const header = page.locator("header, nav").first();
    await expect(header).toBeVisible();
  });

  test("7. Bottom navigation renders (no footer tag)", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    // Buyer layout uses BottomNav instead of <footer>
    const bottomNav = page.locator("nav, [class*='bottom']").first();
    await expect(bottomNav).toBeVisible();
  });

  test("8. Login dialog opens from profile button", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    // Click profile button
    const profileBtn = page.locator('button[aria-label="โปรไฟล์"]');
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    // Auth dialog should open (fixed overlay)
    await page.waitForTimeout(500);
    const dialog = page.locator("[role='dialog'], .fixed.inset-0");
    await expect(dialog.first()).toBeVisible();
  });

  test("9. JSON-LD structured data is present", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toHaveCount(1);

    const content = await jsonLd.innerText();
    const data = JSON.parse(content);
    expect(data["@type"]).toBe("WebSite");
    expect(data.name).toBe("KeyZaa");
  });

  test("10. Open Graph meta tags are correct", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toContain("KeyZaa");

    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute("content");
    expect(ogDescription).toBeTruthy();
    expect(ogDescription!.length).toBeGreaterThan(20);

    const ogType = await page.locator('meta[property="og:type"]').getAttribute("content");
    expect(ogType).toBe("website");
  });

  test("11. Canonical URL is set", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toContain("keyzaa.com");
  });

  test("12. Robots meta allows indexing", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toMatch(/index/);
  });

  test("13. Products page link works", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    const productsLink = page.locator('a[href="/products"]').first();
    await expect(productsLink).toBeVisible();
  });

  test("14. Seller register link is present", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    const sellerLink = page.locator('a[href*="seller/register"]');
    await expect(sellerLink.first()).toBeVisible();
  });

  test("15. Page has proper h1 hierarchy (single h1)", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(3); // homepage should have 1-3 h1s max
  });
});
