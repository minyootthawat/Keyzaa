# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/seller-flow.spec.ts >> Seller Product Flow E2E >> 1. Product list page loads with stats table
- Location: e2e/seller-flow.spec.ts:75:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByText('บัญชีเดโมผู้ซื้อ')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "KZ Keyzaa ดิจิทัลมาร์เก็ตเพลสที่เชื่อถือได้" [ref=e4] [cursor=pointer]:
        - /url: /
        - generic [ref=e5]: KZ
        - generic [ref=e6]:
          - generic [ref=e7]: Keyzaa
          - generic [ref=e8]: ดิจิทัลมาร์เก็ตเพลสที่เชื่อถือได้
      - generic [ref=e10]:
        - img [ref=e11]
        - searchbox "ค้นหาสินค้า" [ref=e13]
      - generic [ref=e14]:
        - button "สลับภาษา" [ref=e15]: TH
        - 'button "Theme: Dark" [ref=e16]':
          - img [ref=e17]
        - button "เปิดตะกร้าสินค้า" [ref=e19]:
          - img [ref=e20]
          - generic [ref=e22]: "1"
        - button "โปรไฟล์" [active] [ref=e23]:
          - img [ref=e24]
  - main [ref=e26]:
    - generic [ref=e27]:
      - generic [ref=e32]:
        - img [ref=e33]
        - generic [ref=e34]:
          - heading "เติมเกมออนไลน์ ราคาถูก" [level=1] [ref=e35]
          - paragraph [ref=e36]: บริการเติมเกม ของขวัญ และสกุลเงินดิจิทัล ส่งเร็ว ปลอดภัย ราคาคุ้มค่า
          - generic [ref=e37]:
            - link "ดูสินค้าทั้งหมด" [ref=e38] [cursor=pointer]:
              - /url: /products
            - link "ลงทะเบียนร้านค้า" [ref=e39] [cursor=pointer]:
              - /url: /seller/register
      - region "หมวดหมู่ยอดนิยม" [ref=e42]:
        - generic [ref=e44]:
          - heading "หมวดหมู่ยอดนิยม" [level=2] [ref=e45]
          - paragraph [ref=e46]: เลือกหมวดที่จัดส่งไวและมีร้านค้ายืนยันตัวตนแล้ว
        - generic [ref=e47]:
          - link "เติมเกม 8 รายการ" [ref=e48] [cursor=pointer]:
            - /url: /products?category=%E0%B9%80%E0%B8%95%E0%B8%B4%E0%B8%A1%E0%B9%80%E0%B8%81%E0%B8%A1
            - generic [ref=e50]:
              - img [ref=e52]
              - generic [ref=e54]:
                - paragraph [ref=e55]: เติมเกม
                - paragraph [ref=e56]: 8 รายการ
          - link "บัตรของขวัญ 3 รายการ" [ref=e57] [cursor=pointer]:
            - /url: /products?category=Gift%20Card
            - generic [ref=e59]:
              - img [ref=e61]
              - generic [ref=e63]:
                - paragraph [ref=e64]: บัตรของขวัญ
                - paragraph [ref=e65]: 3 รายการ
          - link "สมัครสมาชิก 2 รายการ" [ref=e66] [cursor=pointer]:
            - /url: /products?category=Subscription
            - generic [ref=e68]:
              - img [ref=e70]
              - generic [ref=e72]:
                - paragraph [ref=e73]: สมัครสมาชิก
                - paragraph [ref=e74]: 2 รายการ
          - link "AI Tools 0 รายการ" [ref=e75] [cursor=pointer]:
            - /url: /products?category=AI%20Tools
            - generic [ref=e77]:
              - img [ref=e79]
              - generic [ref=e81]:
                - paragraph [ref=e82]: AI Tools
                - paragraph [ref=e83]: 0 รายการ
          - link "โปร 0 รายการ" [ref=e84] [cursor=pointer]:
            - /url: /products?category=%E0%B9%82%E0%B8%9B%E0%B8%A3
            - generic [ref=e86]:
              - img [ref=e88]
              - generic [ref=e90]:
                - paragraph [ref=e91]: โปร
                - paragraph [ref=e92]: 0 รายการ
      - region "ดีลที่ดีที่สุด" [ref=e93]:
        - generic [ref=e94]:
          - generic [ref=e95]:
            - heading "ดีลที่ดีที่สุด" [level=2] [ref=e96]
            - paragraph [ref=e97]: อัปเดตราคาทุกวันจากร้านค้าที่ผ่านการตรวจสอบแล้ว
          - link "ดูทั้งหมด →" [ref=e98] [cursor=pointer]:
            - /url: /products
        - generic [ref=e99]:
          - link "HOT DEAL Full Flow 1777144910731 -21% topup Full Flow 1777144910731 ร้านค้ายืนยันตัวตนแล้ว 14 ร้าน พร้อมส่ง ฿97 ฿77" [ref=e100] [cursor=pointer]:
            - /url: /products/2579d557-4d05-4812-8808-889b54035377
            - generic [ref=e101]:
              - generic [ref=e102]: HOT DEAL
              - img "Full Flow 1777144910731" [ref=e103]
              - generic [ref=e106]: "-21%"
            - generic [ref=e107]:
              - generic [ref=e109]:
                - paragraph [ref=e110]: topup
                - paragraph [ref=e111]: Full Flow 1777144910731
              - generic [ref=e112]:
                - generic [ref=e113]:
                  - generic [ref=e114]:
                    - paragraph [ref=e115]: ร้านค้ายืนยันตัวตนแล้ว
                    - paragraph [ref=e116]: 14 ร้าน
                  - generic [ref=e117]: พร้อมส่ง
                - generic [ref=e119]:
                  - generic [ref=e120]: ฿97
                  - generic [ref=e121]: ฿77
          - link "HOT DEAL Image Product 1777144897415 -43% giftcard Image Product 1777144897415 ร้านค้ายืนยันตัวตนแล้ว 14 ร้าน พร้อมส่ง ฿263 ฿150" [ref=e122] [cursor=pointer]:
            - /url: /products/0e4f3dfe-099c-4d98-a667-951f157ee5bf
            - generic [ref=e123]:
              - generic [ref=e124]: HOT DEAL
              - img "Image Product 1777144897415" [ref=e125]
              - generic [ref=e128]: "-43%"
            - generic [ref=e129]:
              - generic [ref=e131]:
                - paragraph [ref=e132]: giftcard
                - paragraph [ref=e133]: Image Product 1777144897415
              - generic [ref=e134]:
                - generic [ref=e135]:
                  - generic [ref=e136]:
                    - paragraph [ref=e137]: ร้านค้ายืนยันตัวตนแล้ว
                    - paragraph [ref=e138]: 14 ร้าน
                  - generic [ref=e139]: พร้อมส่ง
                - generic [ref=e141]:
                  - generic [ref=e142]: ฿263
                  - generic [ref=e143]: ฿150
          - link "HOT DEAL Delete Test Product 1777144839705 -40% topup Delete Test Product 1777144839705 ร้านค้ายืนยันตัวตนแล้ว 14 ร้าน พร้อมส่ง ฿82 ฿49" [ref=e144] [cursor=pointer]:
            - /url: /products/622bead5-8a46-48f5-ae66-d54912d141c2
            - generic [ref=e145]:
              - generic [ref=e146]: HOT DEAL
              - img "Delete Test Product 1777144839705" [ref=e147]
              - generic [ref=e150]: "-40%"
            - generic [ref=e151]:
              - generic [ref=e153]:
                - paragraph [ref=e154]: topup
                - paragraph [ref=e155]: Delete Test Product 1777144839705
              - generic [ref=e156]:
                - generic [ref=e157]:
                  - generic [ref=e158]:
                    - paragraph [ref=e159]: ร้านค้ายืนยันตัวตนแล้ว
                    - paragraph [ref=e160]: 14 ร้าน
                  - generic [ref=e161]: พร้อมส่ง
                - generic [ref=e163]:
                  - generic [ref=e164]: ฿82
                  - generic [ref=e165]: ฿49
          - link "Edited Product 1777144831621 -0% giftcard Edited Product 1777144831621 ร้านค้ายืนยันตัวตนแล้ว 14 ร้าน พร้อมส่ง ฿299 ฿299" [ref=e166] [cursor=pointer]:
            - /url: /products/6f8f4f2c-ff5c-46cf-9b74-6dc967b620f2
            - generic [ref=e167]:
              - img "Edited Product 1777144831621" [ref=e168]
              - generic [ref=e171]: "-0%"
            - generic [ref=e172]:
              - generic [ref=e174]:
                - paragraph [ref=e175]: giftcard
                - paragraph [ref=e176]: Edited Product 1777144831621
              - generic [ref=e177]:
                - generic [ref=e178]:
                  - generic [ref=e179]:
                    - paragraph [ref=e180]: ร้านค้ายืนยันตัวตนแล้ว
                    - paragraph [ref=e181]: 14 ร้าน
                  - generic [ref=e182]: พร้อมส่ง
                - generic [ref=e184]:
                  - generic [ref=e185]: ฿299
                  - generic [ref=e186]: ฿299
      - region "แนะนำสำหรับคุณ" [ref=e187]:
        - generic [ref=e189]:
          - heading "แนะนำสำหรับคุณ" [level=2] [ref=e190]
          - paragraph [ref=e191]: สินค้าที่ขายต่อเนื่อง พร้อมเรตติ้งและสต็อกที่เชื่อถือได้
        - generic [ref=e192]:
          - link "HOT DEAL E2E Test Product 1777144824006 ร้านค้ายืนยันตัวตนแล้ว topup E2E Test Product 1777144824006 ฿148 ฿99 พร้อมส่ง สต็อกพร้อม" [ref=e193] [cursor=pointer]:
            - /url: /products/bee89989-0e39-42bb-965e-a0ea12bec9fd
            - generic [ref=e194]:
              - generic [ref=e195]: HOT DEAL
              - img "E2E Test Product 1777144824006" [ref=e196]
              - generic [ref=e198]: ร้านค้ายืนยันตัวตนแล้ว
            - generic [ref=e199]:
              - paragraph [ref=e201]: topup
              - paragraph [ref=e202]: E2E Test Product 1777144824006
              - generic [ref=e203]:
                - generic [ref=e204]:
                  - generic [ref=e205]: ฿148
                  - generic [ref=e206]: ฿99
                - generic [ref=e207]:
                  - paragraph [ref=e208]: พร้อมส่ง
                  - paragraph [ref=e209]: สต็อกพร้อม
          - link "HOT DEAL Full Flow 1777144732178 ร้านค้ายืนยันตัวตนแล้ว topup Full Flow 1777144732178 ฿107 ฿77 พร้อมส่ง สต็อกพร้อม" [ref=e210] [cursor=pointer]:
            - /url: /products/cbc24c2a-12ba-4bb6-81db-5bbc022762cd
            - generic [ref=e211]:
              - generic [ref=e212]: HOT DEAL
              - img "Full Flow 1777144732178" [ref=e213]
              - generic [ref=e215]: ร้านค้ายืนยันตัวตนแล้ว
            - generic [ref=e216]:
              - paragraph [ref=e218]: topup
              - paragraph [ref=e219]: Full Flow 1777144732178
              - generic [ref=e220]:
                - generic [ref=e221]:
                  - generic [ref=e222]: ฿107
                  - generic [ref=e223]: ฿77
                - generic [ref=e224]:
                  - paragraph [ref=e225]: พร้อมส่ง
                  - paragraph [ref=e226]: สต็อกพร้อม
          - link "HOT DEAL Image Product 1777144718733 ร้านค้ายืนยันตัวตนแล้ว giftcard Image Product 1777144718733 ฿205 ฿150 พร้อมส่ง สต็อกพร้อม" [ref=e227] [cursor=pointer]:
            - /url: /products/79af2c1f-f6f7-453d-94a3-29e7ee2d761b
            - generic [ref=e228]:
              - generic [ref=e229]: HOT DEAL
              - img "Image Product 1777144718733" [ref=e230]
              - generic [ref=e232]: ร้านค้ายืนยันตัวตนแล้ว
            - generic [ref=e233]:
              - paragraph [ref=e235]: giftcard
              - paragraph [ref=e236]: Image Product 1777144718733
              - generic [ref=e237]:
                - generic [ref=e238]:
                  - generic [ref=e239]: ฿205
                  - generic [ref=e240]: ฿150
                - generic [ref=e241]:
                  - paragraph [ref=e242]: พร้อมส่ง
                  - paragraph [ref=e243]: สต็อกพร้อม
          - link "Delete Test Product 1777144660709 ร้านค้ายืนยันตัวตนแล้ว topup Delete Test Product 1777144660709 ฿60 ฿49 พร้อมส่ง สต็อกพร้อม" [ref=e244] [cursor=pointer]:
            - /url: /products/4f1c5a14-0368-4098-9bfa-7d5419a3f6e4
            - generic [ref=e245]:
              - img "Delete Test Product 1777144660709" [ref=e246]
              - generic [ref=e248]: ร้านค้ายืนยันตัวตนแล้ว
            - generic [ref=e249]:
              - paragraph [ref=e251]: topup
              - paragraph [ref=e252]: Delete Test Product 1777144660709
              - generic [ref=e253]:
                - generic [ref=e254]:
                  - generic [ref=e255]: ฿60
                  - generic [ref=e256]: ฿49
                - generic [ref=e257]:
                  - paragraph [ref=e258]: พร้อมส่ง
                  - paragraph [ref=e259]: สต็อกพร้อม
      - region "ซื้อดิจิทัลอย่างสบายใจมากขึ้น" [ref=e260]:
        - generic [ref=e262]:
          - generic [ref=e263]:
            - text: Keyzaa
            - text: มาร์เก็ตเพลสที่เน้นความเชื่อมั่น
          - heading "ซื้อดิจิทัลอย่างสบายใจมากขึ้น" [level=2] [ref=e265]
          - paragraph [ref=e266]: เลือกสินค้าที่ต้องการ แล้วตรวจสอบราคา ร้านค้า และสถานะพร้อมส่งได้ในหน้าเดียว
          - generic [ref=e267]:
            - link "เลือกสินค้าที่เชื่อถือได้" [ref=e268] [cursor=pointer]:
              - /url: /products
            - link "ดูวิธีสั่งซื้อ" [ref=e269] [cursor=pointer]:
              - /url: /orders
  - generic [ref=e270]:
    - generic:
      - generic:
        - paragraph: มีข้อสงสัย? คุยกับเราสิ
        - paragraph: ตอบไวภายใน 1 นาที
    - link [ref=e271] [cursor=pointer]:
      - /url: https://line.me/ti/p/@keyzaa
      - img [ref=e272]
  - button "Open Next.js Dev Tools" [ref=e279] [cursor=pointer]:
    - img [ref=e280]
  - alert [ref=e283]
```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | const BASE = "http://localhost:3000";
  4   | 
  5   | // ---------------------------------------------------------------------------
  6   | // Helper: authenticate + register as seller.
  7   | // Pattern from e2e/seller.spec.ts (4/4 passing):
  8   | //   1. Login as demo buyer via auth dialog
  9   | //   2. Navigate to /seller/register
  10  | //   3. Fill shop details + submit
  11  | //   4. SellerRouteGuard now passes → /seller/dashboard/* accessible
  12  | // ---------------------------------------------------------------------------
  13  | async function authenticateAsSeller(page: Page) {
  14  |   // Step 1: Login as demo buyer
  15  |   await page.goto(BASE, { waitUntil: "domcontentloaded" });
  16  |   await page.waitForFunction(() => document.body.innerText.length > 500, { timeout: 10000 });
  17  |   await page.locator('button[aria-label="โปรไฟล์"]').click();
  18  |   await page.waitForTimeout(1000);
> 19  |   await page.getByText("บัญชีเดโมผู้ซื้อ").click();
      |                                            ^ Error: locator.click: Test timeout of 30000ms exceeded.
  20  |   await page.waitForTimeout(500);
  21  |   await page.evaluate(() => {
  22  |     const btn = document.querySelector('[data-testid="auth-submit-btn"]') as HTMLButtonElement | null;
  23  |     btn?.click();
  24  |   });
  25  |   await page.waitForTimeout(3000);
  26  | 
  27  |   // Step 2: Go to seller register
  28  |   await page.goto(`${BASE}/seller/register`);
  29  |   await page.waitForFunction(() => document.body.innerText.length > 50, { timeout: 15000 });
  30  |   await page.waitForTimeout(1000);
  31  | 
  32  |   // Step 3: Fill seller registration form
  33  |   const inputs = page.locator("input:not([type='hidden'])");
  34  |   const count = await inputs.count();
  35  |   if (count >= 1) await inputs.nth(0).fill("E2E Test Shop");
  36  |   if (count >= 2) await inputs.nth(1).fill("0812345678");
  37  |   await page.waitForTimeout(500);
  38  | 
  39  |   // Step 4: Submit seller form
  40  |   await page.evaluate(() => {
  41  |     const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  42  |     btn?.click();
  43  |   });
  44  |   // Wait for redirect
  45  |   try {
  46  |     await page.waitForURL("**/seller/dashboard**", { timeout: 8000 });
  47  |   } catch {
  48  |     // already registered — will be on /seller/register
  49  |   }
  50  | 
  51  |   // Step 5: If still on /seller/register (already registered), go to dashboard directly
  52  |   if (page.url().includes("/seller/register")) {
  53  |     await page.goto(`${BASE}/seller/dashboard`);
  54  |     await page.waitForTimeout(2000);
  55  |   }
  56  | 
  57  |   // Wait for NextAuth session — demo login always succeeds but sellerId
  58  |   // may not be present. Use networkidle + URL check as ground truth.
  59  |   await page.waitForLoadState("networkidle").catch(() => {});
  60  | 
  61  |   // Verify we ended up on the dashboard (not /seller/register landing)
  62  |   if (!page.url().includes("/seller/dashboard")) {
  63  |     // If we're on /seller/register, the demo buyer is already registered as seller
  64  |     // and proxy.ts allowed through → sellerId must already be set
  65  |     const currentUrl = page.url();
  66  |     if (!currentUrl.includes("/seller/register") && !currentUrl.includes("/seller/dashboard")) {
  67  |       throw new Error(`Unexpected URL after auth: ${currentUrl}`);
  68  |     }
  69  |   }
  70  | }
  71  | 
  72  | test.describe("Seller Product Flow E2E", () => {
  73  | 
  74  |   // -------------------------------------------------------------------------
  75  |   test("1. Product list page loads with stats table", async ({ page }) => {
  76  |     const errors: string[] = [];
  77  |     page.on("console", (msg) => {
  78  |       if (msg.type() === "error") errors.push(msg.text());
  79  |     });
  80  | 
  81  |     await authenticateAsSeller(page);
  82  |     await page.goto(`${BASE}/seller/dashboard/products`);
  83  |     await page.waitForLoadState("networkidle");
  84  |     await page.waitForTimeout(2000);
  85  | 
  86  |     const body = await page.evaluate(() => document.body.innerText);
  87  | 
  88  |     // Page title must be present (sellerProducts_title = "สินค้าของฉัน" / "My Products")
  89  |     expect(
  90  |       body.includes("สินค้าของฉัน") || body.includes("My Products")
  91  |     ).toBeTruthy();
  92  | 
  93  |     // Category filter tabs must be present
  94  |     const hasCategoryTabs =
  95  |       (body.includes("เติมเกม") || body.includes("Gift Card")) &&
  96  |       (body.includes("ทั้งหมด") || body.includes("All"));
  97  | 
  98  |     expect(hasCategoryTabs).toBeTruthy();
  99  | 
  100 |     // Product table headers or empty state must be present
  101 |     const hasTableOrEmpty =
  102 |       body.includes("ยังไม่มีรายการสินค้า") ||
  103 |       body.includes("No products") ||
  104 |       body.includes("สินค้า") ||
  105 |       body.includes("Product");
  106 | 
  107 |     expect(hasTableOrEmpty).toBeTruthy();
  108 | 
  109 |     const realErrors = errors.filter(
  110 |       (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
  111 |     );
  112 |     expect(realErrors).toHaveLength(0);
  113 |   });
  114 | 
  115 |   // -------------------------------------------------------------------------
  116 |   test("2. Add product via API — new product appears in list", async ({ page }) => {
  117 |     const errors: string[] = [];
  118 |     page.on("console", (msg) => {
  119 |       if (msg.type() === "error") errors.push(msg.text());
```