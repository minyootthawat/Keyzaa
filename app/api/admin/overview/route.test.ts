import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = vi.hoisted(() => ({
  ordersCount: 0,
  revenueTotal: 0,
  throwError: null as Error | null,
}));

// ---------------------------------------------------------------------------
// Mock: auth/admin
// ---------------------------------------------------------------------------
vi.mock("@/lib/auth/admin", () => ({
  getAdminAccessFromRequest: vi.fn().mockResolvedValue({
    status: 200,
    access: { isAdmin: true, adminRole: "super_admin" as const, permissions: ["admin:access", "admin:overview:read"] },
    userId: "test-admin-id",
  }),
}));

// ---------------------------------------------------------------------------
// Mock: db/mongodb — proper collection() chainable mock
// ---------------------------------------------------------------------------
vi.mock("@/lib/db/mongodb", () => {
  function makeCollection() {
    return {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
      }),
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-id" }),
      countDocuments: vi.fn().mockResolvedValue(mockState.ordersCount),
      aggregate: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(
          mockState.revenueTotal > 0
            ? [{ _id: null, total: mockState.revenueTotal }]
            : []
        ),
      }),
    };
  }

  return {
    connectDB: vi.fn().mockImplementation(async () => {
      if (mockState.throwError) throw mockState.throwError;
      return {
        client: {} as unknown,
        db: {
          collection: vi.fn().mockImplementation(() => makeCollection()),
        },
      };
    }),
    getDb: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Mock: Supabase client
// ---------------------------------------------------------------------------
vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        data: [],
        error: null,
        count: 0,
      }),
      insert: vi.fn().mockReturnValue({ error: null }),
    }),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq() {
  const headers = new Headers();
  headers.set("authorization", "Bearer mock-admin-token");
  return new NextRequest("http://localhost/api/admin/overview", { headers, method: "GET" });
}

// ---------------------------------------------------------------------------
// GET /api/admin/overview
// ---------------------------------------------------------------------------
describe("GET /api/admin/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.ordersCount = 0;
    mockState.revenueTotal = 0;
    mockState.throwError = null;
  });

  it("returns 200 with all stats", async () => {
    mockState.ordersCount = 42;
    mockState.revenueTotal = 150000;

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty("totalUsers");
    expect(json).toHaveProperty("totalSellers");
    expect(json).toHaveProperty("totalProducts");
    expect(json).toHaveProperty("totalOrders");
    expect(json).toHaveProperty("totalRevenue");
  });

  it("returns 401 when admin access returns 401", async () => {
    const { getAdminAccessFromRequest } = await import("@/lib/auth/admin");
    vi.mocked(getAdminAccessFromRequest).mockResolvedValueOnce({ status: 401, error: "Unauthorized" });

    const res = await GET(buildReq());
    expect(res.status).toBe(401);
  });

  it("returns 500 on DB error", async () => {
    mockState.throwError = new Error("DB error");

    const res = await GET(buildReq());
    expect(res.status).toBe(500);
  });
});
