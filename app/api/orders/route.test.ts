import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";

// ─── Auth mock ────────────────────────────────────────────────────────────────
vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi.fn().mockResolvedValue({ userId: "buyer-user-123" }),
}));

// ─── MongoDB mock ─────────────────────────────────────────────────────────────
vi.mock("@/lib/db/mongodb", () => {
  const mockFind = vi.fn();
  const mockFindOne = vi.fn();
  const mockInsertOne = vi.fn();
  const mockInsertMany = vi.fn();

  return {
    connectDB: vi.fn().mockResolvedValue({
      db: {
        collection: vi.fn().mockReturnValue({
          find: mockFind,
          findOne: mockFindOne,
          insertOne: mockInsertOne,
          insertMany: mockInsertMany,
        }),
      },
    }),
    getDb: vi.fn(),
    _mocks: { mockFind, mockFindOne, mockInsertOne, mockInsertMany },
  };
});

// ─── Marketplace helpers (used by POST) ────────────────────────────────────────
vi.mock("@/lib/marketplace-server", () => ({
  buildLedgerEntries: vi.fn().mockReturnValue([]),
  calculateMarketplaceAmounts: vi.fn().mockReturnValue({
    grossAmount: 100,
    commissionAmount: 12,
    sellerNetAmount: 88,
    platformFeeRate: 0.12,
    currency: "THB",
  }),
  deriveOrderState: vi.fn().mockReturnValue({
    paymentStatus: "paid",
    fulfillmentStatus: "pending",
  }),
  mapOrderDocument: vi.fn().mockImplementation((doc) => ({ ...doc, id: doc.orderId })),
}));

function makeReq(method = "GET", body?: unknown) {
  const req = new NextRequest("http://localhost/api/orders", { method }) as NextRequest & { json: () => Promise<unknown> };
  if (body !== undefined) {
    req.json = async () => body;
  }
  return req;
}

describe("GET /api/orders", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { _mocks } = await import("@/lib/db/mongodb");
    const { mockFind } = _mocks;
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([
        {
          order_id: "ord_001",
          buyer_id: "buyer-user-123",
          seller_id: "seller-001",
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
          items: [],
        },
      ]),
    });
  });

  it("returns 200 with orders array for authenticated buyer", async () => {
    const res = await GET(makeReq("GET"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("orders");
    expect(Array.isArray(json.orders)).toBe(true);
    expect(json.orders[0].id).toBe("ord_001");
  });

  it("returns 401 when auth returns null userId", async () => {
    const { getBearerPayload } = await import("@/lib/auth/jwt");
    vi.mocked(getBearerPayload).mockResolvedValueOnce(null);
    const res = await GET(makeReq("GET"));
    expect(res.status).toBe(401);
  });

  it("returns 500 when MongoDB throws", async () => {
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockRejectedValueOnce(new Error("DB connection failed"));
    const res = await GET(makeReq("GET"));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/orders", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { _mocks } = await import("@/lib/db/mongodb");
    const { mockInsertOne, mockInsertMany } = _mocks;
    mockInsertOne.mockResolvedValue({ insertedId: "new-id" });
    mockInsertMany.mockResolvedValue({ insertedIds: [] });
  });

  const validBody = {
    totalPrice: 100,
    paymentMethod: "promptpay",
    items: [
      {
        id: "item-1",
        productId: "prod-001",
        sellerId: "seller-001",
        title: "Test Item",
        price: 100,
        quantity: 1,
        keys: [],
      },
    ],
  };

  it("returns 201 with created order for valid payload", async () => {
    const req = makeReq("POST", validBody);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toHaveProperty("order");
    expect(json).toHaveProperty("orders");
  });

  it("returns 401 when auth returns null userId", async () => {
    const { getBearerPayload } = await import("@/lib/auth/jwt");
    vi.mocked(getBearerPayload).mockResolvedValueOnce(null);
    const req = makeReq("POST", validBody);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when items array is empty", async () => {
    const req = makeReq("POST", { ...validBody, items: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid order payload");
  });

  it("returns 400 when totalPrice is missing", async () => {
    const req = makeReq("POST", { paymentMethod: "promptpay", items: validBody.items });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when paymentMethod is missing", async () => {
    const req = makeReq("POST", { totalPrice: 100, items: validBody.items });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 500 when MongoDB insert throws", async () => {
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockRejectedValueOnce(new Error("DB write failed"));
    const req = makeReq("POST", validBody);
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
