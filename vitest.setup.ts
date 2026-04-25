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
  SignJWT: class {
    setProtectedHeader = vi.fn().mockReturnThis();
    setIssuedAt = vi.fn().mockReturnThis();
    setExpirationTime = vi.fn().mockReturnThis();
    sign = vi.fn().mockResolvedValue("mock-jwt-token");
  },
}));

// ---------------------------------------------------------------------------
// Mock @/lib/supabase/supabase — global fallback + base mock for all tests.
// Tests override per-call using vi.mocked(createServiceRoleClient).mockReturnValueOnce()
// inside each test. The vi.fn() wrapper allows per-test mockReturnValueOnce() calls.
// ---------------------------------------------------------------------------
vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  }),
  createServerClientSupabase: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  }),
}));

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
