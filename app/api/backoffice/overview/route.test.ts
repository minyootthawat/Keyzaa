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
    function makeResult(count: number, data: unknown[] = []) {
      return { count, data, error: null };
    }

    return {
      from: vi.fn((table: string) => {
        const tableCounts: Record<string, number> = {
          users: 10,
          sellers: 5,
          products: 25,
          orders: 100,
        };

        return {
          select: vi.fn((_columns: string, opts?: { count?: string }) => {
            // Return raw result synchronously-like via resolved promise
            // (route destructures { count } directly, no .then() chain needed)
            const baseResult = makeResult(tableCounts[table] ?? 0, []);

            // If opts.count is set, this is a head=true count query
            // Return the count result directly (route destructures { count })
            if (opts?.count) {
              return Promise.resolve({ count: tableCounts[table] ?? 0, data: [], error: null });
            }

            // For revenue query: select("gross_amount").eq("status", "paid").eq("payment_status", "paid")
            // Returns data array with gross_amount values
            if (table === "orders" && opts === undefined) {
              // This is the revenue query — return data with gross_amount
              return Promise.resolve(
                makeResult(0, [
                  { gross_amount: 1000 },
                  { gross_amount: 2500 },
                  { gross_amount: 750 },
                ])
              );
            }

            return Promise.resolve(baseResult);
          }),
          insert: vi.fn(() => ({ error: null })),
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
