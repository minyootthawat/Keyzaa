import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------------
// Mock state — MUST be defined before vi.mock so factory can reference it
// ---------------------------------------------------------------------------

const mockDbState = vi.hoisted(() => ({
  sellerDoc: null as Record<string, unknown> | null,
  orderDoc: null as Record<string, unknown> | null,
  findResult: [] as unknown[],
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
// Mock: db/mongodb — proper collection() returning chainable mock
// ---------------------------------------------------------------------------
vi.mock("@/lib/db/mongodb", () => {
  function makeCollection() {
    const findMock = vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue(mockDbState.findResult),
    });
    return {
      find: findMock,
      findOne: vi.fn().mockImplementation((query: Record<string, unknown>) => {
        if (query?.seller_id) return Promise.resolve(mockDbState.sellerDoc);
        return Promise.resolve(mockDbState.orderDoc);
      }),
      insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-id" }),
      countDocuments: vi.fn().mockResolvedValue(mockDbState.findResult.length),
      aggregate: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    };
  }

  return {
    connectDB: vi.fn().mockImplementation(async () => {
      if (mockDbState.throwError) throw mockDbState.throwError;
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
// Mock: marketplace-server (only used by mapOrderDocument)
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

const baseOrderDoc = {
  _id: "oid1",
  order_id: "ord_test_001",
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
  items: [],
  created_at: "2025-01-01T00:00:00Z",
};

const baseSellerDoc = {
  _id: "sid1",
  seller_id: "seller-001",
  shop_name: "Test Shop",
  verification_status: "verified",
  rating: 4.5,
  sales_count: 120,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("GET /api/orders/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbState.orderDoc = null;
    mockDbState.sellerDoc = null;
    mockDbState.throwError = null;
    mockDbState.findResult = [];
    mockAuthState.authUserId = "test-user-id";
  });

  it("returns 200 with order and seller details", async () => {
    mockDbState.orderDoc = baseOrderDoc;
    mockDbState.sellerDoc = baseSellerDoc;

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
    mockDbState.orderDoc = null;
    mockDbState.sellerDoc = null;

    const res = await GET(
      buildReq("http://localhost/api/orders/ord_nonexistent"),
      makeCtx("ord_nonexistent")
    );
    expect(res.status).toBe(404);
  });

  it("returns 500 on DB error", async () => {
    mockDbState.throwError = new Error("DB error");

    const res = await GET(buildReq(), makeCtx());
    expect(res.status).toBe(500);
  });
});
