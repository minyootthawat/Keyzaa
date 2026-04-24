import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = {
  seller: null as { id: string; user_id: string } | null,
  product: null as Record<string, unknown> | null,
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
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() =>
                buildThenable(mockState.product, null)
              ),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockImplementation(() =>
                  buildThenable(mockState.product, null)
                ),
              }),
              error: null,
            }),
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue(buildThenable(null, null)),
        update: vi.fn().mockReturnValue(buildThenable(null, null)),
      };
    }),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_PRODUCT_ID = "507f1f77bcf86cd799439011";

function buildReq(productId: string, body?: unknown, method = "PATCH") {
  const headers = new Headers();
  if (mockState.authUserId) headers.set("authorization", "Bearer mock-token");
  const init: RequestInit = { headers, method };
  if (body) init.body = JSON.stringify(body);
  return new NextRequest(`http://localhost/api/seller/products/${productId}`, init);
}

function buildParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const baseProductRow = {
  id: VALID_PRODUCT_ID,
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
// GET /api/seller/products/[id]
// ---------------------------------------------------------------------------
describe("GET /api/seller/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.product = null;
    mockState.authUserId = "test-user-id";
    mockState.seller = { id: "seller-001", user_id: "test-user-id" };
  });

  it("returns 401 without auth", async () => {
    mockState.authUserId = "";

    const res = await GET(buildReq(VALID_PRODUCT_ID), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(401);
  });

  it("returns 404 when product not found", async () => {
    mockState.product = null;

    const res = await GET(buildReq(VALID_PRODUCT_ID), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(404);
  });

  it("returns 403 when accessing another seller's product", async () => {
    mockState.product = { ...baseProductRow, seller_id: "other-seller" };

    const res = await GET(buildReq(VALID_PRODUCT_ID), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(403);
  });

  it("returns 200 with product data", async () => {
    mockState.product = { ...baseProductRow };

    const res = await GET(buildReq(VALID_PRODUCT_ID), buildParams(VALID_PRODUCT_ID));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.product).toBeInstanceOf(Object);
    expect(json.product.title).toBe("Test Product");
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/seller/products/[id]
// ---------------------------------------------------------------------------
describe("PATCH /api/seller/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.product = null;
    mockState.authUserId = "test-user-id";
    mockState.seller = { id: "seller-001", user_id: "test-user-id" };
  });

  it("returns 401 without auth", async () => {
    mockState.authUserId = "";

    const res = await PATCH(buildReq(VALID_PRODUCT_ID, { name: "New Name" }), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(401);
  });

  it("returns 404 when product not found", async () => {
    mockState.product = null;

    const res = await PATCH(buildReq(VALID_PRODUCT_ID, { name: "New Name" }), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(404);
  });

  it("returns 403 when updating another seller's product", async () => {
    mockState.product = { ...baseProductRow, seller_id: "other-seller" };

    const res = await PATCH(buildReq(VALID_PRODUCT_ID, { name: "New Name" }), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(403);
  });

  it("successfully updates own product", async () => {
    mockState.product = {
      ...baseProductRow,
      name: "Updated Name",
      price: 200,
      stock: 50,
    };

    const res = await PATCH(
      buildReq(VALID_PRODUCT_ID, { name: "Updated Name", price: 200, stock: 50 }),
      buildParams(VALID_PRODUCT_ID)
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.product).toBeInstanceOf(Object);
    expect(json.product.title).toBe("Updated Name");
    expect(json.product.price).toBe(200);
    expect(json.product.stock).toBe(50);
  });

  it("returns 400 when name is empty", async () => {
    mockState.product = { ...baseProductRow };

    const res = await PATCH(buildReq(VALID_PRODUCT_ID, { name: "" }), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(400);
  });

  it("returns 400 when price is invalid", async () => {
    mockState.product = { ...baseProductRow };

    const res = await PATCH(buildReq(VALID_PRODUCT_ID, { price: -10 }), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(400);
  });

  it("returns 404 when no seller account", async () => {
    mockState.seller = null;

    const res = await PATCH(buildReq(VALID_PRODUCT_ID, { name: "Test" }), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/seller/products/[id]
// ---------------------------------------------------------------------------
describe("DELETE /api/seller/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.product = null;
    mockState.authUserId = "test-user-id";
    mockState.seller = { id: "seller-001", user_id: "test-user-id" };
  });

  it("returns 401 without auth", async () => {
    mockState.authUserId = "";

    const res = await DELETE(buildReq(VALID_PRODUCT_ID, undefined, "DELETE"), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(401);
  });

  it("returns 404 when product not found", async () => {
    mockState.product = null;

    const res = await DELETE(buildReq(VALID_PRODUCT_ID, undefined, "DELETE"), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(404);
  });

  it("returns 403 when deleting another seller's product", async () => {
    mockState.product = { ...baseProductRow, seller_id: "other-seller" };

    const res = await DELETE(buildReq(VALID_PRODUCT_ID, undefined, "DELETE"), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(403);
  });

  it("returns 204 on successful deletion", async () => {
    mockState.product = { ...baseProductRow };

    const res = await DELETE(buildReq(VALID_PRODUCT_ID, undefined, "DELETE"), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(204);
  });
});
