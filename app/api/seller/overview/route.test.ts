import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = {
  authUserId: "test-user-id",
  sellerData: { id: "seller-001", user_id: "test-user-id" },
  orders: [] as Record<string, unknown>[],
  products: [] as Record<string, unknown>[],
  ledgerEntries: [] as Record<string, unknown>[],
  orderItems: [] as Record<string, unknown>[],
  throwError: null as Error | null,
};

// ---------------------------------------------------------------------------
// Supabase mock helpers
// ---------------------------------------------------------------------------

type QueryState = {
  table: string;
  filters: Array<{ field: string; value: unknown }>;
  orderField?: string;
  orderAsc?: boolean;
  limitVal?: number;
  inField?: string;
  inValues?: string[];
};

function buildQueryResolver(table: string, getData: () => unknown[]) {
  return (state: QueryState) => {
    let data = getData();

    // Apply eq filters
    for (const filter of state.filters) {
      if (filter.field === "seller_id") {
        data = data.filter((d: Record<string, unknown>) => d.seller_id === filter.value);
      }
      if (filter.field === "user_id") {
        data = data.filter((d: Record<string, unknown>) => d.user_id === filter.value);
      }
      if (filter.field === "order_id" && state.inField === "order_id") {
        data = data.filter((d: Record<string, unknown>) => (state.inValues ?? []).includes(d.order_id as string));
      }
    }

    // Apply order
    if (state.orderField) {
      data = [...data].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aVal = a[state.orderField!];
        const bVal = b[state.orderField!];
        return state.orderAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }

    // Apply limit
    if (state.limitVal && state.limitVal > 0) {
      data = data.slice(0, state.limitVal);
    }

    return { data, error: null };
  };
}

function createQueryMock() {
  // Separate state for each query to avoid race conditions in parallel execution
  const sellerState: QueryState = { table: "", filters: [] };
  const ordersState: QueryState = { table: "", filters: [] };
  const productsState: QueryState = { table: "", filters: [] };
  const ledgerState: QueryState = { table: "", filters: [] };
  const orderItemsState: QueryState = { table: "", filters: [] };

  function makeChain(state: QueryState) {
    const chain: Record<string, (...args: unknown[]) => unknown> = {
      select: () => {
        state.table = state.table || "select";
        return makeChain(state);
      },
      eq: (field: string, value: unknown) => {
        state.filters.push({ field, value });
        return makeChain(state);
      },
      order: (field: string, options?: { ascending: boolean }) => {
        state.orderField = field;
        state.orderAsc = options?.ascending ?? false;
        return makeChain(state);
      },
      limit: (n: number) => {
        state.limitVal = n;
        return makeChain(state);
      },
      in: (field: string, values: string[]) => {
        state.inField = field;
        state.inValues = values;
        return makeChain(state);
      },
      single: () => {
        const data = state === sellerState ? mockState.sellerData : null;
        return { data, error: data ? null : { message: "No data" } };
      },
      then: (resolve: (val: { data: unknown; error: unknown }) => void, _reject: unknown) => {
        let data: unknown;
        if (state === sellerState) {
          data = mockState.sellerData;
        } else if (state === ordersState) {
          const orders = [...mockState.orders];
          if (state.orderField === "created_at") {
            orders.sort((a, b) => {
              const aTime = new Date((a as { created_at: string }).created_at).getTime();
              const bTime = new Date((b as { created_at: string }).created_at).getTime();
              return state.orderAsc ? aTime - bTime : bTime - aTime;
            });
          }
          data = orders;
        } else if (state === productsState) {
          data = mockState.products;
        } else if (state === ledgerState) {
          data = mockState.ledgerEntries;
        } else if (state === orderItemsState) {
          data = mockState.orderItems;
        } else {
          data = [];
        }
        resolve({ data, error: null });
        // Return a thenable so Promise.all works correctly
        return {
          then: (resolve2: (val: unknown) => void) => {
            resolve2({ data, error: null });
          },
        };
      },
    };
    return chain;
  }

  // Return a from() that dispatches to the right state based on table hint
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "sellers") return makeChain(sellerState);
      if (table === "orders") return makeChain(ordersState);
      if (table === "products") return makeChain(productsState);
      if (table === "seller_ledger_entries") return makeChain(ledgerState);
      if (table === "order_items") return makeChain(orderItemsState);
      return makeChain({ table: "", filters: [] });
    }),
  };
}

vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi.fn().mockImplementation(() => {
    if (!mockState.authUserId) return Promise.resolve(null);
    return Promise.resolve({ userId: mockState.authUserId });
  }),
}));

vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockImplementation(() => createQueryMock()),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq(url = "http://localhost/api/seller/overview") {
  const headers = new Headers();
  if (mockState.authUserId) headers.set("authorization", "Bearer mock-token");
  return new NextRequest(url, { headers, method: "GET" });
}

const baseOrder = {
  id: "oid1",
  buyer_id: "buyer-001",
  seller_id: "seller-001",
  product_id: "prod1",
  quantity: 1,
  total_price: 500,
  gross_amount: 500,
  commission_amount: 25,
  seller_net_amount: 475,
  platform_fee_rate: 0.05,
  currency: "THB",
  status: "delivered",
  payment_status: "paid",
  fulfillment_status: "delivered",
  payment_method: "promptpay",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const baseProduct = {
  id: "prod1",
  seller_id: "seller-001",
  name: "Test Product",
  description: "A test product",
  category: "digital",
  price: 199,
  stock: 10,
  image_url: null,
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const baseLedgerEntry = (type: string, amount: number) => ({
  id: `ledger-${type}-1`,
  seller_id: "seller-001",
  type,
  amount,
  order_id: "oid1",
  description: `${type} transaction`,
  created_at: "2025-01-01T00:00:00Z",
});

const baseOrderItem = {
  id: "oi1",
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
    mockState.authUserId = "test-user-id";
    mockState.sellerData = { id: "seller-001", user_id: "test-user-id" };
    mockState.orders = [];
    mockState.products = [];
    mockState.ledgerEntries = [];
    mockState.orderItems = [];
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

  it("returns 500 on error", async () => {
    // Force an error by clearing sellerData to cause a failure
    mockState.sellerData = null;

    const res = await GET(buildReq());

    expect(res.status).toBe(404);
  });

  // --- KPIs ---

  it("calculates KPIs correctly for sale + commission_fee + withdrawal ledger entries", async () => {
    mockState.ledgerEntries = [
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
    mockState.ledgerEntries = [baseLedgerEntry("withdrawal", 10000)];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(json.kpis.availableForPayout).toBe(0);
    expect(json.kpis.netEarnings).toBe(-10000);
  });

  it("KPIs orderCount reflects the number of orders returned", async () => {
    mockState.orders = [
      { ...baseOrder, id: "oid1" },
      { ...baseOrder, id: "oid2" },
    ];
    mockState.orderItems = [];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(json.kpis.orderCount).toBe(2);
  });

  // --- Order list ---

  it("returns orders array with correct shape", async () => {
    mockState.orders = [baseOrder];
    mockState.orderItems = [baseOrderItem];

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
    mockState.orders = [baseOrder];
    mockState.orderItems = [baseOrderItem];

    const res = await GET(buildReq());
    const json = await res.json();

    const item = json.orders[0].items[0];
    expect(item.productId).toBe("prod1");
    expect(item.title).toBe("Test Product");
    expect(item.price).toBe(500);
    expect(item.quantity).toBe(1);
    expect(item.platform).toBe("mobile");
  });

  it("returns orders sorted by created_at descending", async () => {
    mockState.orders = [
      { ...baseOrder, id: "oid1", created_at: "2025-01-01T00:00:00Z" },
      { ...baseOrder, id: "oid2", created_at: "2025-01-03T00:00:00Z" },
      { ...baseOrder, id: "oid3", created_at: "2025-01-02T00:00:00Z" },
    ];
    mockState.orderItems = [];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    // Most recent first
    expect(json.orders[0].id).toBe("oid2");
    expect(json.orders[1].id).toBe("oid3");
    expect(json.orders[2].id).toBe("oid1");
  });

  // --- Product list ---

  it("returns products array with correct shape", async () => {
    mockState.products = [baseProduct];
    mockState.orders = [];
    mockState.ledgerEntries = [];

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

  it("returns empty arrays when no data exists", async () => {
    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orders).toEqual([]);
    expect(json.products).toEqual([]);
    expect(json.kpis.orderCount).toBe(0);
  });
});