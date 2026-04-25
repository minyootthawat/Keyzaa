import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------------
// Mock state — MUST be defined before vi.mock so factory can reference it
// ---------------------------------------------------------------------------

const mockSupabaseState = vi.hoisted(() => ({
  orderRow: null as Record<string, unknown> | null,
  itemRows: [] as unknown[],
  sellerRow: null as Record<string, unknown> | null,
  orderError: null as Error | null,
  itemsError: null as Error | null,
  throwError: null as Error | null,
}));

const mockAuthState = vi.hoisted(() => ({
  authUserId: "test-user-id",
}));

const mockAuth = vi.hoisted(() =>
  vi.fn().mockImplementation(() => {
    return Promise.resolve(
      mockAuthState.authUserId
        ? { userId: mockAuthState.authUserId }
        : null
    );
  })
);

// ---------------------------------------------------------------------------
// Mock: auth/jwt
// ---------------------------------------------------------------------------
vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: mockAuth,
}));

// ---------------------------------------------------------------------------
// Mock: lib/supabase/supabase
// ---------------------------------------------------------------------------
vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockImplementation(() => ({
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "orders") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(async () => {
            if (mockSupabaseState.throwError) throw mockSupabaseState.throwError;
            if (mockSupabaseState.orderError) return { data: null, error: mockSupabaseState.orderError };
            return { data: mockSupabaseState.orderRow, error: null };
          }),
        };
      }
      if (table === "order_items") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: mockSupabaseState.itemRows,
            error: mockSupabaseState.itemsError,
          }),
        };
      }
      if (table === "sellers") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockSupabaseState.sellerRow,
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  })),
}));

// ---------------------------------------------------------------------------
// Mock: marketplace-server
// ---------------------------------------------------------------------------
vi.mock("@/lib/marketplace-server", () => ({
  getStaticSellerSeedById: vi.fn().mockReturnValue(undefined),
  mapOrderDocument: vi.fn().mockImplementation((doc: Record<string, unknown>) => ({
    id: doc.orderId,
    buyerId: doc.buyerId,
    sellerId: doc.sellerId,
    date: doc.date,
    status: doc.status || "pending",
    paymentStatus: doc.paymentStatus || "pending",
    fulfillmentStatus: doc.fulfillmentStatus || "pending",
    totalPrice: Number(doc.totalPrice ?? 0),
    grossAmount: Number(doc.grossAmount ?? 0),
    commissionAmount: Number(doc.commissionAmount ?? 0),
    sellerNetAmount: Number(doc.sellerNetAmount ?? 0),
    platformFeeRate: Number(doc.platformFeeRate ?? 0.12),
    currency: (doc.currency as string) || "THB",
    paymentMethod: (doc.paymentMethod as string) || "",
    items: (doc.items as unknown[]) || [],
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq(url = "http://localhost/api/orders/ord_test_001") {
  const headers = new Headers();
  if (mockAuthState.authUserId) headers.set("authorization", "Bearer mock-token");
  return new NextRequest(url, { headers, method: "GET" });
}

function makeCtx(id = "ord_test_001") {
  return { params: Promise.resolve({ id }) };
}

const baseOrderRow = {
  id: "ord_test_001",
  buyer_id: "test-user-id",
  seller_id: "seller-001",
  status: "pending",
  payment_status: "pending",
  fulfillment_status: "pending",
  total_price: 100,
  gross_amount: 88,
  commission_amount: 12,
  seller_net_amount: 88,
  platform_fee_rate: 0.12,
  currency: "THB",
  payment_method: "promptpay",
  created_at: "2025-01-01T00:00:00Z",
};

const baseItemRows = [
  {
    id: "item-1",
    order_id: "ord_test_001",
    product_id: "prod-001",
    title: "Test Product",
    title_th: "สินค้าทดสอบ",
    title_en: "Test Product",
    image: "https://example.com/image.png",
    price: 100,
    quantity: 1,
    platform: "mobile",
    region_code: "TH",
    activation_method_th: "OTP",
    activation_method_en: "OTP",
  },
];

const baseSellerRow = {
  store_name: "Test Shop",
  verified: true,
  rating: 4.5,
  sales_count: 120,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("GET /api/orders/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseState.orderRow = null;
    mockSupabaseState.itemRows = [];
    mockSupabaseState.sellerRow = null;
    mockSupabaseState.orderError = null;
    mockSupabaseState.itemsError = null;
    mockSupabaseState.throwError = null;
    mockAuthState.authUserId = "test-user-id";
  });

  it("returns 200 with order and seller details", async () => {
    mockSupabaseState.orderRow = baseOrderRow;
    mockSupabaseState.itemRows = baseItemRows;
    mockSupabaseState.sellerRow = baseSellerRow;

    const res = await GET(buildReq(), makeCtx());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.order).toBeDefined();
    expect(json.seller).toBeDefined();
    expect(json.order.id).toBe("ord_test_001");
  });

  it("returns 401 when auth payload is null", async () => {
    mockAuthState.authUserId = "";

    const res = await GET(buildReq(), makeCtx());
    expect(res.status).toBe(401);
  });

  it("returns 404 when order is not found", async () => {
    mockSupabaseState.orderRow = null;

    const res = await GET(
      buildReq("http://localhost/api/orders/ord_nonexistent"),
      makeCtx("ord_nonexistent")
    );
    expect(res.status).toBe(404);
  });

  it("returns 500 on error", async () => {
    mockSupabaseState.throwError = new Error("Supabase error");

    const res = await GET(buildReq(), makeCtx());
    expect(res.status).toBe(500);
  });
});