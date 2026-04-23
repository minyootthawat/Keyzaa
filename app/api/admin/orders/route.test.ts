import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// ─── Shared mock refs ───────────────────────────────────────────────────────────
const mockFrom = vi.hoisted(() => vi.fn());
const mockFind = vi.hoisted(() => vi.fn());
const mockCountDocuments = vi.hoisted(() => vi.fn());

// ─── Auth mocks ────────────────────────────────────────────────────────────────
vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi.fn().mockResolvedValue({ userId: "admin-user-123" }),
}));

vi.mock("@/lib/auth/admin", () => ({
  getAdminAccessFromRequest: vi.fn().mockResolvedValue({
    status: 200,
    access: { isAdmin: true, adminRole: "super_admin", permissions: ["admin:access", "admin:orders:read"] },
    userId: "admin-user-123",
  }),
  getAdminAccessForEmail: vi.fn().mockReturnValue({
    isAdmin: true,
    adminRole: "super_admin",
    permissions: ["admin:access", "admin:orders:read"],
  }),
  hasAdminPermission: vi.fn().mockReturnValue(true),
}));

// ─── Supabase mock ─────────────────────────────────────────────────────────────
vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: mockFrom,
  }),
}));

// ─── MongoDB mock ─────────────────────────────────────────────────────────────
vi.mock("@/lib/db/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue({
    db: {
      collection: vi.fn().mockReturnValue({
        find: mockFind,
        countDocuments: mockCountDocuments,
      }),
    },
  }),
  getDb: vi.fn(),
}));

// Per-call chainable builder
let callCount = 0;

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

function makeGetReq(searchParams?: Record<string, string>) {
  const url = new URL("http://localhost/api/admin/orders");
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url, { method: "GET" });
}

describe("GET /api/admin/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callCount = 0;

    mockCountDocuments.mockResolvedValue(1);
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([
        {
          _id: "mongo-id-001",
          order_id: "ord_001",
          buyer_id: "buyer-001",
          seller_id: "seller-001",
          product_id: "prod-001",
          quantity: 1,
          total_price: 100,
          gross_amount: 100,
          commission_amount: 12,
          seller_net_amount: 88,
          platform_fee_rate: 0.12,
          currency: "THB",
          status: "pending",
          payment_status: "pending",
          fulfillment_status: "pending",
          payment_method: "promptpay",
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      ]),
    });

    // Per-call responses for supabase.from() chain:
    // 1. users (buyers) lookup → data: [{id, name, email}]
    // 2. sellers lookup → data: [{id, store_name}]
    const responses = [
      [{ id: "buyer-001", name: "Test Buyer", email: "buyer@test.com" }],
      [{ id: "seller-001", store_name: "Test Store" }],
    ];
    mockFrom.mockImplementation(() => {
      const data = responses[callCount] ?? [];
      callCount++;
      return buildChain(data);
    });
  });

  it("returns 200 with orders, total, page, limit", async () => {
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("orders");
    expect(json).toHaveProperty("total");
    expect(json).toHaveProperty("page");
    expect(json).toHaveProperty("limit");
    expect(Array.isArray(json.orders)).toBe(true);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
  });

  it("returns admin error when getAdminAccessFromRequest returns 401", async () => {
    const { getAdminAccessFromRequest } = await import("@/lib/auth/admin");
    vi.mocked(getAdminAccessFromRequest).mockResolvedValueOnce({ status: 401, error: "Unauthorized" });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
  });

  it("returns admin error when getAdminAccessFromRequest returns 403", async () => {
    const { getAdminAccessFromRequest } = await import("@/lib/auth/admin");
    vi.mocked(getAdminAccessFromRequest).mockResolvedValueOnce({ status: 403, error: "Forbidden" });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(403);
  });

  it("respects pagination params page and limit", async () => {
    const res = await GET(makeGetReq({ page: "3", limit: "50" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.page).toBe(3);
    expect(json.limit).toBe(50);
  });

  it("returns 500 when MongoDB throws", async () => {
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockRejectedValueOnce(new Error("DB error"));
    const res = await GET(makeGetReq());
    expect(res.status).toBe(500);
  });
});
