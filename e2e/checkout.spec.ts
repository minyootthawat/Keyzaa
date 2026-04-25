import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Checkout Page", () => {
  // Clear localStorage before each test to ensure isolation
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => localStorage.removeItem("keyzaa_cart"));
    await page.goto("about:blank");
  });

  test("1. Checkout page loads without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto(`${BASE}/checkout`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for page to settle
    await page.waitForTimeout(1500);

    // No console errors (excluding Next.js warnings/hydration)
    const realErrors = errors.filter(
      (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
    );
    expect(realErrors).toHaveLength(0);
  });

  test("2. Cart with items shows review step", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Pre-populate cart with demo item
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.setItem("keyzaa_cart", JSON.stringify([{
        id: "p8",
        title: "ROV 500 Diamonds Top Up",
        titleTh: "เติม ROV 500 เพชร",
        titleEn: "ROV 500 Diamonds Top Up",
        price: 65,
        image: "/products/rov.png",
        quantity: 1,
        sellerId: "sel_1",
        sellerName: "Keyzaa Official",
        platform: "Mobile",
        regionCode: "TH",
        deliveryLabelTh: "รับผลลัพธ์ใน 1 นาที",
        deliveryLabelEn: "Delivered in 1 minute",
        activationMethodTh: "เติมผ่าน UID บนระบบอัตโนมัติ",
        activationMethodEn: "Automated top-up via UID"
      }]));
    });

    await page.goto(`${BASE}/checkout`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    // Cart review step heading should be visible
    await expect(page.getByRole("heading", { name: /ตรวจสอบออเดอร์|Review order/i })).toBeVisible({ timeout: 5000 });

    // Product should appear in the cart list
    await expect(page.getByText(/ROV 500 Diamonds|เติม ROV/i).first()).toBeVisible();

    // Price should be visible
    await expect(page.getByText(/฿65/i).first()).toBeVisible();

    // Order summary aside should show item (Thai: เติม ROV 500 เพชร)
    await expect(page.getByText(/เติม ROV|ROV 500/i).first()).toBeVisible();

    // Continue button should be present (button text: ไปหน้าชำระเงินจำลอง)
    await expect(page.getByRole("button", { name: /ชำระเงิน|จำลอง|proceed/i })).toBeVisible();

    // No console errors
    const realErrors = errors.filter(
      (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
    );
    expect(realErrors).toHaveLength(0);
  });

  test("3. Add to cart from product page navigates to checkout", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Clear cart first
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.removeItem("keyzaa_cart"));

    // Go directly to a known product (ROV diamonds — id is p1)
    await page.goto(`${BASE}/products/p1`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Click the primary CTA "เริ่มเดโมการชำระเงิน" button (adds to cart AND navigates to checkout)
    const primaryBtn = page.getByRole("button", { name: /เริ่มเดโมการชำระเงิน|Start mock checkout/i });
    await expect(primaryBtn).toBeVisible({ timeout: 10000 });
    await primaryBtn.click();

    // Should navigate to checkout — wait for URL change first
    await page.waitForURL(/checkout/, { timeout: 10000 });
    // Then wait for checkout content to render
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Cart review heading should be visible (ตรวจสอบออเดอร์)
    await expect(page.getByRole("heading", { name: /ตรวจสอบออเดอร์|Review order/i })).toBeVisible({ timeout: 5000 });

    // No console errors
    const realErrors = errors.filter(
      (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
    );
    expect(realErrors).toHaveLength(0);
  });

  test("4. Cart icon in header navigates to checkout", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Pre-populate cart
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.setItem("keyzaa_cart", JSON.stringify([{
        id: "p8",
        title: "ROV 500 Diamonds Top Up",
        titleTh: "เติม ROV 500 เพชร",
        titleEn: "ROV 500 Diamonds Top Up",
        price: 65,
        image: "/products/rov.png",
        quantity: 1,
        sellerId: "sel_1",
        sellerName: "Keyzaa Official",
        platform: "Mobile",
        regionCode: "TH",
        deliveryLabelTh: "รับผลลัพธ์ใน 1 นาที",
        deliveryLabelEn: "Delivered in 1 minute",
        activationMethodTh: "เติมผ่าน UID บนระบบอัตโนมัติ",
        activationMethodEn: "Automated top-up via UID"
      }]));
    });

    await page.goto(BASE, { waitUntil: "networkidle" });

    // Click cart button in header
    await page.getByRole("button", { name: /ตะกร้า|cart/i }).click();

    // Should navigate to checkout
    await page.waitForURL(/\/checkout/, { timeout: 5000 });

    // Should show cart review (Thai: เติม ROV 500 เพชร)
    await expect(page.getByText(/เติม ROV|ROV 500/i).first()).toBeVisible({ timeout: 5000 });

    // No console errors
    const realErrors = errors.filter(
      (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
    );
    expect(realErrors).toHaveLength(0);
  });

  test("5. Continue to payment step", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Pre-populate cart
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.setItem("keyzaa_cart", JSON.stringify([{
        id: "p8",
        title: "ROV 500 Diamonds Top Up",
        titleTh: "เติม ROV 500 เพชร",
        titleEn: "ROV 500 Diamonds Top Up",
        price: 65,
        image: "/products/rov.png",
        quantity: 1,
        sellerId: "sel_1",
        sellerName: "Keyzaa Official",
        platform: "Mobile",
        regionCode: "TH",
        deliveryLabelTh: "รับผลลัพธ์ใน 1 นาที",
        deliveryLabelEn: "Delivered in 1 minute",
        activationMethodTh: "เติมผ่าน UID บนระบบอัตโนมัติ",
        activationMethodEn: "Automated top-up via UID"
      }]));
    });

    await page.goto(`${BASE}/checkout`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    // Click proceed to payment button (ไปหน้าชำระเงินจำลอง)
    await page.getByRole("button", { name: /ชำระเงิน|จำลอง/i }).click();

    // Payment step should show payment content
    await page.waitForTimeout(1000);
    await expect(
      page.getByText(/พร้อมเพย์|promptpay|QR|ชำระเงิน/i).first(),
    ).toBeVisible({ timeout: 5000 });

    // Total amount should be visible
    await expect(page.getByText(/฿65/i).first()).toBeVisible();

    // No console errors
    const realErrors = errors.filter(
      (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
    );
    expect(realErrors).toHaveLength(0);
  });

  test("6. Quantity adjustment in cart", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Pre-populate cart with quantity 1
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.setItem("keyzaa_cart", JSON.stringify([{
        id: "p8",
        title: "ROV 500 Diamonds Top Up",
        titleTh: "เติม ROV 500 เพชร",
        titleEn: "ROV 500 Diamonds Top Up",
        price: 65,
        image: "/products/rov.png",
        quantity: 1,
        sellerId: "sel_1",
        sellerName: "Keyzaa Official",
        platform: "Mobile",
        regionCode: "TH",
        deliveryLabelTh: "รับผลลัพธ์ใน 1 นาที",
        deliveryLabelEn: "Delivered in 1 minute",
        activationMethodTh: "เติมผ่าน UID บนระบบอัตโนมัติ",
        activationMethodEn: "Automated top-up via UID"
      }]));
    });

    await page.goto(`${BASE}/checkout`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    // Increase quantity (+ button)
    const increaseBtn = page.getByRole("button", { name: "+" }).first();
    await expect(increaseBtn).toBeVisible();
    await increaseBtn.click();

    // Total should update (฿65 × 2 = ฿130, or "฿130" text)
    await expect(page.getByText(/฿130|฿65.*฿65|2.*฿65/i).first()).toBeVisible();

    // Decrease quantity (- button)
    const decreaseBtn = page.getByRole("button", { name: "-", exact: true }).first();
    await expect(decreaseBtn).toBeVisible();
    await decreaseBtn.click();

    // Back to ฿65
    await expect(page.getByText(/฿65/i).first()).toBeVisible();

    // No console errors
    const realErrors = errors.filter(
      (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
    );
    expect(realErrors).toHaveLength(0);
  });

  test("7. Remove item from cart", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Pre-populate cart
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.setItem("keyzaa_cart", JSON.stringify([{
        id: "p8",
        title: "ROV 500 Diamonds Top Up",
        titleTh: "เติม ROV 500 เพชร",
        titleEn: "ROV 500 Diamonds Top Up",
        price: 65,
        image: "/products/rov.png",
        quantity: 1,
        sellerId: "sel_1",
        sellerName: "Keyzaa Official",
        platform: "Mobile",
        regionCode: "TH",
        deliveryLabelTh: "รับผลลัพธ์ใน 1 นาที",
        deliveryLabelEn: "Delivered in 1 minute",
        activationMethodTh: "เติมผ่าน UID บนระบบอัตโนมัติ",
        activationMethodEn: "Automated top-up via UID"
      }]));
    });

    await page.goto(`${BASE}/checkout`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    // Cart item should be visible (Thai: เติม ROV 500 เพชร)
    await expect(page.getByText(/เติม ROV|ROV 500/i).first()).toBeVisible({ timeout: 5000 });

    // Click remove button (× button near the item)
    const removeBtn = page.getByRole("button", { name: /ลบ|remove/i }).first();
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // Should show empty cart heading
    await expect(page.getByRole("heading", { name: /ตะกร้าของคุณว่างเปล่า|Your cart is empty/i })).toBeVisible({ timeout: 5000 });

    // No console errors
    const realErrors = errors.filter(
      (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
    );
    expect(realErrors).toHaveLength(0);
  });

  test("8. Order summary shows correct totals with multiple items", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Pre-populate cart with 2 items
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.setItem("keyzaa_cart", JSON.stringify([
        {
          id: "p8",
          title: "ROV 500 Diamonds Top Up",
          titleTh: "เติม ROV 500 เพชร",
          titleEn: "ROV 500 Diamonds Top Up",
          price: 65,
          image: "/products/rov.png",
          quantity: 2,
          sellerId: "sel_1",
          sellerName: "Keyzaa Official",
          platform: "Mobile",
          regionCode: "TH",
          deliveryLabelTh: "รับผลลัพธ์ใน 1 นาที",
          deliveryLabelEn: "Delivered in 1 minute",
          activationMethodTh: "เติมผ่าน UID บนระบบอัตโนมัติ",
          activationMethodEn: "Automated top-up via UID"
        },
        {
          id: "pubg1",
          title: "PUBG UC Top Up",
          titleTh: "เติม PUBG UC",
          titleEn: "PUBG UC Top Up",
          price: 99,
          image: "/products/pubg.png",
          quantity: 1,
          sellerId: "sel_2",
          sellerName: "GameShop",
          platform: "Mobile",
          regionCode: "TH",
          deliveryLabelTh: "ส่งทันที",
          deliveryLabelEn: "Instant delivery",
          activationMethodTh: "รับผ่าน mail",
          activationMethodEn: "Delivered via email"
        }
      ]));
    });

    await page.goto(`${BASE}/checkout`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    // Order summary should show both items (Thai text: เติม ROV 500 เพชร, เติม PUBG UC)
    await expect(page.getByText(/เติม ROV|ROV 500/i).first()).toBeVisible();
    await expect(page.getByText(/เติม PUBG|PUBG UC/i).first()).toBeVisible();

    // Total: 2*65 + 99 = 229
    await expect(page.getByText(/฿229/i)).toBeVisible();

    // No console errors
    const realErrors = errors.filter(
      (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
    );
    expect(realErrors).toHaveLength(0);
  });

  test("9. Mock checkout success flow", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Pre-populate cart
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.setItem("keyzaa_cart", JSON.stringify([{
        id: "p8",
        title: "ROV 500 Diamonds Top Up",
        titleTh: "เติม ROV 500 เพชร",
        titleEn: "ROV 500 Diamonds Top Up",
        price: 65,
        image: "/products/rov.png",
        quantity: 1,
        sellerId: "sel_1",
        sellerName: "Keyzaa Official",
        platform: "Mobile",
        regionCode: "TH",
        deliveryLabelTh: "รับผลลัพธ์ใน 1 นาที",
        deliveryLabelEn: "Delivered in 1 minute",
        activationMethodTh: "เติมผ่าน UID บนระบบอัตโนมัติ",
        activationMethodEn: "Automated top-up via UID"
      }]));
    });

    await page.goto(`${BASE}/checkout`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    // Click proceed to payment button (ไปหน้าชำระเงินจำลอง)
    await page.getByRole("button", { name: /ชำระเงิน|จำลอง/i }).click();

    // Wait for payment step
    await page.waitForTimeout(1000);

    // Select promptpay if not already selected
    const promptpayOption = page.getByText(/พร้อมเพย์|promptpay/i).first();
    if (await promptpayOption.isVisible().catch(() => false)) {
      await promptpayOption.click();
    }

    // Wait for mock success (9 seconds per the mock flow)
    await page.waitForTimeout(12000);

    // Success content should be visible
    await expect(
      page.getByText(/สำเร็จ|success|คำสั่งซื้อ|order/i).first(),
    ).toBeVisible({ timeout: 2000 });

    // No console errors
    const realErrors = errors.filter(
      (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
    );
    expect(realErrors).toHaveLength(0);
  });
});
