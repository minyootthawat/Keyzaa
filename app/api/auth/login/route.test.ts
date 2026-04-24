import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as loginHandler } from "./route";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------
// Mock: lib/supabase/supabase
// ---------------------------------------------------------------------
vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }),
      insert: vi.fn().mockReturnValue({ data: null, error: null }),
    }),
  }),
}));

// ---------------------------------------------------------------------
// Mock: bcryptjs
// ---------------------------------------------------------------------
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

// ---------------------------------------------------------------------
// Mock: jose
// ---------------------------------------------------------------------
vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-jwt-token"),
  })),
}));

// ---------------------------------------------------------------------
// Mock: lib/auth/admin
// ---------------------------------------------------------------------
vi.mock("@/lib/auth/admin", () => ({
  getAdminAccessForEmail: vi.fn().mockReturnValue({
    isAdmin: false,
    adminRole: null,
    permissions: [],
  }),
}));

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
async function makeRequest(body: Record<string, unknown>) {
  const req = new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return loginHandler(req);
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
        }),
      }),
    };
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);

    const res = await makeRequest({ email: "notfound@keyzaa.com", password: "password123" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("returns 401 when password is incorrect", async () => {
    const { createServiceRoleClient } = await import("@/lib/supabase/supabase");
    const mockUser = {
      id: "user-123",
      name: "Test User",
      email: "test@keyzaa.com",
      role: "buyer",
      seller_id: null,
      created_at: "2025-01-01T00:00:00.000Z",
      password_hash: "hashed_password",
    };
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        }),
      }),
    };
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);

    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.compare).mockResolvedValue(false);

    const res = await makeRequest({ email: "test@keyzaa.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("returns 200 with token and user on success", async () => {
    const { createServiceRoleClient } = await import("@/lib/supabase/supabase");
    const mockUser = {
      id: "user-123",
      name: "Test User",
      email: "test@keyzaa.com",
      role: "buyer",
      seller_id: null,
      created_at: "2025-01-01T00:00:00.000Z",
      password_hash: "hashed_password",
    };
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        }),
      }),
    };
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);

    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true);

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

  it("returns 500 on unexpected error", async () => {
    const { createServiceRoleClient } = await import("@/lib/supabase/supabase");
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockRejectedValue(new Error("DB connection failed")),
        }),
      }),
    };
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);

    const res = await makeRequest({ email: "test@keyzaa.com", password: "password123" });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
