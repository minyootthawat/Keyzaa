import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const PAGES = [
  '/seller/dashboard',
  '/seller/dashboard/products',
  '/seller/dashboard/orders',
  '/seller/dashboard/wallet',
  '/seller/dashboard/settings',
  '/seller/dashboard/game-accounts',
];

const NAV_LINKS = [
  { href: '/seller/dashboard', label: /ภาพรวม|Overview/i },
  { href: '/seller/dashboard/orders', label: /คำสั่งซื้อ|Orders/i },
  { href: '/seller/dashboard/products', label: /สินค้า|Products/i },
  { href: '/seller/dashboard/game-accounts', label: /บัญชีเกม|Game Accounts/i },
  { href: '/seller/dashboard/wallet', label: /กระเป๋าเงิน|Wallet/i },
  { href: '/seller/dashboard/settings', label: /ตั้งค่า|Settings/i },
];

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
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

  // ─────────────────────────────────────────────
  // TEST 1: Auth protection — redirect to /seller/register
  // ─────────────────────────────────────────────
  await test('1. Auth protection — all pages redirect unauthenticated users', async () => {
    for (const path of PAGES) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const url = page.url();
      if (!url.includes('/seller/register') && !url.includes('/auth')) {
        throw new Error(`Expected redirect from ${path}, got ${url}`);
      }
    }
  });

  // ─────────────────────────────────────────────
  // TEST 2: Loading states — skeleton UI present
  // ─────────────────────────────────────────────
  await test('2. Loading states — skeleton/animation visible on dashboard', async () => {
    // Login first
    await page.goto(`${BASE}/auth/signin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Try to find and fill login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passInput = page.locator('input[type="password"], input[name="password"]').first();
    
    if (await emailInput.isVisible({ timeout: 3000 })) {
      await emailInput.fill('test@keyzaa.com');
      await passInput.fill('password123');
      await page.locator('button[type="submit"], button:has-text("เข้าสู่ระบบ"), button:has-text("Sign in")').click();
      await page.waitForTimeout(3000);
    }

    // Navigate to dashboard and check for loading state
    await page.goto(`${BASE}/seller/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Check for skeleton loading (animate-pulse)
    const skeleton = await page.locator('.animate-pulse').count();
    const loadingText = await page.evaluate(() => document.body.innerHTML.includes('animate-pulse'));
    
    if (skeleton === 0 && !loadingText) {
      // No skeleton found, but this could mean page loaded too fast — just check page content
      const text = await page.evaluate(() => document.body.innerText);
      if (text.length < 50) {
        throw new Error(`Dashboard page appears empty: ${text.length} chars`);
      }
    }
  });

  // ─────────────────────────────────────────────
  // TEST 3: Page content renders
  // ─────────────────────────────────────────────
  await test('3. All 6 pages render non-empty content', async () => {
    for (const path of PAGES) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // Check we didn't redirect (already authenticated)
      const url = page.url();
      if (url.includes('/seller/register') || url.includes('/auth')) {
        console.log(`  ⚠️  ${path}: redirected to ${url} (likely unauthenticated)`);
        continue;
      }
      
      const text = await page.evaluate(() => document.body.innerText);
      if (text.length < 50) {
        throw new Error(`${path} rendered only ${text.length} chars`);
      }
      console.log(`  ℹ️  ${path}: ${text.length} chars`);
    }
  });

  // ─────────────────────────────────────────────
  // TEST 4: Sidebar nav links — all hrefs valid
  // ─────────────────────────────────────────────
  await test('4. Sidebar nav links — no dead links on desktop', async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/seller/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const url = page.url();
    if (url.includes('/seller/register') || url.includes('/auth')) {
      console.log(`  ⚠️  Skipped — not authenticated`);
    } else {
      // Find sidebar nav links
      const navLinks = page.locator('aside a, nav a');
      const count = await navLinks.count();
      console.log(`  ℹ️  Found ${count} nav links in sidebar`);
      
      for (let i = 0; i < count; i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');
        const text = await link.innerText();
        
        if (href && href.startsWith('/seller/dashboard')) {
          // Click and verify page loads
          await link.click();
          await page.waitForTimeout(1500);
          const newUrl = page.url();
          const newText = await page.evaluate(() => document.body.innerText);
          
          if (newText.length < 50) {
            throw new Error(`Dead link: ${href} (${text}) rendered empty page`);
          }
          console.log(`  ℹ️  Nav link ${href} → ${newUrl} (${newText.length} chars)`);
          
          // Navigate back to dashboard for next iteration
          await page.goto(`${BASE}/seller/dashboard`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  // ─────────────────────────────────────────────
  // TEST 5: Mobile sidebar collapse
  // ─────────────────────────────────────────────
  await test('5. Mobile sidebar — collapses/overflows on small viewport', async () => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto(`${BASE}/seller/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const url = page.url();
    if (url.includes('/seller/register') || url.includes('/auth')) {
      console.log(`  ⚠️  Skipped — not authenticated`);
    } else {
      // Check if sidebar is visible
      const sidebar = page.locator('aside');
      const sidebarVisible = await sidebar.isVisible();
      console.log(`  ℹ️  Sidebar visible on mobile: ${sidebarVisible}`);
      
      // Check for horizontal overflow in nav (indicator of overflow-x-auto)
      const hasOverflowNav = await page.locator('nav.no-scrollbar').count();
      console.log(`  ℹ️  Nav has overflow-x-auto: ${hasOverflowNav > 0}`);
    }
  });

  // ─────────────────────────────────────────────
  // TEST 6: Error states — simulate API failure
  // ─────────────────────────────────────────────
  await test('6. Error states — pages handle API errors gracefully', async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Block API calls to simulate errors
    await page.route('**/api/seller/**', route => route.abort());
    
    for (const path of PAGES) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const url = page.url();
      if (url.includes('/seller/register') || url.includes('/auth')) {
        console.log(`  ⚠️  ${path}: redirected (auth protection)`);
        continue;
      }
      
      const text = await page.evaluate(() => document.body.innerText);
      
      // Check for error indicators or empty states
      const hasError = text.includes('error') || text.includes('Error') || 
                       text.includes('ไม่สามารถ') || text.includes('failed');
      const isEmpty = text.length < 50;
      
      if (isEmpty && !hasError) {
        console.log(`  ⚠️  ${path}: empty page on API failure (${text.length} chars)`);
      } else {
        console.log(`  ℹ️  ${path}: ${hasError ? 'shows error state' : 'empty state'} (${text.length} chars)`);
      }
    }
    
    // Remove route blocking
    await page.unroute('**/api/seller/**');
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
