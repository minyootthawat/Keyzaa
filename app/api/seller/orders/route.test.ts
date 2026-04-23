import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// ─── Shared mock refs ───────────────────────────────────────────────────────────
const mockFind = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

// ─── Auth mock ────────────────────────────────────────────────────────────────
vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi.fn().mockResolvedValue({ userId: "user-123" }),
}));

// ─── MongoDB mock ─────────────────────────────────────────────────────────────
vi.mock("@/lib/db/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue({
    db: {
      collection: vi.fn().mockReturnValue({
        find: mockFind,
      }),
    },
  }),
  getDb: vi.fn(),
}));

// ─── Supabase mock ─────────────────────────────────────────────────────────────
vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: mockFrom,
  }),
}));

// Supabase chainable builder (same pattern used across test files)
function buildChain(data: unknown = null, error: unknown = null): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    then: (res: (v: { data: unknown; error: unknown }) => void) => {
      setTimeout(() => res({ data, error }), 0);
      return obj;
    },
  };
  for (const method of ["select", "eq", "neq", "order", "limit", "in", "single", "maybeSingle"]) {
    obj[method] = () => buildChain(data, error);
  }
  return obj;
}

function makeGetReq() {
  return new NextRequest("http://localhost/api/seller/orders", { method: "GET" });
}

describe("GET /api/seller/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([
        {
          _id: "mongo-id-001",
          order_id: "ord_001",
          buyer_id: "buyer-001",
          seller_id: "seller-001",
          total_price: 200,
          gross_amount: 200,
          commission_amount: 24,
          seller_net_amount: 176,
          platform_fee_rate: 0.12,
          currency: "THB",
          status: "pending",
          payment_status: "pending",
          fulfillment_status: "pending",
          payment_method: "credit_card",
          created_at: "2024-01-01T00:00:00.000Z",
        },
      ]),
    });
    // Default: seller found
    mockFrom.mockReturnValue(buildChain({ id: "seller-001" }));
  });

  it("returns 200 with seller orders array", async () => {
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("orders");
    expect(Array.isArray(json.orders)).toBe(true);
    expect(json.orders[0].orderId).toBe("ord_001");
  });

  it("returns 401 when auth returns null userId", async () => {
    const { getBearerPayload } = await import("@/lib/auth/jwt");
    vi.mocked(getBearerPayload).mockResolvedValueOnce(null);
    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
  });

  it("returns 404 when seller not found in Supabase", async () => {
    mockFrom.mockReturnValueOnce(buildChain(null, "not found"));
    const res = await GET(makeGetReq());
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Seller not found");
  });

  it("returns 500 when MongoDB throws", async () => {
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockRejectedValueOnce(new Error("DB error"));
    const res = await GET(makeGetReq());
    expect(res.status).toBe(500);
  });
});
