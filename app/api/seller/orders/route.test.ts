import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = {
  seller: null as { id: string; user_id: string } | null,
  orders: [] as Record<string, unknown>[],
  orderItems: [] as Record<string, unknown>[],
  buyers: [] as { id: string; name: string }[],
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
      if (table === "orders") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            data: mockState.orders,
            error: null,
          }),
        };
      }
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              data: mockState.buyers,
              error: null,
            }),
          }),
        };
      }
      if (table === "order_items") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              data: mockState.orderItems,
              error: null,
            }),
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

function buildReq(url = "http://localhost/api/seller/orders") {
  const headers = new Headers();
  if (mockState.authUserId) headers.set("authorization", "Bearer mock-token");
  return new NextRequest(url, { headers, method: "GET" });
}

const baseOrderRow = {
  id: "ord_test_001",
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
  created_at: "2025-01-01T00:00:00Z",
};

const baseOrderItemRow = {
  id: "item-001",
  order_id: "ord_test_001",
  product_id: "prod-001",
  title: "Test Product",
  title_th: null,
  title_en: "Test Product",
  image: null,
  price: 200,
  quantity: 1,
  platform: "mobile",
  region_code: null,
  activation_method_th: null,
  activation_method_en: null,
};

const baseBuyerRow = {
  id: "buyer-001",
  name: "Test Buyer",
};

// ---------------------------------------------------------------------------
// GET /api/seller/orders
// ---------------------------------------------------------------------------
describe("GET /api/seller/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.seller = { id: "seller-001", user_id: "test-user-id" };
    mockState.orders = [];
    mockState.orderItems = [];
    mockState.buyers = [];
    mockState.authUserId = "test-user-id";
  });

  it("returns 200 with orders array", async () => {
    mockState.orders = [baseOrderRow];
    mockState.orderItems = [baseOrderItemRow];
    mockState.buyers = [baseBuyerRow];

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
    mockState.seller = null;

    const res = await GET(buildReq());
    expect(res.status).toBe(404);
  });

  it("returns 500 on DB error", async () => {
    mockState.orders = [{ ...baseOrderRow, invalid: true }];

    const res = await GET(buildReq());
    expect(res.status).toBe(500);
  });
});
