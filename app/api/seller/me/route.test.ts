import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = {
  authUserId: "test-user-id",
  sellerData: null as Record<string, unknown> | null,
  ledgerData: [] as Record<string, unknown>[],
};

function buildThenable(data: unknown, error: unknown) {
  const obj: Record<string, unknown> = {
    then: (resolve: (val: { data: unknown; error: unknown }) => void) => {
      setTimeout(() => resolve({ data, error }), 0);
      return obj;
    },
  };
  const methods = ["select", "eq", "neq", "order", "limit", "in", "single", "maybeSingle", "data", "error", "count"];
  for (const m of methods) {
    obj[m] = () => buildThenable(data, error);
  }
  return obj;
}

vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi.fn().mockImplementation(() => {
    if (!mockState.authUserId) return Promise.resolve(null);
    return Promise.resolve({ userId: mockState.authUserId });
  }),
}));

vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "sellers") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockImplementation(() => buildThenable(mockState.sellerData, null)),
        };
      }
      if (table === "seller_ledger_entries") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockImplementation(() => buildThenable(mockState.ledgerData, null)),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
    }),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq(url = "http://localhost/api/seller/me") {
  const headers = new Headers();
  if (mockState.authUserId) headers.set("authorization", "Bearer mock-token");
  return new NextRequest(url, { headers, method: "GET" });
}

const baseSellerData = {
  id: "seller-001",
  user_id: "test-user-id",
  store_name: "Test Shop",
  phone: "0812345678",
  rating: 4.8,
  sales_count: 150,
  balance: 5000,
  pending_balance: 1200,
  verified: true,
  payout_status: "auto",
  response_time_minutes: 3,
  fulfillment_rate: 98.5,
  dispute_rate: 0.5,
  created_at: "2024-01-15T00:00:00Z",
};

const baseLedgerEntry = (type: string, amount: number) => ({
  id: `ledger-${type}-1`,
  seller_id: "seller-001",
  type,
  amount,
  created_at: "2025-01-01T00:00:00Z",
});

// ---------------------------------------------------------------------------
// GET /api/seller/me
// ---------------------------------------------------------------------------

describe("GET /api/seller/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.authUserId = "test-user-id";
    mockState.sellerData = { ...baseSellerData };
    mockState.ledgerData = [];
  });

  // --- Auth & infrastructure ---

  it("returns 401 when not authenticated", async () => {
    mockState.authUserId = "";

    const res = await GET(buildReq());

    expect(res.status).toBe(401);
  });

  it("returns 404 when seller not found", async () => {
    mockState.sellerData = null;

    const res = await GET(buildReq());

    expect(res.status).toBe(404);
  });

  // --- Seller profile shape ---

  it("returns 200 with seller profile shape", async () => {
    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty("seller");
  });

  it("seller profile contains expected fields", async () => {
    const res = await GET(buildReq());
    const json = await res.json();

    const s = json.seller;
    expect(s).toHaveProperty("id");
    expect(s).toHaveProperty("userId");
    expect(s).toHaveProperty("shopName");
    expect(s).toHaveProperty("phone");
    expect(s).toHaveProperty("rating");
    expect(s).toHaveProperty("salesCount");
    expect(s).toHaveProperty("balance");
    expect(s).toHaveProperty("pendingBalance");
    expect(s).toHaveProperty("verificationStatus");
    expect(s).toHaveProperty("payoutStatus");
    expect(s).toHaveProperty("responseTimeMinutes");
    expect(s).toHaveProperty("fulfillmentRate");
    expect(s).toHaveProperty("disputeRate");
    expect(s).toHaveProperty("createdAt");
    expect(s).toHaveProperty("totalGrossSales");
    expect(s).toHaveProperty("totalNetEarnings");
    expect(s).toHaveProperty("totalCommissionPaid");
  });

  it("maps seller fields correctly from Supabase response", async () => {
    const res = await GET(buildReq());
    const json = await res.json();

    const s = json.seller;
    expect(s.id).toBe("seller-001");
    expect(s.userId).toBe("test-user-id");
    expect(s.shopName).toBe("Test Shop");
    expect(s.phone).toBe("0812345678");
    expect(s.rating).toBe(4.8);
    expect(s.salesCount).toBe(150);
    expect(s.balance).toBe(5000);
    expect(s.pendingBalance).toBe(1200);
    expect(s.payoutStatus).toBe("auto");
    expect(s.responseTimeMinutes).toBe(3);
    expect(s.fulfillmentRate).toBe(98.5);
    expect(s.disputeRate).toBe(0.5);
    expect(s.createdAt).toBe("2024-01-15T00:00:00Z");
  });

  it("verificationStatus is 'verified' when seller.verified is true", async () => {
    const res = await GET(buildReq());
    const json = await res.json();

    expect(json.seller.verificationStatus).toBe("verified");
  });

  it("verificationStatus is 'new' when seller.verified is false", async () => {
    mockState.sellerData = { ...baseSellerData, verified: false };

    const res = await GET(buildReq());
    const json = await res.json();

    expect(json.seller.verificationStatus).toBe("new");
  });

  it("defaults missing optional fields correctly", async () => {
    mockState.sellerData = {
      id: "seller-001",
      user_id: "test-user-id",
      store_name: "Minimal Shop",
      // phone, rating, balance, pending_balance, verified, etc. all missing
    };

    const res = await GET(buildReq());
    const json = await res.json();

    const s = json.seller;
    expect(s.phone).toBe("");
    expect(s.rating).toBe(0);
    expect(s.balance).toBe(0);
    expect(s.pendingBalance).toBe(0);
    expect(s.verificationStatus).toBe("new");
    expect(s.payoutStatus).toBe("manual");
    expect(s.responseTimeMinutes).toBe(5);
    expect(s.fulfillmentRate).toBe(100);
    expect(s.disputeRate).toBe(0);
    expect(s.salesCount).toBe(0);
  });

  // --- Ledger-based KPIs ---

  it("calculates totalGrossSales, totalNetEarnings, totalCommissionPaid from ledger", async () => {
    mockState.ledgerData = [
      baseLedgerEntry("sale", 2000),
      baseLedgerEntry("sale", 800),
      baseLedgerEntry("commission_fee", 140),
      baseLedgerEntry("withdrawal", 500),
    ];

    const res = await GET(buildReq());
    const json = await res.json();

    const s = json.seller;
    expect(s.totalGrossSales).toBe(2800);   // sum of sales
    expect(s.totalCommissionPaid).toBe(140); // sum of commission_fees
    expect(s.totalNetEarnings).toBe(2160);   // 2800 - 140 - 500
  });
});
