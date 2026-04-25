import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const mockState = {
  authUserId: "test-user-id",
  sellerData: null as { id: string; user_id: string } | null,
  orders: [] as Record<string, unknown>[],
  products: [] as Record<string, unknown>[],
  ledgerEntries: [] as Record<string, unknown>[],
  orderItems: [] as Record<string, unknown>[],
  throwError: null as Error | null,
};

function createQueryMock() {
  const sellerState = { table: "", filters: [] };
  const ordersState = { table: "", filters: [] };
  const productsState = { table: "", filters: [] };
  const ledgerState = { table: "", filters: [] };
  const orderItemsState = { table: "", filters: [] };

  function makeChain(state: typeof sellerState) {
    const chain: Record<string, (...args: unknown[]) => unknown> = {
      select: () => makeChain(state),
      eq: (field: string, value: unknown) => { state.filters.push({ field, value }); return makeChain(state); },
      order: (field: string, options?: { ascending: boolean }) => makeChain(state),
      limit: (n: number) => makeChain(state),
      in: (field: string, values: string[]) => makeChain(state),
      single: () => {
        console.log('[single] state === sellerState?', state === sellerState, 'mockState.sellerData:', JSON.stringify(mockState.sellerData));
        const data = state === sellerState ? mockState.sellerData : null;
        return { data, error: data ? null : { message: "No data" } };
      },
      then: (resolve: (val: { data: unknown; error: unknown }) => void) => {
        console.log('[then] state === sellerState?', state === sellerState);
        let data: unknown;
        if (state === sellerState) { data = mockState.sellerData; }
        else if (state === ordersState) { data = mockState.orders; }
        else if (state === productsState) { data = mockState.products; }
        else if (state === ledgerState) { data = mockState.ledgerEntries; }
        else if (state === orderItemsState) { data = mockState.orderItems; }
        else { data = []; }
        resolve({ data, error: null });
        return { then: (resolve2: (val: unknown) => void) => { resolve2({ data, error: null }); } };
      },
    };
    return chain;
  }

  return {
    from: vi.fn().mockImplementation((table: string) => {
      console.log('[from] table:', table);
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
  getBearerPayload: vi.fn().mockResolvedValue({ userId: "test-user-id" }),
}));

vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockImplementation(() => createQueryMock()),
}));

async function getResponse() {
  const { GET } = await import("./route");
  const headers = new Headers();
  headers.set("authorization", "Bearer mock-token");
  return GET(new NextRequest("http://localhost/api/seller/overview", { headers }), { params: Promise.resolve({}) });
}

describe("TRACE", () => {
  beforeEach(() => {
    console.log('[beforeEach] setting sellerData');
    mockState.sellerData = { id: "seller-001", user_id: "test-user-id" };
    mockState.ledgerEntries = [
      { id: "ledger-1", seller_id: "seller-001", type: "sale", amount: 1000, order_id: "oid1", description: "sale transaction", created_at: "2025-01-01T00:00:00Z" },
    ];
    mockState.orders = [];
    mockState.products = [];
    mockState.orderItems = [];
  });

  it("TRACE", async () => {
    console.log('\n===== TEST START =====');
    const res = await getResponse();
    console.log('===== GOT RESPONSE =====');
    console.log('Status:', res.status);
    expect(res.status).toBe(200);
  });
});
