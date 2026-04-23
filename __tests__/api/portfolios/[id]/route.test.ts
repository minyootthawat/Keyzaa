import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "@/app/api/portfolios/[id]/route";

// ---------------------------------------------------------------------------
// Module-level mutable mock state
// ---------------------------------------------------------------------------

const mockState = {
  sellersData: null as { id: string; user_id: string } | null,
  sellersError: null as { message: string } | null,
  portfolioData: null as {
    id: string;
    seller_id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  } | null,
  portfolioError: null as { message: string } | null,
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

// Track whether .update() was called on the portfolio table chain
const updateWasCalledOnPortfolio = vi.hoisted(() => ({ value: false }));

vi.mock("@/lib/supabase/supabase", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "sellers") return buildChain(mockState.sellersData, mockState.sellersError);
      if (table === "portfolios") {
        updateWasCalledOnPortfolio.value = false;
        const chain = buildChain(mockState.portfolioData, mockState.portfolioError);
        (chain as Record<string, unknown>).update = () => {
          updateWasCalledOnPortfolio.value = true;
          return buildChain(null, mockState.portfolioError);
        };
        return chain;
      }
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
  url = "http://localhost/api/portfolios/portfolio-001",
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

type PortfolioRow = {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function makePortfolio(overrides: Partial<PortfolioRow> = {}): PortfolioRow {
  return {
    id: "portfolio-001",
    seller_id: "seller-001",
    name: "My Gaming Portfolio",
    description: "Premium gaming accounts",
    image_url: "https://example.com/img1.jpg",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// GET /api/portfolios/[id]
// ---------------------------------------------------------------------------

describe("GET /api/portfolios/[id]", () => {
  beforeEach(() => {
    mockState.sellersData = { id: "seller-001", user_id: "user-123" };
    mockState.sellersError = null;
    mockState.portfolioData = makePortfolio();
    mockState.portfolioError = null;
    mockState.authUserId = "user-123";
  });

  it("returns 200 with portfolio when found and owned by seller", async () => {
    const res = await GET(
      buildReq(),
      { params: Promise.resolve({ id: "portfolio-001" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.portfolio).toBeDefined();
    expect(json.portfolio.id).toBe("portfolio-001");
    expect(json.portfolio.name).toBe("My Gaming Portfolio");
  });

  it("returns 401 when not authenticated", async () => {
    mockState.authUserId = null;
    mockState.sellersData = null;

    const res = await GET(
      buildReq("http://localhost/api/portfolios/portfolio-001", "GET", null),
      { params: Promise.resolve({ id: "portfolio-001" }) }
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when seller not found", async () => {
    mockState.sellersData = null;
    mockState.sellersError = { message: "Not found" };

    const res = await GET(
      buildReq(),
      { params: Promise.resolve({ id: "portfolio-001" }) }
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when portfolio not found", async () => {
    mockState.portfolioData = null;
    mockState.portfolioError = { message: "Not found" };

    const res = await GET(
      buildReq(),
      { params: Promise.resolve({ id: "nonexistent" }) }
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when portfolio belongs to a different seller", async () => {
    mockState.portfolioData = makePortfolio({ id: "portfolio-other", seller_id: "seller-999" });

    const res = await GET(
      buildReq("http://localhost/api/portfolios/portfolio-other", "GET", "user-123"),
      { params: Promise.resolve({ id: "portfolio-other" }) }
    );
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/portfolios/[id]
// ---------------------------------------------------------------------------

describe("PUT /api/portfolios/[id]", () => {
  beforeEach(() => {
    mockState.sellersData = { id: "seller-001", user_id: "user-123" };
    mockState.sellersError = null;
    mockState.portfolioData = makePortfolio();
    mockState.portfolioError = null;
    mockState.authUserId = "user-123";
  });

  it("returns 200 with updated portfolio", async () => {
    mockState.portfolioData = makePortfolio({
      id: "portfolio-001",
      name: "Updated Portfolio Name",
      description: "Updated description",
      image_url: "https://example.com/updated.jpg",
      updated_at: "2025-01-02T00:00:00Z",
    });

    const res = await PUT(
      buildReq("http://localhost/api/portfolios/portfolio-001", "PUT", "user-123", {
        name: "Updated Portfolio Name",
        description: "Updated description",
        image: "https://example.com/updated.jpg",
      }),
      { params: Promise.resolve({ id: "portfolio-001" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.portfolio.name).toBe("Updated Portfolio Name");
  });

  it("returns 400 when name is empty string", async () => {
    const res = await PUT(
      buildReq("http://localhost/api/portfolios/portfolio-001", "PUT", "user-123", {
        name: "",
      }),
      { params: Promise.resolve({ id: "portfolio-001" }) }
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is only whitespace", async () => {
    const res = await PUT(
      buildReq("http://localhost/api/portfolios/portfolio-001", "PUT", "user-123", {
        name: "   ",
      }),
      { params: Promise.resolve({ id: "portfolio-001" }) }
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when portfolio belongs to different seller", async () => {
    mockState.portfolioData = makePortfolio({ id: "portfolio-other", seller_id: "seller-999" });

    const res = await PUT(
      buildReq("http://localhost/api/portfolios/portfolio-other", "PUT", "user-123", {
        name: "Hacked Name",
      }),
      { params: Promise.resolve({ id: "portfolio-other" }) }
    );
    expect(res.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    mockState.authUserId = null;
    mockState.sellersData = null;

    const res = await PUT(
      buildReq("http://localhost/api/portfolios/portfolio-001", "PUT", null, { name: "Test" }),
      { params: Promise.resolve({ id: "portfolio-001" }) }
    );
    expect(res.status).toBe(401);
  });

  it("returns 500 when Supabase update fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockState.portfolioData = null;
    mockState.portfolioError = { message: "Update failed" };

    const res = await PUT(
      buildReq("http://localhost/api/portfolios/portfolio-001", "PUT", "user-123", { name: "Updated" }),
      { params: Promise.resolve({ id: "portfolio-001" }) }
    );
    expect(res.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/portfolios/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/portfolios/[id]", () => {
  beforeEach(() => {
    mockState.sellersData = { id: "seller-001", user_id: "user-123" };
    mockState.sellersError = null;
    mockState.portfolioData = makePortfolio();
    mockState.portfolioError = null;
    mockState.authUserId = "user-123";
  });

  it("returns 204 when portfolio is deleted successfully", async () => {
    const res = await DELETE(
      buildReq("http://localhost/api/portfolios/portfolio-001", "DELETE", "user-123"),
      { params: Promise.resolve({ id: "portfolio-001" }) }
    );
    expect(res.status).toBe(204);
  });

  it("returns 403 when trying to delete another seller's portfolio", async () => {
    mockState.portfolioData = makePortfolio({ id: "portfolio-other", seller_id: "seller-999" });

    const res = await DELETE(
      buildReq("http://localhost/api/portfolios/portfolio-other", "DELETE", "user-123"),
      { params: Promise.resolve({ id: "portfolio-other" }) }
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 when portfolio not found", async () => {
    mockState.portfolioData = null;
    mockState.portfolioError = { message: "Not found" };

    const res = await DELETE(
      buildReq("http://localhost/api/portfolios/nonexistent", "DELETE", "user-123"),
      { params: Promise.resolve({ id: "nonexistent" }) }
    );
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    mockState.authUserId = null;
    mockState.sellersData = null;

    const res = await DELETE(
      buildReq("http://localhost/api/portfolios/portfolio-001", "DELETE", null),
      { params: Promise.resolve({ id: "portfolio-001" }) }
    );
    expect(res.status).toBe(401);
  });

  it("returns 500 when Supabase delete fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockState.portfolioData = null;
    mockState.portfolioError = { message: "Delete failed" };

    const res = await DELETE(
      buildReq("http://localhost/api/portfolios/portfolio-001", "DELETE", "user-123"),
      { params: Promise.resolve({ id: "portfolio-001" }) }
    );
    expect(res.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
