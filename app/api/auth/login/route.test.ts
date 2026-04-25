import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as loginHandler } from "./route";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Global vi.mock for this file — allows per-test factory override.
// SignJWT must be instantiated as a class (new), not a plain object.
// ---------------------------------------------------------------------------
const mockUserData = {
  id: "user-123",
  name: "Test User",
  email: "test@keyzaa.com",
  role: "buyer",
  seller_id: null,
  created_at: "2025-01-01T00:00:00.000Z",
  password_hash: "hashed_password",
};

vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockImplementation(() => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: "seller-001" }, error: null }),
        }),
      }),
    }),
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function makeRequest(body: Record<string, unknown>) {
  const req = new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return loginHandler(req);
}

// ---------------------------------------------------------------------------
// Per-test mock helpers
// ---------------------------------------------------------------------------
function mockUser() {
  return {
    id: "user-123",
    name: "Test User",
    email: "test@keyzaa.com",
    role: "buyer",
    seller_id: null,
    created_at: "2025-01-01T00:00:00.000Z",
    password_hash: "hashed_password",
  };
}

function buildUserNotFoundChain() {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
        }),
      }),
    }),
  };
}

function buildUserFoundChain(user: ReturnType<typeof mockUser>) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: user, error: null }),
        }),
      }),
    }),
  };
}

function buildSellerChain(sellerRow = { id: "seller-001" }) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: sellerRow, error: null }),
        }),
      }),
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Get the mocked createServiceRoleClient from the top-level vi.mock
    // and reset it to the base null-state implementation
    const mod = await import("@/lib/supabase/supabase");
    const { createServiceRoleClient } = vi.mocked(mod);
    createServiceRoleClient.mockReset();
    createServiceRoleClient.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    }));
  });

  it("returns 400 when email is missing", async () => {
    const res = await makeRequest({ password: "password123" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Email and password are required");
  });

  it("returns 400 when password is missing", async () => {
    const res = await makeRequest({ email: "test@keyzaa.com" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Email and password are required");
  });

  it("returns 401 when user not found", async () => {
    const { createServiceRoleClient } = await import("@/lib/supabase/supabase");
    vi.mocked(createServiceRoleClient).mockReturnValue(buildUserNotFoundChain() as unknown as ReturnType<typeof createServiceRoleClient>);

    const res = await makeRequest({ email: "notfound@keyzaa.com", password: "password123" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("returns 401 when password is incorrect", async () => {
    const { createServiceRoleClient } = await import("@/lib/supabase/supabase");
    const user = mockUser();
    vi.mocked(createServiceRoleClient)
      .mockReturnValueOnce(buildUserFoundChain(user) as unknown as ReturnType<typeof createServiceRoleClient>)
      .mockReturnValueOnce(buildSellerChain() as unknown as ReturnType<typeof createServiceRoleClient>);

    // Use vi.spyOn to make bcrypt.compare mockable with .mockResolvedValue
    const bcrypt = await import("bcryptjs");
    vi.spyOn(bcrypt.default, "compare").mockResolvedValue(false);

    const res = await makeRequest({ email: "test@keyzaa.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("returns 200 with token and user on success", async () => {
    const user = mockUser();
    // Override mockImplementation for this specific test using the
    // vi.fn() returned by vi.mocked() from the top-level vi.mock
    const { createServiceRoleClient } = await import("@/lib/supabase/supabase");
    createServiceRoleClient
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: user, error: null }),
            }),
          }),
        }),
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: "seller-001" }, error: null }),
            }),
          }),
        }),
      }));

    const bcrypt = await import("bcryptjs");
    vi.spyOn(bcrypt.default, "compare").mockResolvedValue(true);

    const res = await makeRequest({ email: "test@keyzaa.com", password: "password123" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("token");
    expect(body.user).toMatchObject({
      id: "user-123",
      name: "Test User",
      email: "test@keyzaa.com",
      role: "buyer",
    });
  });

  it("returns 500 on DB connection failure", async () => {
    const { createServiceRoleClient } = await import("@/lib/supabase/supabase");
    vi.mocked(createServiceRoleClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error("DB connection failed")),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createServiceRoleClient>);

    const res = await makeRequest({ email: "test@keyzaa.com", password: "password123" });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
