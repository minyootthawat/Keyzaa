import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as registerHandler } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/mongodb", () => ({
  connectDB: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
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
  const req = new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return registerHandler(req);
}

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
    const usersCollection = {
      findOne: vi.fn().mockResolvedValue({ email: "test@keyzaa.com" }),
    };
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockResolvedValueOnce({ db: { collection: () => usersCollection } });

    const res = await makeRequest({ name: "Test User", email: "test@keyzaa.com", password: "password123" });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Email already registered");
  });

  it("returns 200 with token and user on success", async () => {
    const insertedId = { toString: () => "new-user-456" };
    const usersCollection = {
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue({ insertedId }),
    };
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockResolvedValueOnce({ db: { collection: () => usersCollection } });

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

  it("returns 500 on unexpected error", async () => {
    const usersCollection = {
      findOne: vi.fn().mockRejectedValue(new Error("DB connection failed")),
    };
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockResolvedValueOnce({ db: { collection: () => usersCollection } });

    const res = await makeRequest({ name: "Test User", email: "test@keyzaa.com", password: "password123" });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
