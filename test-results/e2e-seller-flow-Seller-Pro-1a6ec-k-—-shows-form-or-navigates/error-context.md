# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/seller-flow.spec.ts >> Seller Product Flow E2E >> 6. Add-product button click — shows form or navigates
- Location: e2e/seller-flow.spec.ts:349:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /เพิ่มสินค้าใหม่|Add product/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /เพิ่มสินค้าใหม่|Add product/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - main [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e17]:
            - generic [ref=e18]: KZ
            - generic [ref=e19]:
              - paragraph [ref=e20]: Keyzaa Seller
              - paragraph [ref=e21]: แพลตฟอร์มผู้ขาย
          - generic [ref=e22]:
            - generic [ref=e23]:
              - img [ref=e24]
              - text: เปิดร้านฟรี ภายใน 3 นาที
            - heading "เปิดร้านค้าของคุณ บนแพลตฟอร์มที่เชื่อถือได้" [level=2] [ref=e26]
            - paragraph [ref=e27]: เข้าร่วมมาร์เก็ตเพลสดิจิทัลชั้นนำของไทย สร้างรายได้จากการขายสินค้าดิจิทัลได้ทันที ฟรี ไม่มีค่าธรรมเนียม
          - generic [ref=e28]:
            - generic [ref=e29]:
              - paragraph [ref=e30]: 12,000+
              - paragraph [ref=e31]: ร้านค้าทั้งหมด
            - generic [ref=e32]:
              - paragraph [ref=e33]: ฿8.4M
              - paragraph [ref=e34]: เงินที่จ่ายให้ผู้ขาย
            - generic [ref=e35]:
              - paragraph [ref=e36]: "4.9"
              - paragraph [ref=e37]: คะแนนเฉลี่ย
        - generic [ref=e38]:
          - paragraph [ref=e39]: ขั้นตอนง่ายๆ
          - generic [ref=e40]:
            - generic [ref=e41]:
              - generic [ref=e42]:
                - img [ref=e43]
                - generic [ref=e47]: "1"
              - generic [ref=e48]:
                - paragraph [ref=e49]: ลงทะเบียนร้านค้า
                - paragraph [ref=e50]: กรอกชื่อร้านและเบอร์โทรใน 1 นาที
            - generic [ref=e51]:
              - generic [ref=e52]:
                - img [ref=e53]
                - generic [ref=e56]: "2"
              - generic [ref=e57]:
                - paragraph [ref=e58]: ลงรายการสินค้า
                - paragraph [ref=e59]: เพิ่มสินค้าดิจิทัล ราคาถูก ส่งเร็ว
            - generic [ref=e60]:
              - generic [ref=e61]:
                - img [ref=e62]
                - generic [ref=e64]: "3"
              - generic [ref=e65]:
                - paragraph [ref=e66]: รับเงินได้เลย
                - paragraph [ref=e67]: รายได้เข้ากระเป๋าเงินภายในระบบ ถอนได้ทุกวัน
        - generic [ref=e69]:
          - generic [ref=e70]: S
          - generic [ref=e71]:
            - paragraph [ref=e72]: “เปิดร้านบน Keyzaa ได้เร็วมาก สินค้าดิจิทัลขายดีมากในกลุ่มลูกค้าไทย”
            - paragraph [ref=e73]: — ร้าน DigiTopUp
      - generic [ref=e75]:
        - generic [ref=e76]:
          - generic [ref=e77]:
            - heading "ลงทะเบียนร้านค้า" [level=2] [ref=e78]
            - paragraph [ref=e79]: เริ่มต้นการขายภายในไม่กี่ขั้นตอน
          - generic [ref=e80]:
            - generic [ref=e81]:
              - generic [ref=e82]:
                - img [ref=e83]
                - text: ชื่อร้านค้า
              - generic [ref=e87]:
                - textbox "ชื่อร้านค้า" [ref=e88]:
                  - /placeholder: เช่น MyGameShop, เติมเกมดิจิทัล
                - img [ref=e89]
            - generic [ref=e93]:
              - generic [ref=e94]:
                - img [ref=e95]
                - text: เบอร์โทรศัพท์
              - generic [ref=e97]:
                - textbox "เบอร์โทรศัพท์" [ref=e98]:
                  - /placeholder: "0812345678"
                - img [ref=e99]
            - button "เข้าร่วมเป็นผู้ขาย" [ref=e101]:
              - generic [ref=e102]: เข้าร่วมเป็นผู้ขาย
              - img [ref=e103]
          - generic [ref=e105]:
            - generic [ref=e106]:
              - img [ref=e107]
              - generic [ref=e110]: ข้อมูลปลอดภัย
            - generic [ref=e112]:
              - img [ref=e113]
              - generic [ref=e115]: ลงทะเบียนใน 3 นาที
            - generic [ref=e117]:
              - img [ref=e118]
              - generic [ref=e120]: ไม่มีค่าใช้จ่าย
        - paragraph [ref=e121]:
          - text: มีบัญชีอยู่แล้ว?
          - link "เข้าสู่ระบบ Seller Center" [ref=e122] [cursor=pointer]:
            - /url: /seller/dashboard
  - generic [ref=e123]:
    - generic:
      - generic:
        - paragraph: มีข้อสงสัย? คุยกับเราสิ
        - paragraph: ตอบไวภายใน 1 นาที
    - link [ref=e124] [cursor=pointer]:
      - /url: https://line.me/ti/p/@keyzaa
      - img [ref=e125]
```

# Test source

```ts
  261 |           name: `Delete Test Product ${ts}`,
  262 |           category: "topup",
  263 |           price: 49,
  264 |           stock: 5,
  265 |         }),
  266 |       });
  267 |       return { ok: res.ok, status: res.status, body: await res.json() };
  268 |     }, timestamp);
  269 | 
  270 |     if (!createRes.ok) return;
  271 | 
  272 |     const productId = createRes.body.product.id;
  273 | 
  274 |     // Confirm it is in the list
  275 |     await page.goto(`${BASE}/seller/dashboard/products`);
  276 |     await page.waitForLoadState("networkidle");
  277 |     await page.waitForTimeout(2000);
  278 |     let body = await page.evaluate(() => document.body.innerText);
  279 |     expect(body).toContain(`Delete Test Product ${timestamp}`);
  280 | 
  281 |     // DELETE via API
  282 |     const deleteRes = await page.evaluate(async (id: string) => {
  283 |       const token = localStorage.getItem("keyzaa_token");
  284 |       const res = await fetch(`/api/seller/products/${id}`, {
  285 |         method: "DELETE",
  286 |         headers: {
  287 |           "Content-Type": "application/json",
  288 |           ...(token ? { Authorization: `Bearer ${token}` } : {}),
  289 |         },
  290 |       });
  291 |       return { ok: res.ok, status: res.status };
  292 |     }, productId);
  293 | 
  294 |     expect(deleteRes.ok).toBeTruthy();
  295 | 
  296 |     // Reload and confirm it is gone from the active list
  297 |     await page.goto(`${BASE}/seller/dashboard/products`);
  298 |     await page.waitForLoadState("networkidle");
  299 |     await page.waitForTimeout(2000);
  300 |     body = await page.evaluate(() => document.body.innerText);
  301 |     expect(body).not.toContain(`Delete Test Product ${timestamp}`);
  302 | 
  303 |     const realErrors = errors.filter(
  304 |       (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
  305 |     );
  306 |     expect(realErrors).toHaveLength(0);
  307 |   });
  308 | 
  309 |   // -------------------------------------------------------------------------
  310 |   test("5. Product list stats — total / active / low-stock / inventory value", async ({ page }) => {
  311 |     const errors: string[] = [];
  312 |     page.on("console", (msg) => {
  313 |       if (msg.type() === "error") errors.push(msg.text());
  314 |     });
  315 | 
  316 |     await authenticateAsSeller(page);
  317 |     // Stats cards are on the dashboard overview page, not the products page
  318 |     await page.goto(`${BASE}/seller/dashboard`);
  319 |     await page.waitForLoadState("networkidle");
  320 |     await page.waitForTimeout(2000);
  321 | 
  322 |     const body = await page.evaluate(() => document.body.innerText);
  323 | 
  324 |     // All four stat labels must be present
  325 |     expect(
  326 |       body.includes("รายการทั้งหมด") || body.includes("All listings")
  327 |     ).toBeTruthy();
  328 |     expect(
  329 |       body.includes("เปิดขายอยู่") || body.includes("Active")
  330 |     ).toBeTruthy();
  331 |     expect(
  332 |       body.includes("สต็อกใกล้หมด") || body.includes("Low stock")
  333 |     ).toBeTruthy();
  334 |     expect(
  335 |       body.includes("มูลค่าสินค้าคงเหลือ") || body.includes("Inventory value")
  336 |     ).toBeTruthy();
  337 | 
  338 |     // Each stat must show a number
  339 |     const numberCount = (body.match(/\d+/g) || []).length;
  340 |     expect(numberCount).toBeGreaterThan(0);
  341 | 
  342 |     const realErrors = errors.filter(
  343 |       (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
  344 |     );
  345 |     expect(realErrors).toHaveLength(0);
  346 |   });
  347 | 
  348 |   // -------------------------------------------------------------------------
  349 |   test("6. Add-product button click — shows form or navigates", async ({ page }) => {
  350 |     const errors: string[] = [];
  351 |     page.on("console", (msg) => {
  352 |       if (msg.type() === "error") errors.push(msg.text());
  353 |     });
  354 | 
  355 |     await authenticateAsSeller(page);
  356 |     await page.goto(`${BASE}/seller/dashboard/products`);
  357 |     await page.waitForLoadState("networkidle");
  358 |     await page.waitForTimeout(2000);
  359 | 
  360 |     const addBtn = page.getByRole("button", { name: /เพิ่มสินค้าใหม่|Add product/i });
> 361 |     await expect(addBtn).toBeVisible({ timeout: 5000 });
      |                          ^ Error: expect(locator).toBeVisible() failed
  362 |     await addBtn.click();
  363 |     await page.waitForTimeout(3000);
  364 | 
  365 |     const url = page.url();
  366 |     const body = await page.evaluate(() => document.body.innerText);
  367 | 
  368 |     // After clicking, the page should either show a form or navigate elsewhere.
  369 |     // We verify the UI did not crash (body is non-trivial).
  370 |     expect(body.length).toBeGreaterThan(50);
  371 | 
  372 |     // Form fields that would appear in an add-product dialog/page
  373 |     const hasFormFields =
  374 |       body.includes("ชื่อสินค้า") || body.includes("Product name") ||
  375 |       body.includes("ราคา") || body.includes("Price") ||
  376 |       body.includes("หมวดหมู่") || body.includes("Category") ||
  377 |       body.includes("สต็อก") || body.includes("Stock");
  378 | 
  379 |     const urlChanged = url !== `${BASE}/seller/dashboard/products`;
  380 | 
  381 |     expect(hasFormFields || urlChanged).toBeTruthy();
  382 | 
  383 |     const realErrors = errors.filter(
  384 |       (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
  385 |     );
  386 |     expect(realErrors).toHaveLength(0);
  387 |   });
  388 | 
  389 |   // -------------------------------------------------------------------------
  390 |   test("7. Product form contains image upload field", async ({ page }) => {
  391 |     const errors: string[] = [];
  392 |     page.on("console", (msg) => {
  393 |       if (msg.type() === "error") errors.push(msg.text());
  394 |     });
  395 | 
  396 |     await authenticateAsSeller(page);
  397 |     await page.goto(`${BASE}/seller/dashboard/products`);
  398 |     await page.waitForLoadState("networkidle");
  399 |     await page.waitForTimeout(2000);
  400 | 
  401 |     const addBtn = page.getByRole("button", { name: /เพิ่มสินค้าใหม่|Add product/i });
  402 |     await addBtn.click();
  403 |     await page.waitForTimeout(3000);
  404 | 
  405 |     const body = await page.evaluate(() => document.body.innerText);
  406 |     const url = page.url();
  407 | 
  408 |     // Look for image-related text OR a file input element
  409 |     const hasImageText =
  410 |       body.includes("รูปภาพ") || body.includes("Image") ||
  411 |       body.includes("อัปโหลด") || body.includes("upload") ||
  412 |       body.includes("ภาพปก") || body.includes("cover");
  413 | 
  414 |     const fileInputCount = await page.locator('input[type="file"]').count();
  415 | 
  416 |     // Either the UI shows image text or a file input element exists on the page
  417 |     expect(hasImageText || fileInputCount > 0 || !url.includes("/products")).toBeTruthy();
  418 | 
  419 |     const realErrors = errors.filter(
  420 |       (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
  421 |     );
  422 |     expect(realErrors).toHaveLength(0);
  423 |   });
  424 | 
  425 |   // -------------------------------------------------------------------------
  426 |   test("8. Create product with image URL via API — image stored", async ({ page }) => {
  427 |     const errors: string[] = [];
  428 |     page.on("console", (msg) => {
  429 |       if (msg.type() === "error") errors.push(msg.text());
  430 |     });
  431 | 
  432 |     await authenticateAsSeller(page);
  433 | 
  434 |     const timestamp = Date.now();
  435 |     const createRes = await page.evaluate(async (ts: number) => {
  436 |       const token = localStorage.getItem("keyzaa_token");
  437 |       const res = await fetch("/api/seller/products", {
  438 |         method: "POST",
  439 |         headers: {
  440 |           "Content-Type": "application/json",
  441 |           ...(token ? { Authorization: `Bearer ${token}` } : {}),
  442 |         },
  443 |         body: JSON.stringify({
  444 |           name: `Image Product ${ts}`,
  445 |           category: "giftcard",
  446 |           price: 150,
  447 |           stock: 20,
  448 |           image: "https://example.com/product.png",
  449 |         }),
  450 |       });
  451 |       return { ok: res.ok, status: res.status, body: await res.json() };
  452 |     }, timestamp);
  453 | 
  454 |     if (!createRes.ok) return;
  455 | 
  456 |     expect(createRes.body.product).toBeDefined();
  457 |     expect(createRes.body.product.image).toBe("https://example.com/product.png");
  458 | 
  459 |     // Verify product name appears in the list page
  460 |     await page.goto(`${BASE}/seller/dashboard/products`);
  461 |     await page.waitForFunction(() => document.body.innerText.length > 50, { timeout: 15000 });
```