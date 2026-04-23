import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as loginHandler } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/mongodb", () => ({
  connectDB: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-jwt-token"),
  })),
}));

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
    const usersCollection = {
      findOne: vi.fn().mockResolvedValue(null),
    };
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockResolvedValueOnce({ db: { collection: () => usersCollection } });

    const res = await makeRequest({ email: "notfound@keyzaa.com", password: "password123" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("returns 401 when password is incorrect", async () => {
    const mockUser = {
      _id: { toString: () => "user-123" },
      name: "Test User",
      email: "test@keyzaa.com",
      role: "buyer",
      sellerId: undefined,
      createdAt: "2025-01-01T00:00:00.000Z",
      passwordHash: "hashed_password",
    };
    const usersCollection = {
      findOne: vi.fn().mockResolvedValue(mockUser),
    };
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockResolvedValueOnce({ db: { collection: () => usersCollection } });

    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(false as never);

    const res = await makeRequest({ email: "test@keyzaa.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("returns 200 with token and user on success", async () => {
    const mockUser = {
      _id: { toString: () => "user-123" },
      name: "Test User",
      email: "test@keyzaa.com",
      role: "buyer",
      sellerId: undefined,
      createdAt: "2025-01-01T00:00:00.000Z",
      passwordHash: "hashed_password",
    };
    const usersCollection = {
      findOne: vi.fn().mockResolvedValue(mockUser),
    };
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockResolvedValueOnce({ db: { collection: () => usersCollection } });

    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(true as never);

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
    const usersCollection = {
      findOne: vi.fn().mockRejectedValue(new Error("DB connection failed")),
    };
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockResolvedValueOnce({ db: { collection: () => usersCollection } });

    const res = await makeRequest({ email: "test@keyzaa.com", password: "password123" });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
