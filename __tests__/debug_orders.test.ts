import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

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
  for (const m of ["select", "eq", "neq", "order", "limit", "in", "single", "maybeSingle", "insert", "update", "delete"]) {
    (chain as Record<string, unknown>)[m] = () => buildChain();
  }
  return chain;
}

vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue(buildChain()),
  }),
}));

vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi.fn().mockResolvedValue({ userId: "user-123", email: "test@keyzaa.com" }),
}));

async function getResponse() {
  const { GET } = await import("@/app/api/seller/orders/route");
  const req = new NextRequest("http://localhost/api/seller/orders");
  return GET(req, { params: Promise.resolve({}) });
}

describe("debug", () => {
  beforeEach(() => {
    reset();
  });

  it("debug full route", async () => {
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
    enqueueAt(3, [{ id: "buyer-001", name: "Test" }], null);
    enqueueAt(4, [], null);

    const res = await getResponse();
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));
    expect(res.status).toBe(200);
    expect(json.orders).toHaveLength(1);
  });
});
