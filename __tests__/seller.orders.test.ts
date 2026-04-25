/**
 * Seller Orders API tests — GET /api/seller/orders
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Supabase thenable chain — reads callCount at resolution time
// ---------------------------------------------------------------------------
let _callCount = 0;
const responses = new Map<number, { data: unknown; error: unknown }>();

function reset() {
  responses.clear();
  _callCount = 0;
}

function enqueueAt(idx: number, data: unknown, error: unknown = null) {
  responses.set(idx, { data, error });
}

function nextResponse() {
  const r = responses.get(++_callCount);
  return r ?? { data: null, error: null };
}

function buildChain(): Record<string, unknown> {
  const pending: Array<{ res: (v: { data: unknown; error: unknown }) => void }> = [];
  const chain: Record<string, unknown> = {
    then(res: (v: { data: unknown; error: unknown }) => void) {
      pending.push({ res });
      const p = pending.shift();
      if (p) p.res(nextResponse());
      return chain as unknown;
    },
  };
  for (const m of [
    "select", "eq", "neq", "order", "limit", "in",
    "single", "maybeSingle", "insert", "update", "delete",
  ]) {
    (chain as Record<string, unknown>)[m] = () => buildChain();
  }
  return chain;
}

// ---------------------------------------------------------------------------
// Mock: Supabase
// ---------------------------------------------------------------------------
vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue(buildChain()),
  }),
}));

// ---------------------------------------------------------------------------
// Mock: auth/jwt
// ---------------------------------------------------------------------------
vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi
    .fn()
    .mockResolvedValue({ userId: "user-123", email: "test@keyzaa.com" }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getResponse(path = "/api/seller/orders") {
  const { GET } = await import("@/app/api/seller/orders/route");
  const req = new NextRequest(`http://localhost${path}`);
  return GET(req, { params: Promise.resolve({}) });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("GET /api/seller/orders", () => {
  beforeEach(() => {
    reset();
  });

  it("returns 401 when no auth token is provided", async () => {
    const { getBearerPayload } = await import("@/lib/auth/jwt");
    vi.mocked(getBearerPayload).mockResolvedValueOnce(null);
    const res = await getResponse();
    expect(res.status).toBe(401);
  });

  it("returns 404 when user is not registered as a seller", async () => {
    enqueueAt(1, null, { message: "not found" }); // sellers query → error
    const res = await getResponse();
    expect(res.status).toBe(404);
  });

  it("returns 200 with empty orders array when seller has no orders", async () => {
    enqueueAt(1, [{ id: "seller-001" }], null); // sellers
    enqueueAt(2, [], null);                     // orders
    enqueueAt(3, [], null);                      // users
    enqueueAt(4, [], null);                      // order_items
    const res = await getResponse();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ orders: [] });
  });

  it("returns 200 with orders and correct buyer names when orders exist", async () => {
    const orderRows = [{
      id: "order-001",
      buyer_id: "buyer-001",
      seller_id: "seller-001",
      total_price: 50000,
      gross_amount: 50000,
      commission_amount: 500,
      seller_net_amount: 49500,
      platform_fee_rate: 0.01,
      status: "pending",
      payment_status: "pending",
      fulfillment_status: "pending",
      currency: "THB",
      payment_method: "promptpay",
      created_at: "2026-04-01T00:00:00Z",
    }];
    enqueueAt(1, [{ id: "seller-001" }], null);
    enqueueAt(2, orderRows, null);
    enqueueAt(3, [{ id: "buyer-001", name: "สมชาย ใจดี" }], null);
    enqueueAt(4, [], null);

    const res = await getResponse();
    expect(res.status).toBe(200);
    const { orders } = await res.json();
    expect(orders).toHaveLength(1);
    expect(orders[0].buyerName).toBe("สมชาย ใจดี");
  });

  it("returns 500 when Supabase database query fails", async () => {
    enqueueAt(1, [{ id: "seller-001" }], null);
    enqueueAt(2, null, { message: "Database error" }); // orders query fails
    const res = await getResponse();
    expect(res.status).toBe(500);
  });

  it("maps embedded order_items correctly to API response shape", async () => {
    const orderRows = [{
      id: "order-002",
      buyer_id: "buyer-002",
      seller_id: "seller-001",
      total_price: 30000,
      gross_amount: 30000,
      commission_amount: 300,
      seller_net_amount: 29700,
      platform_fee_rate: 0.01,
      status: "paid",
      payment_status: "paid",
      fulfillment_status: "fulfilled",
      currency: "THB",
      payment_method: "credit",
      created_at: "2026-04-02T00:00:00Z",
    }];
    enqueueAt(1, [{ id: "seller-001" }], null);
    enqueueAt(2, orderRows, null);
    enqueueAt(3, [{ id: "buyer-002", name: "ผู้ซื้อ ทดสอบ" }], null);
    enqueueAt(4, [], null);

    const res = await getResponse();
    expect(res.status).toBe(200);
    const { orders } = await res.json();
    const [order] = orders;

    expect(order).toMatchObject({
      id: "order-002",
      buyerName: "ผู้ซื้อ ทดสอบ",
      totalPrice: 30000,
      status: "paid",
      paymentStatus: "paid",
      fulfillmentStatus: "fulfilled",
      currency: "THB",
    });
  });
});
