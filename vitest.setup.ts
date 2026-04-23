import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://mock-project.supabase.co";

// ---------------------------------------------------------------------------
// Set required env vars before any module imports happen
// ---------------------------------------------------------------------------
process.env.JWT_SECRET = "test-secret-key-for-unit-tests-only";
process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;

// ---------------------------------------------------------------------------
// Mock jose jwtVerify — bypasses real JWT verification in all tests
// ---------------------------------------------------------------------------
vi.mock("jose", () => ({
  jwtVerify: vi.fn().mockResolvedValue({
    payload: { userId: "user-123", email: "test@keyzaa.com" },
  }),
}));

// ---------------------------------------------------------------------------
// Mock Supabase client — returns a thenable chain.
// MSW intercepts the underlying fetch calls made by the real client.
// ---------------------------------------------------------------------------
vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue(buildChain()),
  }),
}));

/** Builds a fully chainable thenable that Supabase query methods return. */
function buildChain(data: unknown = null, error: unknown = null): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  const obj: Record<string, unknown> = {
    then: (res: (v: { data: unknown; error: unknown }) => void) => {
      // Small delay so await catches it properly
      setTimeout(() => res({ data, error }), 0);
      return obj;
    },
  };

  const methods = ["select", "eq", "neq", "order", "limit", "in", "single", "maybeSingle"];
  for (const method of methods) {
    chain[method] = () => buildChain(data, error);
  }

  return Object.assign(obj, chain);
}

// ---------------------------------------------------------------------------
// Default MSW handlers — tests override via server.use()
// ---------------------------------------------------------------------------
const defaultSellerRecord = { id: "seller-001", user_id: "user-123" };

export const server = setupServer(
  http.get(`${SUPABASE_URL}/rest/v1/sellers`, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get("user_id") === "user-123") {
      return HttpResponse.json([defaultSellerRecord], { status: 200 });
    }
    return HttpResponse.json([], { status: 200 });
  }),

  http.get(`${SUPABASE_URL}/rest/v1/orders`, () =>
    HttpResponse.json([], { status: 200 })
  ),

  http.get(`${SUPABASE_URL}/rest/v1/order_items`, () =>
    HttpResponse.json([], { status: 200 })
  ),

  http.get(`${SUPABASE_URL}/rest/v1/users`, () =>
    HttpResponse.json([], { status: 200 })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
