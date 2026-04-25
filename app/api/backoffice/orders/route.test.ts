import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------
const mockState = vi.hoisted(() => ({
  orderRows: [] as Record<string, unknown>[],
  total: 0,
  throwError: null as Error | null,
}));

// ---------------------------------------------------------------------
// Mock: lib/auth/admin
// ---------------------------------------------------------------------
vi.mock("@/lib/auth/admin", () => ({
  getAdminAccessFromRequest: vi.fn().mockResolvedValue({
    status: 200,
    access: { isAdmin: true, adminRole: "super_admin" as const, permissions: ["admin:access", "admin:orders:read"] },
    userId: "507f1f77bcf86cd799439011",
  }),
}));

// ---------------------------------------------------------------------
// Mock: lib/supabase/supabase
// ---------------------------------------------------------------------
vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockImplementation(() => {
    function createChainableSelect(returnData: unknown, returnCount: number, returnError: unknown) {
      const chain: Record<string, vi.Mock> = {};
      const handlers = {
        select: vi.fn().mockImplementation(() => handlers),
        eq: vi.fn().mockImplementation(() => handlers),
        in: vi.fn().mockImplementation(() => handlers),
        order: vi.fn().mockImplementation(() => handlers),
        range: vi.fn().mockImplementation(() => handlers),
        then: vi.fn().mockImplementation((resolve: (val: unknown) => unknown) => resolve({ data: returnData, count: returnCount, error: returnError })),
      };
      return handlers;
    }

    return {
      from: vi.fn().mockImplementation(() => {
        return {
          select: vi.fn().mockImplementation((columns: string, opts?: { count?: string }) => {
            if (opts?.count === "exact") {
              return createChainableSelect([], mockState.total, null);
            }
            return createChainableSelect(mockState.orderRows, mockState.total, null);
          }),
          insert: vi.fn().mockReturnValue({ error: null }),
        };
      }),
    };
  }),
}));

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
function buildReq(url = "http://localhost/api/admin/orders") {
  const headers = new Headers();
  headers.set("authorization", "Bearer mock-admin-token");
  return new NextRequest(url, { headers, method: "GET" });
}

const baseOrderRow = {
  id: "oid1",
  buyer_id: "buyer-001",
  seller_id: "seller-001",
  product_id: "prod-001",
  quantity: 2,
  total_price: 200,
  gross_amount: 176,
  status: "delivered",
  payment_method: "promptpay",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------
// GET /api/admin/orders
// ---------------------------------------------------------------------
describe("GET /api/admin/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.orderRows = [];
    mockState.total = 0;
    mockState.throwError = null;
  });

  it("returns 200 with orders array and pagination", async () => {
    mockState.orderRows = [baseOrderRow];
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

  it("returns 500 on error", async () => {
    const { createServiceRoleClient } = await import("@/lib/supabase/supabase");
    vi.mocked(createServiceRoleClient).mockImplementation(() => {
      throw new Error("Supabase init error");
    });

    const res = await GET(buildReq());
    expect(res.status).toBe(500);
  });
});
