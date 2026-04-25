import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  async function test(name, fn) {
    try {
      await fn();
      results.push({ name, pass: true });
      console.log(`✅ ${name}`);
    } catch (e) {
      results.push({ name, pass: false, error: e.message });
      console.log(`❌ ${name}: ${e.message}`);
    }
  }

  // Test 1: Homepage loads
  await test('1. Homepage loads', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.evaluate(() => document.body.innerText);
    if (text.length < 100) throw new Error(`Homepage body too short: ${text.length}`);
  });

  // Test 2: Seller register page loads
  await test('2. Seller register page loads', async () => {
    await page.goto(`${BASE}/seller/register`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.evaluate(() => document.body.innerText);
    if (!text.includes('ลงทะเบียนร้านค้า')) throw new Error(`Missing register heading, got: ${text.substring(0, 200)}`);
  });

  // Test 3: Login dialog opens
  await test('3. Login dialog opens', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    // Click profile button
    const btn = page.locator('button[aria-label="โปรไฟล์"]');
    await btn.click();
    await page.waitForTimeout(1000);
    // Check if auth dialog opened
    const dialog = await page.evaluate(() => document.querySelector('.fixed.inset-0') !== null || document.querySelector('[role="dialog"]') !== null);
    if (!dialog) throw new Error('Auth dialog not found');
  });

  // Test 4: Seller dashboard loads (authenticated)
  await test('4. Seller dashboard loads', async () => {
    // Login first via API
    const loginRes = await page.evaluate(async () => {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'seller@test.com', password: 'password123' })
      });
      return { ok: r.ok, status: r.status, token: r.ok ? await r.text() : null };
    });

    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);

    // Set token in localStorage
    const tokenData = JSON.parse(loginRes.token);
    await page.evaluate((token) => {
      localStorage.setItem('keyzaa_token', token.token || token);
    }, loginRes.token);

    // Navigate to dashboard
    await page.goto(`${BASE}/seller/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.evaluate(() => document.body.innerText);
    if (!text.includes('แผงผู้ขาย') && !text.includes('ภาพรวม')) {
      throw new Error(`Dashboard not rendered, got: ${text.substring(0, 200)}`);
    }
  });

  // Test 5: Seller products page
  await test('5. Seller products page', async () => {
    await page.goto(`${BASE}/seller/dashboard/products`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.evaluate(() => document.body.innerText);
    if (text.length < 50) throw new Error(`Products page empty: ${text.length}`);
  });

  // Test 6: Seller orders page
  await test('6. Seller orders page', async () => {
    await page.goto(`${BASE}/seller/dashboard/orders`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.evaluate(() => document.body.innerText);
    if (text.length < 50) throw new Error(`Orders page empty: ${text.length}`);
  });

  // Test 7: Seller wallet page
  await test('7. Seller wallet page', async () => {
    await page.goto(`${BASE}/seller/dashboard/wallet`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.evaluate(() => document.body.innerText);
    if (text.length < 50) throw new Error(`Wallet page empty: ${text.length}`);
  });

  await browser.close();

  console.log('\n=== Summary ===');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`✅ ${passed} passed`);
  console.log(`❌ ${failed} failed`);
  if (failed > 0) {
    console.log('Failed tests:');
    results.filter(r => !r.pass).forEach(r => console.log(`  - ${r.name}: ${r.error}`));
  }
}

runTests().catch(console.error);
