import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as registerHandler } from "./route";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function makeRequest(body: Record<string, unknown>) {
  const req = new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return registerHandler(req);
}

// ---------------------------------------------------------------------------
// Per-test mock helpers
// ---------------------------------------------------------------------------
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

function buildUserFoundChain(existingUser: { id: string; email: string }) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: existingUser, error: null }),
        }),
      }),
    }),
  };
}

function buildInsertUserChain(newUser: Record<string, unknown>) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: newUser, error: null }),
        }),
      }),
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when name is missing", async () => {
    const res = await makeRequest({ email: "test@keyzaa.com", password: "password123" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Name, email, and password are required");
  });

  it("returns 400 when email is missing", async () => {
    const res = await makeRequest({ name: "Test User", password: "password123" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Name, email, and password are required");
  });

  it("returns 400 when password is missing", async () => {
    const res = await makeRequest({ name: "Test User", email: "test@keyzaa.com" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Name, email, and password are required");
  });

  it("returns 400 when password is shorter than 6 characters", async () => {
    const res = await makeRequest({ name: "Test User", email: "test@keyzaa.com", password: "12345" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Password must be at least 6 characters");
  });

  it("returns 409 when email already exists", async () => {
    const { createServiceRoleClient } = await import("@/lib/supabase/supabase");
    vi.mocked(createServiceRoleClient).mockReturnValue(
      buildUserFoundChain({ id: "existing-user", email: "test@keyzaa.com" }) as unknown as ReturnType<typeof createServiceRoleClient>
    );

    const res = await makeRequest({ name: "Test User", email: "test@keyzaa.com", password: "password123" });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Email already registered");
  });

  it("returns 200 with token and user on success", async () => {
    const { createServiceRoleClient } = await import("@/lib/supabase/supabase");
    const newUser = {
      id: "new-user-456",
      name: "Test User",
      email: "test@keyzaa.com",
      role: "buyer",
      seller_id: null,
      created_at: "2025-01-01T00:00:00.000Z",
    };
    vi.mocked(createServiceRoleClient).mockReturnValue(buildInsertUserChain(newUser) as unknown as ReturnType<typeof createServiceRoleClient>);

    const res = await makeRequest({ name: "Test User", email: "test@keyzaa.com", password: "password123" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("token");
    expect(body.user).toMatchObject({
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

    const res = await makeRequest({ name: "Test User", email: "test@keyzaa.com", password: "password123" });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
