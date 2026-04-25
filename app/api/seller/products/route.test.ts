import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = {
  seller: null as { id: string; user_id: string; verified: boolean } | null,
  products: [] as Record<string, unknown>[],
  authUserId: "test-user-id",
};

function buildThenable(data: unknown, error: unknown) {
  const obj: Record<string, unknown> = {
    then: (resolve: (val: { data: unknown; error: unknown }) => void) => {
      setTimeout(() => resolve({ data, error }), 0);
      return obj;
    },
  };
  const methods = [
    "select",
    "eq",
    "neq",
    "order",
    "limit",
    "in",
    "single",
    "maybeSingle",
    "data",
    "error",
    "count",
  ];
  for (const m of methods) {
    obj[m] = () => buildThenable(data, error);
  }
  return obj;
}

vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi.fn().mockImplementation(() => {
    if (!mockState.authUserId) return Promise.resolve(null);
    return Promise.resolve({ userId: mockState.authUserId });
  }),
}));

vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "sellers") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() =>
                buildThenable(mockState.seller, null)
              ),
            }),
          }),
        };
      }
      if (table === "products") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            data: mockState.products,
            error: null,
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() =>
                buildThenable(mockState.products[0] || {
                  id: "prod-new",
                  seller_id: mockState.seller?.id || "seller-001",
                  name: "New Product",
                  description: null,
                  category: "topup",
                  price: 100,
                  stock: 10,
                  image_url: null,
                  is_active: true,
                  created_at: "2025-01-01T00:00:00Z",
                  updated_at: "2025-01-01T00:00:00Z",
                }, null)
              ),
            }),
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue(buildThenable(null, null)),
        insert: vi.fn().mockReturnValue(buildThenable(null, null)),
      };
    }),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq(url = "http://localhost/api/seller/products", method = "GET", body?: unknown) {
  const headers = new Headers();
  if (mockState.authUserId) headers.set("authorization", "Bearer mock-token");
  const init: RequestInit = { headers, method };
  if (body) init.body = JSON.stringify(body);
  return new NextRequest(url, init);
}

const baseProductRow = {
  id: "prod-id-001",
  seller_id: "seller-001",
  name: "Test Product",
  description: "A test product",
  category: "topup",
  price: 100,
  stock: 10,
  image_url: null,
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// GET /api/seller/products
// ---------------------------------------------------------------------------
describe("GET /api/seller/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.products = [];
    mockState.authUserId = "test-user-id";
    mockState.seller = { id: "seller-001", user_id: "test-user-id", verified: true };
  });

  it("returns 401 without auth", async () => {
    mockState.authUserId = "";

    const res = await GET(buildReq());
    expect(res.status).toBe(401);
  });

  it("returns 404 when no seller account", async () => {
    mockState.seller = null;

    const res = await GET(buildReq());
    expect(res.status).toBe(404);
  });

  it("returns only auth seller's products", async () => {
    mockState.products = [
      { ...baseProductRow, id: "prod-1", seller_id: "seller-001" },
      { ...baseProductRow, id: "prod-2", seller_id: "seller-001" },
    ];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.products).toBeInstanceOf(Array);
    expect(json.products.length).toBe(2);
  });

  it("returns empty array when no products found", async () => {
    mockState.products = [];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.products).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// POST /api/seller/products
// ---------------------------------------------------------------------------
describe("POST /api/seller/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.products = [];
    mockState.authUserId = "test-user-id";
    mockState.seller = { id: "seller-001", user_id: "test-user-id", verified: true };
  });

  it("returns 401 without auth", async () => {
    mockState.authUserId = "";

    const res = await POST(buildReq("http://localhost/api/seller/products", "POST", {
      name: "New Product",
      category: "topup",
      price: 100,
      stock: 10,
    }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when no seller account", async () => {
    mockState.seller = null;

    const res = await POST(buildReq("http://localhost/api/seller/products", "POST", {
      name: "New Product",
      category: "topup",
      price: 100,
      stock: 10,
    }));
    expect(res.status).toBe(404);
  });

  it("returns 403 when seller not verified", async () => {
    mockState.seller = { id: "seller-001", user_id: "test-user-id", verified: false };

    const res = await POST(buildReq("http://localhost/api/seller/products", "POST", {
      name: "New Product",
      category: "topup",
      price: 100,
      stock: 10,
    }));
    expect(res.status).toBe(403);
  });

  it("returns 400 when name is missing", async () => {
    const res = await POST(buildReq("http://localhost/api/seller/products", "POST", {
      category: "topup",
      price: 100,
      stock: 10,
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when price is invalid", async () => {
    const res = await POST(buildReq("http://localhost/api/seller/products", "POST", {
      name: "New Product",
      category: "topup",
      price: -10,
      stock: 10,
    }));
    expect(res.status).toBe(400);
  });

  it("returns 201 with created product", async () => {
    const newProduct = {
      id: "prod-new",
      seller_id: "seller-001",
      name: "New Product",
      description: null,
      category: "topup",
      price: 100,
      stock: 10,
      image_url: null,
      is_active: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };
    mockState.products = [newProduct];

    const res = await POST(buildReq("http://localhost/api/seller/products", "POST", {
      name: "New Product",
      category: "topup",
      price: 100,
      stock: 10,
    }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.product).toBeInstanceOf(Object);
    expect(json.product.title).toBe("New Product");
  });
});
