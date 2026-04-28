import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto(`${BASE}/backoffice/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@keyzaa.local');
  await page.fill('input[type="password"]', 'demo123');
  await page.click('button[type="submit"]');
  
  try {
    await page.waitForURL(/\/backoffice\/dashboard/, { timeout: 10000 });
    console.log('Login OK:', page.url());
  } catch {
    console.log('Login FAILED. URL:', page.url());
    await browser.close();
    return;
  }
  
  await page.waitForLoadState('networkidle');
  console.log('Cookies:', (await context.cookies()).map(c => c.name).join(', '));

  // Check AuthContext state  
  const authState = await page.evaluate(async () => {
    // Wait for auth to resolve
    await new Promise(r => setTimeout(r, 2000));
    const resp = await fetch('/api/auth/me');
    const data = await resp.json();
    return data;
  });
  console.log('/api/auth/me:', JSON.stringify(authState));
  
  // Check admin/me
  const adminMe = await page.evaluate(async () => {
    const resp = await fetch('/api/admin/me');
    const data = await resp.json();
    return { status: resp.status, data };
  });
  console.log('/api/admin/me:', JSON.stringify(adminMe));
  
  // Check if admin_token cookie is sent automatically
  const overviewCall = await page.evaluate(async () => {
    const resp = await fetch('/api/backoffice/overview');
    let body;
    try { body = await resp.json(); } catch { body = await resp.text(); }
    return { status: resp.status, body };
  });
  console.log('/api/backoffice/overview (no header):', JSON.stringify(overviewCall));
  
  // Check overview with admin_token as header
  const overviewWithHeader = await page.evaluate(async () => {
    const doc = await page.evaluate(() => document.cookie);
    const match = doc.match(/admin_token=([^;]+)/);
    const token = match ? match[1] : null;
    const resp = await fetch('/api/backoffice/overview', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    let body;
    try { body = await resp.json(); } catch { body = await resp.text(); }
    return { status: resp.status, body, tokenFound: !!token, tokenPreview: token ? token.substring(0, 20) + '...' : null };
  });
  console.log('/api/backoffice/overview (with header from doc.cookie):', JSON.stringify(overviewWithHeader));
  
  await browser.close();
}

run().catch(console.error);
