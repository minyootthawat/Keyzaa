import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = {
  findResult: [] as unknown[],
  insertOneResult: { insertedId: "mock-id" },
  throwError: null as Error | null,
  sellerData: null as { id: string; user_id: string } | null,
  authUserId: "test-user-id",
};

function makeCollection(name: string) {
  if (name === "orders") {
    return {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(mockState.findResult),
      }),
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue(mockState.insertOneResult),
      countDocuments: vi.fn().mockResolvedValue(mockState.findResult.length),
      aggregate: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([{ _id: null, total: 1000 }]),
      }),
    };
  }
  if (name === "order_items") {
    return {
      find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      insertOne: vi.fn().mockResolvedValue({ insertedId: "item-mock-id" }),
    };
  }
  if (name === "seller_ledger_entries") {
    return {
      insertMany: vi.fn().mockResolvedValue({ insertedCount: 1 }),
    };
  }
  return {
    find: vi.fn().mockReturnValue({ sort: vi.fn().mockReturnThis(), toArray: vi.fn().mockResolvedValue([]) }),
    findOne: vi.fn().mockResolvedValue(null),
    insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-id" }),
    aggregate: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
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
        eq: vi.fn().mockReturnThis(),
        data: mockState.sellerData ? [mockState.sellerData] : null,
        error: null,
        count: mockState.sellerData ? 1 : 0,
      }),
      insert: vi.fn().mockReturnValue({ error: null }),
      update: vi.fn().mockReturnValue({ error: null }),
    }),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq(
  method = "GET",
  url = "http://localhost/api/orders",
  body?: unknown
) {
  const headers = new Headers();
  if (mockState.authUserId) headers.set("authorization", "Bearer mock-token");
  const init: RequestInit = { headers, method };
  if (body) init.body = JSON.stringify(body);
  return new NextRequest(url, init);
}

const baseOrderDoc = {
  _id: "oid1",
  order_id: "ord_test_001",
  buyer_id: "test-user-id",
  seller_id: "seller-001",
  status: "pending",
  payment_status: "pending",
  fulfillment_status: "pending",
  total_price: 100,
  gross_amount: 88,
  commission_amount: 12,
  seller_net_amount: 88,
  platform_fee_rate: 0.12,
  currency: "THB",
  payment_method: "promptpay",
  items: [],
  created_at: "2025-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// GET /api/orders
// ---------------------------------------------------------------------------
describe("GET /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.findResult = [];
    mockState.throwError = null;
    mockState.authUserId = "test-user-id";
  });

  it("returns 200 with buyer orders list", async () => {
    mockState.findResult = [baseOrderDoc];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orders).toBeInstanceOf(Array);
    expect(json.orders.length).toBe(1);
  });

  it("returns 401 when auth payload is null", async () => {
    mockState.authUserId = "";

    const res = await GET(buildReq());
    expect(res.status).toBe(401);
  });

  it("returns 200 with empty orders array when no orders found", async () => {
    mockState.findResult = [];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orders).toEqual([]);
  });

  it("returns 500 on DB error", async () => {
    mockState.throwError = new Error("DB connection failed");

    const res = await GET(buildReq());
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/orders
// ---------------------------------------------------------------------------
describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.findResult = [];
    mockState.insertOneResult = { insertedId: "mock-id" };
    mockState.throwError = null;
    mockState.authUserId = "test-user-id";
  });

  const validBody = {
    totalPrice: 200,
    paymentMethod: "promptpay",
    items: [
      {
        id: "item-001",
        productId: "prod-001",
        sellerId: "seller-001",
        title: "Test Product",
        price: 200,
        quantity: 1,
        platform: "mobile",
      },
    ],
  };

  it("returns 201 with created order", async () => {
    mockState.insertOneResult = { insertedId: "mock-id" };

    const res = await POST(
      buildReq("POST", "http://localhost/api/orders", validBody)
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.orders).toBeInstanceOf(Array);
    expect(json.orders.length).toBe(1);
  });

  it("returns 401 when auth payload is null", async () => {
    mockState.authUserId = "";

    const res = await POST(
      buildReq("POST", "http://localhost/api/orders", validBody)
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when order payload is invalid", async () => {
    const res = await POST(
      buildReq("POST", "http://localhost/api/orders", { totalPrice: 0 })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 on DB error", async () => {
    mockState.throwError = new Error("Insert failed");

    const res = await POST(
      buildReq("POST", "http://localhost/api/orders", validBody)
    );
    expect(res.status).toBe(500);
  });
});
