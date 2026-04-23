/**
 * Seller Orders API tests — GET /api/seller/orders
 *
 * Mock strategy: vi.mock createServiceRoleClient. Each supabase query
 * consumes one response from a Map keyed by call order (enqueueAt).
 * This avoids issues with vi.mock module-level hoisting.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Response queue keyed by sequential call count
// ---------------------------------------------------------------------------
let _callCount = 0;
const responses = new Map<number, { data: unknown; error: unknown }>();

function reset() {
  responses.clear();
  _callCount = 0;
}

/** Enqueue at a specific call index (1-based). */
function enqueueAt(idx: number, data: unknown, error: unknown = null) {
  responses.set(idx, { data, error });
}

function nextResponse() {
  const r = responses.get(++_callCount);
  return r ?? { data: null, error: null };
}

// ---------------------------------------------------------------------------
// Supabase thenable chain — reads callCount at resolution time (not enqueue)
// ---------------------------------------------------------------------------
function buildChain(): Record<string, unknown> {
  let pending: Array<{ res: (v: { data: unknown; error: unknown }) => void }> = [];
  const chain: Record<string, unknown> = {
    then(res: (v: { data: unknown; error: unknown }) => void) {
      pending.push({ res });
      setTimeout(() => {
        const p = pending.shift();
        if (p) p.res(nextResponse());
      }, 0);
      return chain as unknown;
    },
  };
  for (const m of [
    "select", "eq", "neq", "order", "limit", "in",
    "single", "maybeSingle", "insert", "update", "delete",
  ]) {
    chain[m] = () => buildChain();
  }
  return chain;
}

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------
vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue(buildChain()),
  }),
}));

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
  beforeEach(() => reset());

  // 1. Auth: no token → 401
  it("returns 401 when no auth token is provided", async () => {
    const { getBearerPayload } = await import("@/lib/auth/jwt");
    vi.mocked(getBearerPayload).mockResolvedValueOnce(null);
    const res = await getResponse();
    expect(res.status).toBe(401);
  });

  // 2. Seller not found → 404
  it("returns 404 when user is not registered as a seller", async () => {
    enqueueAt(1, null, null); // sellers query → null
    const res = await getResponse();
    expect(res.status).toBe(404);
  });

  // 3. Empty orders array → 200
  it("returns 200 with empty orders array when seller has no orders", async () => {
    enqueueAt(1, [{ id: "seller-001" }], null); // sellers
    enqueueAt(2, [], null);                      // orders
    enqueueAt(3, [], null);                      // users
    const res = await getResponse();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ orders: [] });
  });

  // 4. Orders with buyer name → 200
  it("returns 200 with orders and correct buyer names when orders exist", async () => {
    enqueueAt(1, [{ id: "seller-001" }], null);
    enqueueAt(2,
      [{
        id: "order-001",
        seller_id: "seller-001",
        buyer_id: "buyer-001",
        total_price: 50000,
        status: "pending",
        payment_status: "pending",
        fulfillment_status: "pending",
        currency: "THB",
        payment_method: "promptpay",
        created_at: "2026-04-01T00:00:00Z",
        order_items: [{
          id: "item-001",
          product_id: "prod-001",
          title: "Wireless Mouse",
          title_th: null,
          title_en: null,
          image: "",
          price: 25000,
          quantity: 2,
          platform: "PC",
          region_code: null,
          activation_method_th: null,
          activation_method_en: null,
        }],
      }],
      null
    );
    enqueueAt(3, [{ id: "buyer-001", name: "สมชาย ใจดี" }], null);

    const res = await getResponse();
    expect(res.status).toBe(200);
    const { orders } = await res.json();
    expect(orders).toHaveLength(1);
    expect(orders[0].buyerName).toBe("สมชาย ใจดี");
    expect(orders[0].items[0].title).toBe("Wireless Mouse");
  });

  // 5. DB error → 500
  it("returns 500 when Supabase database query fails", async () => {
    enqueueAt(1, [{ id: "seller-001" }], null);
    enqueueAt(2, null, { message: "Database error" });
    const res = await getResponse();
    expect(res.status).toBe(500);
  });

  // 6. Response shape mapping
  it("maps embedded order_items correctly to API response shape", async () => {
    enqueueAt(1, [{ id: "seller-001" }], null);
    enqueueAt(2,
      [{
        id: "order-002",
        seller_id: "seller-001",
        buyer_id: "buyer-002",
        total_price: 30000,
        status: "paid",
        payment_status: "paid",
        fulfillment_status: "fulfilled",
        currency: "THB",
        payment_method: "credit",
        created_at: "2026-04-02T00:00:00Z",
        order_items: [{
          id: "item-002",
          product_id: "prod-002",
          title: "Mechanical Keyboard",
          title_th: "คีย์บอร์ดเมคคานิคอล",
          title_en: "Mechanical Keyboard",
          image: "https://example.com/kb.jpg",
          price: 30000,
          quantity: 1,
          platform: "PC",
          region_code: "TH",
          activation_method_th: "เคลม PIN ทางอีเมล",
          activation_method_en: "Claim PIN via email",
        }],
      }],
      null
    );
    enqueueAt(3, [{ id: "buyer-002", name: "ผู้ซื้อ ทดสอบ" }], null);

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

    const [item] = order.items;
    expect(item).toMatchObject({
      title: "Mechanical Keyboard",
      titleTh: "คีย์บอร์ดเมคคานิคอล",
      titleEn: "Mechanical Keyboard",
      price: 30000,
      quantity: 1,
      platform: "PC",
      regionCode: "TH",
      activationMethodTh: "เคลม PIN ทางอีเมล",
      activationMethodEn: "Claim PIN via email",
    });
  });
});
