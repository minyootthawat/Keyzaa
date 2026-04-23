import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// ─── Auth mocks ────────────────────────────────────────────────────────────────
vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi.fn().mockResolvedValue({ userId: "admin-user-123" }),
}));

vi.mock("@/lib/auth/admin", () => ({
  getAdminAccessFromRequest: vi.fn().mockResolvedValue({
    status: 200,
    access: { isAdmin: true, adminRole: "super_admin", permissions: ["admin:access", "admin:overview:read"] },
    userId: "admin-user-123",
  }),
  getAdminAccessForEmail: vi.fn().mockReturnValue({
    isAdmin: true,
    adminRole: "super_admin",
    permissions: ["admin:access", "admin:overview:read"],
  }),
  hasAdminPermission: vi.fn().mockReturnValue(true),
}));

// ─── Supabase mock ─────────────────────────────────────────────────────────────
vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "admin-user-123", role: "both" }, error: null }),
        }),
      }),
    }),
  }),
}));

// ─── MongoDB mock ─────────────────────────────────────────────────────────────
vi.mock("@/lib/db/mongodb", () => {
  const mockCountDocuments = vi.fn();
  const mockAggregate = vi.fn();

  return {
    connectDB: vi.fn().mockResolvedValue({
      db: {
        collection: vi.fn().mockReturnValue({
          countDocuments: mockCountDocuments,
          aggregate: mockAggregate,
        }),
      },
    }),
    getDb: vi.fn(),
    _mocks: { mockCountDocuments, mockAggregate },
  };
});

function makeGetReq() {
  return new NextRequest("http://localhost/api/admin/overview", { method: "GET" });
}

describe("GET /api/admin/overview", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { _mocks } = await import("@/lib/db/mongodb");
    const { mockCountDocuments, mockAggregate } = _mocks;

    mockCountDocuments.mockResolvedValue(42);
    mockAggregate.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([{ _id: null, total: 98765 }]),
    });
  });

  it("returns 200 with all stats", async () => {
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("totalUsers");
    expect(json).toHaveProperty("totalSellers");
    expect(json).toHaveProperty("totalProducts");
    expect(json).toHaveProperty("totalOrders");
    expect(json).toHaveProperty("totalRevenue");
    expect(json.totalOrders).toBe(42);
    expect(json.totalRevenue).toBe(98765);
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

  it("returns 500 when MongoDB aggregate returns empty (no revenue)", async () => {
    const { _mocks } = await import("@/lib/db/mongodb");
    _mocks.mockAggregate.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValue([]),
    });
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.totalRevenue).toBe(0);
  });

  it("returns 500 when MongoDB throws", async () => {
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockRejectedValueOnce(new Error("DB error"));
    const res = await GET(makeGetReq());
    expect(res.status).toBe(500);
  });
});
