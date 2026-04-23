import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = {
  authUserId: "test-user-id",
  sellerData: null as { id: string; user_id: string } | null,
  orderDocs: [] as Record<string, unknown>[],
  productDocs: [] as Record<string, unknown>[],
  ledgerDocs: [] as Record<string, unknown>[],
  orderItemDocs: [] as Record<string, unknown>[],
  throwError: null as Error | null,
};

function makeCollection(name: string) {
  // Cursor class so .sort().limit().toArray() chaining works
  class Cursor {
    private _limit = 0;
    limit(n: number) { this._limit = n; return this; }
    sort() { return this; }
    skip() { return this; }
    toArray() {
      if (name === "orders") {
        const docs = this._limit > 0 ? mockState.orderDocs.slice(0, this._limit) : mockState.orderDocs;
        return Promise.resolve(docs);
      }
      if (name === "products") {
        const docs = this._limit > 0 ? mockState.productDocs.slice(0, this._limit) : mockState.productDocs;
        return Promise.resolve(docs);
      }
      if (name === "seller_ledger_entries") {
        return Promise.resolve(mockState.ledgerDocs);
      }
      if (name === "order_items") {
        return Promise.resolve(mockState.orderItemDocs);
      }
      return Promise.resolve([]);
    }
  }

  if (name === "orders") {
    return {
      find: vi.fn().mockReturnValue(new Cursor()),
      findOne: vi.fn().mockResolvedValue(null),
    };
  }
  if (name === "products") {
    return {
      find: vi.fn().mockReturnValue(new Cursor()),
    };
  }
  if (name === "seller_ledger_entries") {
    return {
      find: vi.fn().mockReturnValue(new Cursor()),
    };
  }
  if (name === "order_items") {
    return {
      find: vi.fn().mockReturnValue(new Cursor()),
    };
  }
  return {
    find: vi.fn().mockReturnValue(new Cursor()),
    findOne: vi.fn().mockResolvedValue(null),
  };
}

vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi.fn().mockImplementation(() => {
    if (!mockState.authUserId) return Promise.resolve(null);
    return Promise.resolve({ userId: mockState.authUserId });
  }),
}));

vi.mock("@/lib/db/mongodb", () => ({
  connectDB: vi.fn().mockImplementation(async () => {
    if (mockState.throwError) throw mockState.throwError;
    return {
      client: {} as unknown,
      db: {
        collection: vi.fn().mockImplementation((name: string) => makeCollection(name)),
      },
    };
  }),
  getDb: vi.fn(),
}));

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

vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(() => buildThenable(mockState.sellerData, null)),
      insert: vi.fn().mockReturnValue({ error: null }),
    })),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq(url = "http://localhost/api/seller/overview") {
  const headers = new Headers();
  if (mockState.authUserId) headers.set("authorization", "Bearer mock-token");
  return new NextRequest(url, { headers, method: "GET" });
}

const baseOrderDoc = {
  _id: "oid1",
  buyer_id: "buyer-001",
  seller_id: "seller-001",
  status: "delivered",
  payment_status: "paid",
  fulfillment_status: "delivered",
  total_price: 500,
  payment_method: "promptpay",
  created_at: "2025-01-01T00:00:00Z",
};

const baseProductDoc = {
  _id: "prod1",
  name: "Test Product",
  stock: 10,
  price: 199,
  created_at: "2025-01-01T00:00:00Z",
};

const baseLedgerEntry = (type: string, amount: number) => ({
  _id: `ledger-${type}-1`,
  seller_id: "seller-001",
  type,
  amount,
  created_at: "2025-01-01T00:00:00Z",
});

const baseOrderItemDoc = {
  _id: "oi1",
  order_id: "oid1",
  product_id: "prod1",
  title: "Test Product",
  price: 500,
  quantity: 1,
  platform: "mobile",
};

// ---------------------------------------------------------------------------
// GET /api/seller/overview
// ---------------------------------------------------------------------------

describe("GET /api/seller/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.authUserId = "test-user-id";
    mockState.sellerData = { id: "seller-001", user_id: "test-user-id" };
    mockState.orderDocs = [];
    mockState.productDocs = [];
    mockState.ledgerDocs = [];
    mockState.orderItemDocs = [];
    mockState.throwError = null;
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

  it("returns 500 on DB error", async () => {
    mockState.throwError = new Error("DB error");

    const res = await GET(buildReq());

    expect(res.status).toBe(500);
  });

  // --- KPIs ---

  it("calculates KPIs correctly for sale + commission_fee + withdrawal ledger entries", async () => {
    mockState.ledgerDocs = [
      baseLedgerEntry("sale", 1000),
      baseLedgerEntry("sale", 500),
      baseLedgerEntry("commission_fee", 75),
      baseLedgerEntry("withdrawal", 200),
    ];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.kpis.grossSales).toBe(1500);
    expect(json.kpis.platformFees).toBe(75);
    expect(json.kpis.netEarnings).toBe(1225); // 1500 - 75 - 200
    expect(json.kpis.availableForPayout).toBe(1225);
  });

  it("KPIs availableForPayout is never negative", async () => {
    mockState.ledgerDocs = [
      baseLedgerEntry("withdrawal", 10000),
    ];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(json.kpis.availableForPayout).toBe(0);
    expect(json.kpis.netEarnings).toBe(-10000);
  });

  it("KPIs orderCount reflects the number of orders returned", async () => {
    mockState.orderDocs = [
      { ...baseOrderDoc, _id: "oid1" },
      { ...baseOrderDoc, _id: "oid2" },
    ];
    mockState.orderItemDocs = [];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(json.kpis.orderCount).toBe(2);
  });

  // --- Order list ---

  it("returns orders array with correct shape", async () => {
    mockState.orderDocs = [baseOrderDoc];
    mockState.orderItemDocs = [baseOrderItemDoc];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orders).toBeInstanceOf(Array);
    expect(json.orders.length).toBe(1);

    const order = json.orders[0];
    expect(order).toHaveProperty("id");
    expect(order).toHaveProperty("orderId");
    expect(order).toHaveProperty("buyerId");
    expect(order).toHaveProperty("date");
    expect(order).toHaveProperty("status");
    expect(order).toHaveProperty("paymentStatus");
    expect(order).toHaveProperty("fulfillmentStatus");
    expect(order).toHaveProperty("totalPrice");
    expect(order).toHaveProperty("currency");
    expect(order).toHaveProperty("paymentMethod");
    expect(order).toHaveProperty("items");
    expect(order.currency).toBe("THB");
    expect(order.platformFeeRate).toBe(0.05);
  });

  it("maps order items correctly into the order shape", async () => {
    mockState.orderDocs = [baseOrderDoc];
    mockState.orderItemDocs = [baseOrderItemDoc];

    const res = await GET(buildReq());
    const json = await res.json();

    const item = json.orders[0].items[0];
    expect(item.productId).toBe("prod1");
    expect(item.title).toBe("Test Product");
    expect(item.price).toBe(500);
    expect(item.quantity).toBe(1);
    expect(item.platform).toBe("mobile");
  });

  it("limits orders to 20 entries", async () => {
    mockState.orderDocs = Array.from({ length: 25 }, (_, i) => ({
      ...baseOrderDoc,
      _id: `oid${i}`,
    }));
    mockState.orderItemDocs = [];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(json.orders.length).toBeLessThanOrEqual(20);
  });

  // --- Product list ---

  it("returns products array with correct shape", async () => {
    mockState.productDocs = [baseProductDoc];
    mockState.orderDocs = [];
    mockState.ledgerDocs = [];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.products).toBeInstanceOf(Array);
    expect(json.products.length).toBe(1);

    const product = json.products[0];
    expect(product.id).toBe("prod1");
    expect(product.title).toBe("Test Product");
    expect(product.stock).toBe(10);
    expect(product.price).toBe(199);
    expect(product.soldCount).toBe(0);
  });

  it("limits products to 5 entries", async () => {
    mockState.productDocs = Array.from({ length: 8 }, (_, i) => ({
      ...baseProductDoc,
      _id: `prod${i}`,
    }));
    mockState.orderDocs = [];
    mockState.ledgerDocs = [];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(json.products.length).toBeLessThanOrEqual(5);
  });

  it("returns empty arrays when no data exists", async () => {
    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orders).toEqual([]);
    expect(json.products).toEqual([]);
    expect(json.kpis.orderCount).toBe(0);
  });
});
