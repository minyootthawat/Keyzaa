import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------
const mockState = vi.hoisted(() => ({
  throwError: null as Error | null,
}));

// ---------------------------------------------------------------------
// Mock: lib/auth/admin
// ---------------------------------------------------------------------
vi.mock("@/lib/auth/admin", () => ({
  getAdminAccessFromRequest: vi.fn().mockResolvedValue({
    status: 200,
    access: { isAdmin: true, adminRole: "super_admin" as const, permissions: ["admin:access", "admin:overview:read"] },
    userId: "test-admin-id",
  }),
}));

// ---------------------------------------------------------------------
// Mock: lib/supabase/supabase
// ---------------------------------------------------------------------
vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockImplementation(() => {
    function makeQueryResult(count: number, data: unknown[] = []) {
      return {
        count: count as unknown,
        data: data as unknown[],
        error: null,
      };
    }

    return {
      from: vi.fn().mockImplementation((table: string) => {
        // Revenue query (orders with status/payment_status = paid)
        if (table === "orders" && false) {
          // placeholder — not actually called this way in the route
        }
        return {
          select: vi.fn().mockImplementation((columns: string, opts?: { count?: string }) => {
            if (opts?.count === "exact" && columns === "*") {
              // Count query — returns { count, data: [], error }
              return vi.fn().mockReturnValue(makeQueryResult(0));
            }
            if (columns === "gross_amount") {
              // Revenue query
              return {
                eq: vi.fn().mockReturnThis(),
                data: [],
                error: null,
                count: 0,
              };
            }
            return {
              eq: vi.fn().mockReturnThis(),
              data: [],
              error: null,
              count: 0,
            };
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
function buildReq() {
  const headers = new Headers();
  headers.set("authorization", "Bearer mock-admin-token");
  return new NextRequest("http://localhost/api/admin/overview", { headers, method: "GET" });
}

// ---------------------------------------------------------------------
// GET /api/admin/overview
// ---------------------------------------------------------------------
describe("GET /api/admin/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.throwError = null;
  });

  it("returns 200 with all stats", async () => {
    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty("totalUsers");
    expect(json).toHaveProperty("totalSellers");
    expect(json).toHaveProperty("totalProducts");
    expect(json).toHaveProperty("totalOrders");
    expect(json).toHaveProperty("totalRevenue");
    expect(json).toHaveProperty("activeListings");
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
