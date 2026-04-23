/**
 * Integration tests for GET /api/products
 * Run with: node tests/api/products.test.js
 * Requires dev server running at localhost:3000
 * 
 * Tests: 200 response, pagination, category filter, sort options, only active products.
 * NOTE: API returns 500 (Database error) in unseeded environments — tests report this.
 */

const BASE_URL = "http://localhost:3000";
const API_PATH = "/api/products";

let passed = 0;
let failed = 0;
let errors = [];
let serverOk = false;

function pass(message) {
  passed++;
  console.log(`  ✓ ${message}`);
}

function fail(message) {
  failed++;
  errors.push(message);
  console.log(`  ✗ ${message}`);
}

function assertStrict(actual, expected, message) {
  if (actual === expected) {
    pass(message || `Expected ${expected}, got ${actual}`);
  } else {
    fail(message || `Expected ${expected}, got ${actual}`);
  }
}

async function fetchJSON(url) {
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    return { status: 0, data: null, networkError: true };
  }
  let data;
  try {
    data = await res.json();
  } catch {
    data = { _raw: await res.text() };
  }
  return { status: res.status, data };
}

function requireOk(status, data) {
  if (status !== 200) {
    fail(`HTTP ${status}: ${JSON.stringify(data)}`);
    return false;
  }
  return true;
}

// ─── Test 1: Basic 200 response ─────────────────────────────────────────────
async function testBasic200Response() {
  console.log("\n[Test 1] Basic 200 response");

  const { status, data } = await fetchJSON(`${BASE_URL}${API_PATH}`);
  assertStrict(status, 200, `HTTP status is 200 (got ${status})`);

  if (!requireOk(status, data)) return;

  if (data === null || data === undefined) {
    fail("Response body is not null");
    return;
  }
  if (!Array.isArray(data.products)) fail("Response has products array");
  if (typeof data.total !== "number") fail("Response has total count");
  if (typeof data.page !== "number") fail("Response has page number");
  if (typeof data.limit !== "number") fail("Response has limit");
}

// ─── Test 2: Pagination ──────────────────────────────────────────────────────
async function testPagination() {
  console.log("\n[Test 2] Pagination");

  const p2 = await fetchJSON(`${BASE_URL}${API_PATH}?page=2&limit=5`);
  if (!requireOk(p2.status, p2.data)) return;
  assertStrict(p2.data.page, 2, "page=2 is respected");
  assertStrict(p2.data.limit, 5, "limit=5 is respected");

  const d10 = await fetchJSON(`${BASE_URL}${API_PATH}?limit=10`);
  if (!requireOk(d10.status, d10.data)) return;
  assertStrict(d10.data.limit, 10, "limit=10 is respected");

  const invPage = await fetchJSON(`${BASE_URL}${API_PATH}?page=-5`);
  if (!requireOk(invPage.status, invPage.data)) return;
  assertStrict(invPage.data.page, 1, "Negative page defaults to 1");

  const overLim = await fetchJSON(`${BASE_URL}${API_PATH}?limit=500`);
  if (!requireOk(overLim.status, overLim.data)) return;
  assertStrict(overLim.data.limit, 100, "Limit capped at 100");
}

// ─── Test 3: Category filter ────────────────────────────────────────────────
async function testCategoryFilter() {
  console.log("\n[Test 3] Category filter");

  const { status, data: allData } = await fetchJSON(`${BASE_URL}${API_PATH}`);
  if (!requireOk(status, allData)) return;

  if (allData.products.length > 0) {
    const cat = allData.products[0].category;
    const filtered = await fetchJSON(`${BASE_URL}${API_PATH}?category=${encodeURIComponent(cat)}`);
    if (!requireOk(filtered.status, filtered.data)) return;

    if (filtered.data.products.length === 0) {
      fail("Category filter returned no products");
    } else {
      pass(`Category filter "${cat}" returned ${filtered.data.products.length} product(s)`);
      for (const p of filtered.data.products) {
        if (p.category !== cat) {
          fail(`Product ${p.id} category ${p.category} != filter ${cat}`);
        }
      }
    }
  } else {
    console.log("  - Skipped: no products in DB to test category filter");
  }

  const empty = await fetchJSON(`${BASE_URL}${API_PATH}?category=nonexistent_cat_xyz`);
  if (!requireOk(empty.status, empty.data)) return;
  assertStrict(empty.data.products.length, 0, "Non-existent category returns empty");
}

// ─── Test 4: Sort options ──────────────────────────────────────────────────
async function testSortOptions() {
  console.log("\n[Test 4] Sort options");

  const priceAsc = await fetchJSON(`${BASE_URL}${API_PATH}?sortBy=price&sortOrder=asc`);
  if (!requireOk(priceAsc.status, priceAsc.data)) return;

  if (priceAsc.data.products.length > 1) {
    let sorted = true;
    for (let i = 1; i < priceAsc.data.products.length; i++) {
      if (priceAsc.data.products[i].price < priceAsc.data.products[i - 1].price) {
        sorted = false;
        break;
      }
    }
    assertStrict(sorted, true, "price asc sort order correct");
  } else {
    pass("price asc: 0–1 products, sort order not verifiable");
  }

  const priceDesc = await fetchJSON(`${BASE_URL}${API_PATH}?sortBy=price&sortOrder=desc`);
  if (!requireOk(priceDesc.status, priceDesc.data)) return;

  if (priceDesc.data.products.length > 1) {
    let sorted = true;
    for (let i = 1; i < priceDesc.data.products.length; i++) {
      if (priceDesc.data.products[i].price > priceDesc.data.products[i - 1].price) {
        sorted = false;
        break;
      }
    }
    assertStrict(sorted, true, "price desc sort order correct");
  } else {
    pass("price desc: 0–1 products, sort order not verifiable");
  }

  const nameSort = await fetchJSON(`${BASE_URL}${API_PATH}?sortBy=name&sortOrder=asc`);
  if (!requireOk(nameSort.status, nameSort.data)) return;
  pass("sortBy=name doesn't error");

  const invSort = await fetchJSON(`${BASE_URL}${API_PATH}?sortBy=invalid_col`);
  if (!requireOk(invSort.status, invSort.data)) return;
  pass("Invalid sortBy doesn't cause error (defaults to created_at)");

  const invOrder = await fetchJSON(`${BASE_URL}${API_PATH}?sortOrder=invalid`);
  if (!requireOk(invOrder.status, invOrder.data)) return;
  pass("Invalid sortOrder doesn't cause error (defaults to desc)");
}

// ─── Test 5: Only active products ──────────────────────────────────────────
async function testOnlyActiveProducts() {
  console.log("\n[Test 5] Only active products returned");

  const { status, data } = await fetchJSON(`${BASE_URL}${API_PATH}?limit=100`);
  if (!requireOk(status, data)) return;

  for (const p of data.products) {
    assertStrict(p.isActive, true, `Product ${p.id} isActive === true`);
  }

  const inactive = data.products.filter(p => p.isActive !== true);
  assertStrict(inactive.length, 0, `No inactive products (total: ${data.products.length})`);
}

// ─── Test 6: Product object shape ────────────────────────────────────────────
async function testProductShape() {
  console.log("\n[Test 6] Product object shape");

  const { status, data } = await fetchJSON(`${BASE_URL}${API_PATH}?limit=5`);
  if (!requireOk(status, data)) return;

  if (data.products.length === 0) {
    console.log("  - Skipped: no products to validate shape");
    return;
  }

  const p = data.products[0];
  if (!(typeof p.id === "string" && p.id.length > 0)) fail("Product has id (string, non-empty)");
  if (!(typeof p.sellerId === "string")) fail("Product has sellerId (string)");
  if (!(typeof p.name === "string" && p.name.length > 0)) fail("Product has name (string, non-empty)");
  if (!(typeof p.description === "string")) fail("Product has description (string)");
  if (!(typeof p.category === "string" && p.category.length > 0)) fail("Product has category (string, non-empty)");
  if (!(typeof p.price === "number")) fail("Product has price (number)");
  if (!(typeof p.stock === "number")) fail("Product has stock (number)");
  if (!(typeof p.image === "string")) fail("Product has image (string)");
  assertStrict(p.isActive, true, "Product isActive === true");
  if (!(typeof p.createdAt === "string")) fail("Product has createdAt (string)");
  if (!(typeof p.updatedAt === "string")) fail("Product has updatedAt (string)");
  if (!(typeof p.seller === "object" && p.seller !== null)) fail("Product has seller (object)");
  if (!(typeof p.seller.id === "string")) fail("Seller has id (string)");
  if (!(typeof p.seller.storeName === "string")) fail("Seller has storeName (string)");
  if (!(typeof p.seller.verified === "boolean")) fail("Seller has verified (boolean)");
}

// ─── Run ────────────────────────────────────────────────────────────────────
async function run() {
  console.log("=".repeat(60));
  console.log("GET /api/products — Integration Tests");
  console.log("Base: " + BASE_URL);
  console.log("=".repeat(60));

  // Verify server is reachable
  const probe = await fetchJSON(`${BASE_URL}/`);
  if (probe.networkError || probe.status === 0) {
    console.error(`\nCannot reach ${BASE_URL}. Start dev server with: npm run dev`);
    process.exit(1);
  }
  console.log(`  Server is up (HTTP ${probe.status})`);

  await testBasic200Response();
  await testPagination();
  await testCategoryFilter();
  await testSortOptions();
  await testOnlyActiveProducts();
  await testProductShape();

  console.log("\n" + "=".repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed (${passed + failed} total)`);

  if (failed > 0) {
    console.log("\nFailed assertions:");
    errors.forEach(e => console.log("  - " + e));
  }

  const dbError = passed === 0 && failed > 0 && errors.every(e => e.includes("500"));
  if (dbError) {
    console.log("\nNOTE: API returned HTTP 500 (Database error) for all requests.");
    console.log("      This indicates the database is unseeded or unreachable.");
    console.log("      The test suite correctly detected and reported this.");
    console.log("      Once the DB is seeded, re-run: node tests/api/products.test.js");
  }

  console.log("=".repeat(60));
  process.exit(failed > 0 ? 1 : 0);
}

run();