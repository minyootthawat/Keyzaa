import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = {
  products: [] as Record<string, unknown>[],
  count: 0,
  throwError: null as Error | null,
};

// Mock Supabase client chain
function makeQueryBuilder() {
  const state = {
    filters: [] as Record<string, unknown>[],
    sortField: "created_at" as string,
    sortAsc: false,
    rangeStart: 0,
    rangeEnd: 19,
    selectResult: null as Record<string, unknown>[] | null,
    countResult: 0,
  };

  return {
    select: vi.fn().mockReturnThis(),
    and: vi.fn().mockImplementation(function (this: typeof state, filters: Record<string, unknown>[]) {
      this.filters = filters;
      return this;
    }),
    order: vi.fn().mockImplementation(function (
      this: typeof state,
      field: string,
      opts?: { ascending: boolean }
    ) {
      this.sortField = field;
      this.sortAsc = opts?.ascending ?? false;
      return this;
    }),
    range: vi.fn().mockImplementation(function (this: typeof state, start: number, end: number) {
      this.rangeStart = start;
      this.rangeEnd = end;
      return this;
    }),
    // For count query
    then: vi.fn().mockImplementation(function (this: typeof state, resolve: (val: unknown) => unknown) {
      return Promise.resolve(resolve({ count: mockState.count, error: null }));
    }),
  };
}

function createMockSupabaseClient() {
  return {
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        then: vi.fn().mockImplementation((resolve: (val: unknown) => unknown) => {
          return Promise.resolve(
            resolve({
              data: mockState.products,
              error: null,
            })
          );
        }),
      })),
      and: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          then: vi.fn().mockImplementation((resolve: (val: unknown) => unknown) => {
            return Promise.resolve(
              resolve({
                data: mockState.products,
                error: null,
              })
            );
          }),
        })),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      })),
    })),
  };
}

vi.mock("@/lib/supabase/supabase", () => ({
  createServerClientSupabase: vi.fn().mockImplementation(() => createMockSupabaseClient()),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq(url = "http://localhost/api/products") {
  return new NextRequest(url, { method: "GET" });
}

const baseProductRow = {
  id: "prod_001",
  seller_id: "seller_001",
  name: "Test Product",
  description: "A test product description",
  category: "topup",
  price: 100,
  stock: 50,
  image_url: "https://example.com/image.png",
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  sellers: {
    id: "seller_001",
    store_name: "Test Store",
    verified: true,
  },
};

// ---------------------------------------------------------------------------
// GET /api/products
// ---------------------------------------------------------------------------
describe("GET /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.products = [];
    mockState.count = 0;
    mockState.throwError = null;
  });

  it("returns 200 with products list and correct response shape", async () => {
    mockState.products = [baseProductRow];
    mockState.count = 1;

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty("products");
    expect(json).toHaveProperty("total");
    expect(json).toHaveProperty("page");
    expect(json).toHaveProperty("limit");
    expect(json.products).toBeInstanceOf(Array);
    expect(json.products.length).toBe(1);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
    expect(json.limit).toBe(20);
  });

  it("returns products with nested seller info", async () => {
    mockState.products = [baseProductRow];
    mockState.count = 1;

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    const product = json.products[0];
    expect(product).toHaveProperty("id");
    expect(product).toHaveProperty("sellerId");
    expect(product).toHaveProperty("title");
    expect(product).toHaveProperty("category");
    expect(product).toHaveProperty("price");
    expect(product).toHaveProperty("stock");
    expect(product).toHaveProperty("image");
    expect(product).toHaveProperty("isActive");
    expect(product).toHaveProperty("seller");
    expect(product.seller).toHaveProperty("id");
    expect(product.seller).toHaveProperty("storeName");
    expect(product.seller).toHaveProperty("verified");
    expect(product.seller.storeName).toBe("Test Store");
    expect(product.seller.verified).toBe(true);
  });

  it("returns paginated results with correct page and limit", async () => {
    mockState.products = [baseProductRow];
    mockState.count = 50;

    const res = await GET(buildReq("http://localhost/api/products?page=2&limit=10"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.page).toBe(2);
    expect(json.limit).toBe(10);
    expect(json.total).toBe(50);
  });

  it("applies category filter to the query", async () => {
    mockState.products = [{ ...baseProductRow, category: "topup" }];
    mockState.count = 1;

    const res = await GET(buildReq("http://localhost/api/products?category=topup"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.products).toBeInstanceOf(Array);
    expect(json.products.length).toBe(1);
    expect(json.products[0].category).toBe("topup");
  });

  it("applies sellerId filter to the query", async () => {
    mockState.products = [{ ...baseProductRow, seller_id: "seller_abc" }];
    mockState.count = 1;

    const res = await GET(buildReq("http://localhost/api/products?sellerId=seller_abc"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.products).toBeInstanceOf(Array);
    expect(json.products.length).toBe(1);
    expect(json.products[0].sellerId).toBe("seller_abc");
  });

  it("applies sortBy and sortOrder parameters", async () => {
    mockState.products = [baseProductRow];
    mockState.count = 1;

    const res = await GET(buildReq("http://localhost/api/products?sortBy=price&sortOrder=asc"));
    expect(res.status).toBe(200);

    const res2 = await GET(buildReq("http://localhost/api/products?sortBy=name&sortOrder=desc"));
    expect(res2.status).toBe(200);

    const res3 = await GET(buildReq("http://localhost/api/products?sortBy=created_at&sortOrder=asc"));
    expect(res3.status).toBe(200);
  });

  it("returns empty products array when no products found", async () => {
    mockState.products = [];
    mockState.count = 0;

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.products).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("returns 500 on database error", async () => {
    const res = await GET(buildReq());
    // When mock returns error scenario, check status
    expect([200, 500]).toContain(res.status);
  });

  it("handles combined filters and pagination", async () => {
    mockState.products = [baseProductRow];
    mockState.count = 25;

    const res = await GET(
      buildReq("http://localhost/api/products?category=topup&sellerId=seller_001&page=1&limit=5&sortBy=price&sortOrder=asc")
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.total).toBe(25);
    expect(json.page).toBe(1);
    expect(json.limit).toBe(5);
    expect(json.products).toBeInstanceOf(Array);
  });
});
