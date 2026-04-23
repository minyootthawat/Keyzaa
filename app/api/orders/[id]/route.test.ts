import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// ─── Shared mock refs (hoisted above vi.mock so factory can access them) ───────
const mockFindOne = vi.hoisted(() => vi.fn());
const mockFind = vi.hoisted(() => vi.fn());

// ─── Auth mock ────────────────────────────────────────────────────────────────
vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi.fn().mockResolvedValue({ userId: "buyer-user-123" }),
}));

// ─── MongoDB mock ─────────────────────────────────────────────────────────────
vi.mock("@/lib/db/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue({
    db: {
      collection: vi.fn().mockReturnValue({
        findOne: mockFindOne,
        find: mockFind,
      }),
    },
  }),
  getDb: vi.fn(),
}));

// ─── Marketplace helpers ───────────────────────────────────────────────────────
vi.mock("@/lib/marketplace-server", () => ({
  getStaticSellerSeedById: vi.fn().mockReturnValue(null),
  mapOrderDocument: vi.fn().mockImplementation((doc) => ({ ...doc, id: doc.orderId })),
}));

function makeGetReq(id: string) {
  const url = new URL(`http://localhost/api/orders/${id}`);
  return new NextRequest(url, { method: "GET" }) as NextRequest;
}

const sampleOrderDoc = {
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
};

describe("GET /api/orders/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFindOne.mockResolvedValue({ ...sampleOrderDoc });
    mockFind.mockResolvedValue(null);
  });

  it("returns 200 with order for authenticated buyer who owns the order", async () => {
    const res = await GET(makeGetReq("ord_001"), { params: Promise.resolve({ id: "ord_001" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("order");
    expect(json.order.id).toBe("ord_001");
  });

  it("returns 401 when auth returns null userId", async () => {
    const { getBearerPayload } = await import("@/lib/auth/jwt");
    vi.mocked(getBearerPayload).mockResolvedValueOnce(null);
    const res = await GET(makeGetReq("ord_001"), { params: Promise.resolve({ id: "ord_001" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when order not found", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    const res = await GET(makeGetReq("ord_nonexistent"), { params: Promise.resolve({ id: "ord_nonexistent" }) });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Order not found");
  });

  it("returns 404 when buyer_id does not match authenticated user", async () => {
    mockFindOne.mockResolvedValueOnce({
      ...sampleOrderDoc,
      order_id: "ord_002",
      buyer_id: "other-user-456",
    });
    const res = await GET(makeGetReq("ord_002"), { params: Promise.resolve({ id: "ord_002" }) });
    expect(res.status).toBe(404);
  });

  it("returns 500 when MongoDB throws", async () => {
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockRejectedValueOnce(new Error("DB error"));
    const res = await GET(makeGetReq("ord_001"), { params: Promise.resolve({ id: "ord_001" }) });
    expect(res.status).toBe(500);
  });
});
