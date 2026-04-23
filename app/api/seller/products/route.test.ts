import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = {
  products: [] as unknown[],
  throwError: null as Error | null,
  sellerData: null as { id: string; user_id: string; verified: boolean } | null,
  authUserId: "test-user-id",
};

function makeCollection(name: string) {
  if (name === "products") {
    return {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(mockState.products),
      }),
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-id" }),
      findOneAndUpdate: vi.fn().mockResolvedValue(null),
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

function buildReq(url = "http://localhost/api/seller/products") {
  const headers = new Headers();
  if (mockState.authUserId) headers.set("authorization", "Bearer mock-token");
  return new NextRequest(url, { headers, method: "GET" });
}

const baseProduct = {
  _id: "prod-id-001",
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
    mockState.throwError = null;
    mockState.authUserId = "test-user-id";
    mockState.sellerData = { id: "seller-001", user_id: "test-user-id", verified: true };
  });

  it("returns 401 without auth", async () => {
    mockState.authUserId = "";

    const res = await GET(buildReq());
    expect(res.status).toBe(401);
  });

  it("returns 404 when no seller account", async () => {
    mockState.sellerData = null;

    const res = await GET(buildReq());
    expect(res.status).toBe(404);
  });

  it("returns only auth seller's products", async () => {
    mockState.products = [
      { ...baseProduct, _id: "prod-1", seller_id: "seller-001" },
      { ...baseProduct, _id: "prod-2", seller_id: "seller-001" },
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

  it("returns 500 on DB error", async () => {
    mockState.throwError = new Error("DB connection failed");

    const res = await GET(buildReq());
    expect(res.status).toBe(500);
  });
});
