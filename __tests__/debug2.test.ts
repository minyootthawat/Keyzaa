import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

let _callCount = 0;
const responses = new Map<number, { data: unknown; error: unknown }>();

function reset() { responses.clear(); _callCount = 0; }
function enqueueAt(idx: number, data: unknown, error: unknown = null) { responses.set(idx, { data, error }); }
function nextResponse() { const r = responses.get(++_callCount); return r ?? { data: null, error: null }; }

function buildChain(): Record<string, unknown> {
  const pending: Array<{ res: (v: { data: unknown; error: unknown }) => void }> = [];
  const chain: Record<string, unknown> = {
    then(res: (v: { data: unknown; error: unknown }) => void) {
      console.log("then() called, _callCount:", _callCount, "-> response:", responses.get(_callCount + 1));
      pending.push({ res });
      const p = pending.shift();
      if (p) p.res(nextResponse());
      return chain as unknown;
    },
  };
  for (const m of ["select", "eq", "neq", "order", "limit", "in", "single", "maybeSingle", "insert", "update", "delete"]) {
    (chain as Record<string, unknown>)[m] = () => { console.log(m + "()"); return buildChain(); };
  }
  return chain;
}

vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation((table: string) => { console.log("from(" + table + ")"); return buildChain(); }),
  }),
}));

vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi.fn().mockResolvedValue({ userId: "user-123" }),
}));

const mockDbState = vi.hoisted(() => ({ findResult: [] as unknown[] }));
let _coll: any = null;
function makeCollectionBase() {
  return {
    find: vi.fn().mockReturnValue({ sort: vi.fn().mockReturnThis(), skip: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), toArray: vi.fn().mockResolvedValue(mockDbState.findResult) }),
    findOne: vi.fn().mockResolvedValue(null), insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-id" }), countDocuments: vi.fn().mockResolvedValue(0), aggregate: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
  };
}
vi.mock("@/lib/db/mongodb", () => {
  function makeCollection() { if (!_coll) _coll = makeCollectionBase(); return _coll; }
  return { connectDB: vi.fn().mockImplementation(async () => { _coll = null; return { client: {}, db: { collection: vi.fn().mockImplementation(() => makeCollection()) } }; }), getDb: vi.fn() };
});

async function getResponse() {
  const { GET } = await import("@/app/api/seller/orders/route");
  return GET(new NextRequest("http://localhost/api/seller/orders"), { params: Promise.resolve({}) });
}

describe("debug2", () => {
  beforeEach(() => { reset(); _coll = null; mockDbState.findResult = []; });

  it("trace supabase calls", async () => {
    const orderDocs = [{ _id: "oid1", order_id: "order-001", buyer_id: "buyer001", seller_id: "seller001", total_price: 50000, status: "pending", payment_status: "pending", fulfillment_status: "pending", currency: "THB", payment_method: "promptpay", created_at: "2026-04-01T00:00:00Z" }];
    mockDbState.findResult = orderDocs;
    enqueueAt(1, [{ id: "seller-001" }], null);
    enqueueAt(2, [{ id: "buyer001", name: "TestBuyer" }], null);
    console.log("--- Starting route ---");
    const res = await getResponse();
    console.log("--- Route done, Status:", res.status);
    const json = await res.json();
    console.log("Orders:", JSON.stringify(json.orders, null, 2));
    expect(json.orders[0].buyerName).toBe("TestBuyer");
  });
});
