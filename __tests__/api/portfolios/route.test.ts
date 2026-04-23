import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/portfolios/route";

// ---------------------------------------------------------------------------
// Module-level mutable mock state — mirrors the working test pattern
// ---------------------------------------------------------------------------

const mockState = {
  // Supabase chain data per table
  sellersData: null as { id: string; user_id: string } | null,
  sellersError: null as { message: string } | null,
  portfoliosData: null as unknown[],
  portfoliosError: null as { message: string } | null,
  // Auth
  authUserId: "user-123" as string | null,
};

function buildChain(data: unknown, error: unknown) {
  const obj: Record<string, unknown> = {
    then: (res: (v: { data: unknown; error: unknown }) => void) => {
      setTimeout(() => res({ data, error }), 0);
      return obj;
    },
  };
  const methods = ["select", "eq", "neq", "order", "limit", "in", "single", "maybeSingle", "insert", "update"];
  for (const method of methods) {
    obj[method] = () => buildChain(data, error);
  }
  return obj;
}

vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "sellers") return buildChain(mockState.sellersData, mockState.sellersError);
      if (table === "portfolios") return buildChain(mockState.portfoliosData, mockState.portfoliosError);
      return buildChain(null, null);
    }),
  }),
}));

vi.mock("@/lib/auth/jwt", () => ({
  getBearerPayload: vi.fn().mockImplementation(() => {
    if (!mockState.authUserId) return Promise.resolve(null);
    return Promise.resolve({ userId: mockState.authUserId });
  }),
}));

// ---------------------------------------------------------------------------
// Request builder
// ---------------------------------------------------------------------------

function buildReq(
  url = "http://localhost/api/portfolios",
  method = "GET",
  authUserId: string | null = "user-123",
  body?: unknown
) {
  const headers = new Headers();
  if (authUserId) headers.set("authorization", "Bearer mock-token");
  const init: RequestInit = { headers, method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers.set("content-type", "application/json");
  }
  return new NextRequest(url, init);
}

// ---------------------------------------------------------------------------
// GET /api/portfolios
// ---------------------------------------------------------------------------

describe("GET /api/portfolios", () => {
  beforeEach(() => {
    // Reset to defaults
    mockState.sellersData = { id: "seller-001", user_id: "user-123" };
    mockState.sellersError = null;
    mockState.portfoliosData = [
      {
        id: "portfolio-001",
        seller_id: "seller-001",
        name: "My Gaming Portfolio",
        description: "Premium gaming accounts",
        image_url: "https://example.com/img1.jpg",
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "portfolio-002",
        seller_id: "seller-001",
        name: "Social Media Bundle",
        description: null,
        image_url: null,
        is_active: false,
        created_at: "2025-01-02T00:00:00Z",
        updated_at: "2025-01-02T00:00:00Z",
      },
    ];
    mockState.portfoliosError = null;
    mockState.authUserId = "user-123";
  });

  it("returns 200 with list of portfolios for the authenticated seller", async () => {
    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.portfolios).toBeInstanceOf(Array);
    expect(json.portfolios.length).toBe(2);
    expect(json.portfolios[0].id).toBe("portfolio-001");
    expect(json.portfolios[0].name).toBe("My Gaming Portfolio");
  });

  it("returns 401 when no auth token is present", async () => {
    mockState.authUserId = null;
    mockState.sellersData = null;

    const res = await GET(buildReq("http://localhost/api/portfolios", "GET", null));
    expect(res.status).toBe(401);
  });

  it("returns 404 when seller is not found in Supabase", async () => {
    mockState.sellersData = null;
    mockState.sellersError = { message: "Not found" };

    const res = await GET(buildReq());
    expect(res.status).toBe(404);
  });

  it("returns 200 with empty array when seller has no portfolios", async () => {
    mockState.portfoliosData = [];

    const res = await GET(buildReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.portfolios).toEqual([]);
  });

  it("returns 500 on Supabase error while fetching portfolios", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockState.portfoliosData = null;
    mockState.portfoliosError = { message: "DB error" };

    const res = await GET(buildReq());
    expect(res.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// POST /api/portfolios
// ---------------------------------------------------------------------------

describe("POST /api/portfolios", () => {
  beforeEach(() => {
    mockState.sellersData = { id: "seller-001", user_id: "user-123" };
    mockState.sellersError = null;
    mockState.portfoliosData = null;
    mockState.portfoliosError = null;
    mockState.authUserId = "user-123";
  });

  it("returns 201 with created portfolio", async () => {
    mockState.portfoliosData = {
      id: "portfolio-new",
      seller_id: "seller-001",
      name: "New Portfolio",
      description: "A fresh portfolio",
      image_url: "https://example.com/new.jpg",
      is_active: true,
      created_at: "2025-01-10T00:00:00Z",
      updated_at: "2025-01-10T00:00:00Z",
    };

    const res = await POST(
      buildReq("http://localhost/api/portfolios", "POST", "user-123", {
        name: "New Portfolio",
        description: "A fresh portfolio",
        image: "https://example.com/new.jpg",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.portfolio).toBeDefined();
    expect(json.portfolio.id).toBe("portfolio-new");
    expect(json.portfolio.name).toBe("New Portfolio");
  });

  it("returns 401 when not authenticated", async () => {
    mockState.authUserId = null;
    mockState.sellersData = null;

    const res = await POST(buildReq("http://localhost/api/portfolios", "POST", null, {}));
    expect(res.status).toBe(401);
  });

  it("returns 404 when seller not found", async () => {
    mockState.sellersData = null;
    mockState.sellersError = { message: "Not found" };

    const res = await POST(
      buildReq("http://localhost/api/portfolios", "POST", "user-123", { name: "New Portfolio" })
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when name is missing", async () => {
    const res = await POST(
      buildReq("http://localhost/api/portfolios", "POST", "user-123", { name: "" })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Name is required");
  });

  it("returns 400 when name is only whitespace", async () => {
    const res = await POST(
      buildReq("http://localhost/api/portfolios", "POST", "user-123", { name: "   " })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when Supabase insert fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockState.portfoliosData = null;
    mockState.portfoliosError = { message: "Insert failed" };

    const res = await POST(
      buildReq("http://localhost/api/portfolios", "POST", "user-123", { name: "New Portfolio" })
    );
    expect(res.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
