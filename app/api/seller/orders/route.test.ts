import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = {
  orderDocs: [] as Record<string, unknown>[],
  orderItemDocs: [] as Record<string, unknown>[],
  sellerData: null as { id: string; user_id: string } | null,
  throwError: null as Error | null,
  authUserId: "test-user-id",
};

function makeCollection(name: string) {
  if (name === "orders") {
    return {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(mockState.orderDocs),
      }),
      findOne: vi.fn().mockResolvedValue(null),
    };
  }
  if (name === "order_items") {
    return {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockState.orderItemDocs),
      }),
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-item-id" }),
    };
  }
  return {
    find: vi.fn().mockReturnValue({ sort: vi.fn().mockReturnThis(), toArray: vi.fn().mockResolvedValue([]) }),
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

function buildThenable(data: unknown, error: unknown) {
  const obj: Record<string, unknown> = {
    then: (resolve: (val: { data: unknown; error: unknown }) => void) => {
      setTimeout(() => resolve({ data, error }), 0);
      return obj;
    },
  };
  const methods = ["select", "eq", "neq", "order", "limit", "in", "single", "maybeSingle", "data", "error", "count"];
  for (const m of methods) {
    obj[m] = () => buildThenable(data, error);
  }
  return obj;
}

vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(() =>
        buildThenable(mockState.sellerData, null)
      ),
      insert: vi.fn().mockReturnValue({ error: null }),
    })),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq(url = "http://localhost/api/seller/orders") {
  const headers = new Headers();
  if (mockState.authUserId) headers.set("authorization", "Bearer mock-token");
  return new NextRequest(url, { headers, method: "GET" });
}

const baseOrderDoc = {
  _id: "oid1",
  order_id: "ord_test_001",
  buyer_id: "buyer-001",
  seller_id: "seller-001",
  status: "delivered",
  payment_status: "paid",
  fulfillment_status: "delivered",
  total_price: 200,
  gross_amount: 176,
  commission_amount: 24,
  seller_net_amount: 176,
  platform_fee_rate: 0.12,
  currency: "THB",
  payment_method: "promptpay",
  items: [],
  created_at: "2025-01-01T00:00:00Z",
};

const baseOrderItemDoc = {
  _id: "oi1",
  order_id: "ord_test_001",
  product_id: "prod-001",
  title: "Test Product",
  price: 200,
  quantity: 1,
  platform: "mobile",
};

// ---------------------------------------------------------------------------
// GET /api/seller/orders
// ---------------------------------------------------------------------------
describe("GET /api/seller/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.orderDocs = [];
    mockState.orderItemDocs = [];
    mockState.sellerData = { id: "seller-001", user_id: "test-user-id" };
    mockState.throwError = null;
    mockState.authUserId = "test-user-id";
  });

  it("returns 200 with orders array", async () => {
    mockState.orderDocs = [baseOrderDoc];
    mockState.orderItemDocs = [baseOrderItemDoc];
    mockState.sellerData = { id: "seller-001", user_id: "test-user-id" };

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orders).toBeInstanceOf(Array);
  });

  it("returns 401 when not authenticated", async () => {
    mockState.authUserId = "";

    const res = await GET(buildReq());
    expect(res.status).toBe(401);
  });

  it("returns 404 when seller not found", async () => {
    mockState.sellerData = null;

    const res = await GET(buildReq());
    expect(res.status).toBe(404);
  });

  it("returns 500 on DB error", async () => {
    mockState.throwError = new Error("DB error");

    const res = await GET(buildReq());
    expect(res.status).toBe(500);
  });
});
