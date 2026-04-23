import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = vi.hoisted(() => ({
  orderDocs: [] as Record<string, unknown>[],
  total: 0,
  throwError: null as Error | null,
}));

// ---------------------------------------------------------------------------
// Mock: auth/admin
// ---------------------------------------------------------------------------
vi.mock("@/lib/auth/admin", () => ({
  getAdminAccessFromRequest: vi.fn().mockResolvedValue({
    status: 200,
    access: { isAdmin: true, adminRole: "super_admin" as const, permissions: ["admin:access", "admin:orders:read"] },
    userId: "507f1f77bcf86cd799439011",
  }),
}));

// ---------------------------------------------------------------------------
// Mock: db/mongodb — proper collection() chainable mock
// ---------------------------------------------------------------------------
vi.mock("@/lib/db/mongodb", () => {
  function makeCollection() {
    return {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(mockState.orderDocs),
      }),
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-id" }),
      countDocuments: vi.fn().mockResolvedValue(mockState.total),
      aggregate: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    };
  }

  return {
    connectDB: vi.fn().mockImplementation(async () => {
      if (mockState.throwError) throw mockState.throwError;
      return {
        client: {} as unknown,
        db: {
          collection: vi.fn().mockImplementation(() => makeCollection()),
        },
      };
    }),
    getDb: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Mock: Supabase client
// ---------------------------------------------------------------------------
vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        data: [],
        error: null,
        count: 0,
      }),
      insert: vi.fn().mockReturnValue({ error: null }),
    }),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq(url = "http://localhost/api/admin/orders") {
  const headers = new Headers();
  headers.set("authorization", "Bearer mock-admin-token");
  return new NextRequest(url, { headers, method: "GET" });
}

const baseOrderDoc = {
  _id: "oid1",
  order_id: "ord_test_001",
  buyer_id: "buyer-001",
  seller_id: "seller-001",
  product_id: "prod-001",
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

// ---------------------------------------------------------------------------
// GET /api/admin/orders
// ---------------------------------------------------------------------------
describe("GET /api/admin/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.orderDocs = [];
    mockState.total = 0;
    mockState.throwError = null;
  });

  it("returns 200 with orders array and pagination", async () => {
    mockState.orderDocs = [baseOrderDoc];
    mockState.total = 1;

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orders).toBeInstanceOf(Array);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
    expect(json.limit).toBe(20);
  });

  it("returns 401 when admin access returns 401", async () => {
    const { getAdminAccessFromRequest } = await import("@/lib/auth/admin");
    vi.mocked(getAdminAccessFromRequest).mockResolvedValueOnce({ status: 401, error: "Unauthorized" });

    const res = await GET(buildReq());
    expect(res.status).toBe(401);
  });

  it("returns 500 on DB error", async () => {
    mockState.throwError = new Error("DB error");

    const res = await GET(buildReq());
    expect(res.status).toBe(500);
  });
});
