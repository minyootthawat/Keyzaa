import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = {
  product: null as Record<string, unknown> | null,
  throwError: null as Error | null,
  sellerData: null as { id: string; user_id: string } | null,
  authUserId: "test-user-id",
  updateResult: null as Record<string, unknown> | null,
};

function makeCollection(name: string) {
  if (name === "products") {
    return {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
      }),
      findOne: vi.fn().mockImplementation(() => {
        if (mockState.throwError) return Promise.reject(mockState.throwError);
        return Promise.resolve(mockState.product);
      }),
      findOneAndUpdate: vi.fn().mockImplementation(() => {
        if (mockState.throwError) return Promise.reject(mockState.throwError);
        return Promise.resolve(mockState.updateResult);
      }),
      insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-id" }),
    };
  }
  return {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    }),
    findOne: vi.fn().mockResolvedValue(null),
    insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-id" }),
  };
}

vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi.fn().mockImplementation(() => {
    if (!mockState.authUserId) return Promise.resolve(null);
    return Promise.resolve({ userId: mockState.authUserId });
  }),
}));

vi.mock("@/lib/db/mongodb", () => ({
  connectDB: vi.fn().mockImplementation(async () => {
    if (mockState.throwError) throw mockState.throwError;
    return {
      client: {} as unknown,
      db: {
        collection: vi.fn().mockImplementation((name: string) => makeCollection(name)),
      },
    };
  }),
  getDb: vi.fn(),
}));

vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(() => {
            if (!mockState.sellerData) {
              return Promise.resolve({ data: null, error: { message: "not found" } });
            }
            return Promise.resolve({ data: mockState.sellerData, error: null });
          }),
        }),
      }),
    }),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Use valid 24-char hex string for MongoDB ObjectId
const VALID_PRODUCT_ID = "507f1f77bcf86cd799439011";

function buildReq(productId: string, body?: unknown) {
  const headers = new Headers();
  if (mockState.authUserId) headers.set("authorization", "Bearer mock-token");
  const init: RequestInit = { headers, method: "PATCH" };
  if (body) init.body = JSON.stringify(body);
  return new NextRequest(`http://localhost/api/seller/products/${productId}`, init);
}

function buildParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const baseProduct = {
  _id: VALID_PRODUCT_ID,
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
// PATCH /api/seller/products/[id]
// ---------------------------------------------------------------------------
describe("PATCH /api/seller/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.product = null;
    mockState.throwError = null;
    mockState.authUserId = "test-user-id";
    mockState.sellerData = { id: "seller-001", user_id: "test-user-id" };
    mockState.updateResult = null;
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
    mockState.product = { ...baseProduct, seller_id: "other-seller" };

    const res = await PATCH(buildReq(VALID_PRODUCT_ID, { name: "New Name" }), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(403);
  });

  it("successfully updates own product (price, stock, name)", async () => {
    mockState.product = { ...baseProduct };
    mockState.updateResult = {
      ...baseProduct,
      name: "Updated Name",
      price: 200,
      stock: 50,
      updated_at: "2025-01-02T00:00:00Z",
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

  it("response shape is correct", async () => {
    mockState.product = { ...baseProduct };
    mockState.updateResult = {
      ...baseProduct,
      name: "Updated",
      price: 150,
      stock: 20,
      updated_at: "2025-01-02T00:00:00Z",
    };

    const res = await PATCH(
      buildReq(VALID_PRODUCT_ID, { name: "Updated", price: 150, stock: 20 }),
      buildParams(VALID_PRODUCT_ID)
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty("product");
    expect(json.product).toHaveProperty("id");
    expect(json.product).toHaveProperty("title");
    expect(json.product).toHaveProperty("price");
    expect(json.product).toHaveProperty("stock");
    expect(json.product).toHaveProperty("isActive");
  });

  it("returns 404 when no seller account", async () => {
    mockState.sellerData = null;

    const res = await PATCH(buildReq(VALID_PRODUCT_ID, { name: "Test" }), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(404);
  });

  it("returns 500 on DB error", async () => {
    mockState.product = { ...baseProduct };
    mockState.throwError = new Error("DB connection failed");

    const res = await PATCH(buildReq(VALID_PRODUCT_ID, { name: "Test" }), buildParams(VALID_PRODUCT_ID));
    expect(res.status).toBe(500);
  });
});
