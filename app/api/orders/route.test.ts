import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = {
  orders: [] as Record<string, unknown>[],
  orderItems: [] as Record<string, unknown>[],
  ledgerEntries: [] as Record<string, unknown>[],
  authUserId: "test-user-id",
};

function buildSupabaseThenable(data: unknown, error: unknown) {
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
    obj[m] = () => buildSupabaseThenable(data, error);
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
      if (table === "orders") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            data: mockState.orders.length > 0 ? mockState.orders : null,
            error: null,
          }),
          insert: vi.fn().mockReturnValue({
            data: mockState.orders[0] || { id: "mock-order-id" },
            error: null,
          }),
        };
      }
      if (table === "order_items") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            data: mockState.orderItems,
            error: null,
          }),
          insert: vi.fn().mockReturnValue({
            data: { id: "mock-item-id" },
            error: null,
          }),
        };
      }
      if (table === "seller_ledger_entries") {
        return {
          insert: vi.fn().mockReturnValue({
            data: { id: "mock-ledger-id" },
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue(buildSupabaseThenable(null, null)),
        insert: vi.fn().mockReturnValue(buildSupabaseThenable(null, null)),
      };
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

const baseOrderRow = {
  id: "ord_test_001",
  buyer_id: "test-user-id",
  seller_id: "seller-001",
  status: "delivered",
  payment_status: "paid",
  fulfillment_status: "delivered",
  total_price: 100,
  gross_amount: 88,
  commission_amount: 12,
  seller_net_amount: 88,
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
  price: 100,
  quantity: 1,
  platform: "mobile",
  region_code: null,
  activation_method_th: null,
  activation_method_en: null,
};

// ---------------------------------------------------------------------------
// GET /api/orders
// ---------------------------------------------------------------------------
describe("GET /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.orders = [];
    mockState.orderItems = [];
    mockState.authUserId = "test-user-id";
  });

  it("returns 200 with buyer orders list", async () => {
    mockState.orders = [baseOrderRow];
    mockState.orderItems = [baseOrderItemRow];

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
    mockState.orders = [];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orders).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// POST /api/orders
// ---------------------------------------------------------------------------
describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.orders = [];
    mockState.orderItems = [];
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
});
