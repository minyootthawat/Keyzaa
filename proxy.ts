import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

// Admin JWT secret (same as admin login route)
const jwtSecretValue = process.env.JWT_SECRET;
if (!jwtSecretValue) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = new TextEncoder().encode(
  jwtSecretValue.replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim()
);

/**
 * Verify admin JWT token and return payload if valid
 */
async function verifyAdminToken(token: string): Promise<{ isAdmin: boolean; adminRole?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.isAdmin) return null;
    return {
      isAdmin: true,
      adminRole: payload.adminRole as string | undefined,
    };
  } catch {
    return null;
  }
}

// Routes that buyers should NOT access (but /seller/register is allowed for unauthenticated)
const SELLER_PROTECTED_ROUTES = ["/seller"];
const SELLER_REGISTER_ROUTE = "/seller/register";
const ADMIN_ROUTES = ["/backoffice", "/admin"];

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 10 * 1000; // 10 seconds
const AUTH_RATE_LIMIT = 10; // requests per window for auth endpoints
const API_RATE_LIMIT = 30; // requests per window for other API routes

// In-memory rate limit store (Edge-compatible)
// For production with multiple instances, use Upstash Redis or similar
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
let requestCount = 0;
const CLEANUP_INTERVAL = 100; // Run cleanup every N requests
const ENTRY_TTL_MS = 60 * 1000; // Entries expire after 60 seconds

/**
 * Get client IP from request (handles proxies)
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

/**
 * Check rate limit and return rate limit response if exceeded
 * Returns null if within limits, or a NextResponse with 429 if exceeded
 */
function checkRateLimit(
  ip: string,
  endpoint: string,
  limit: number
): NextResponse | null {
  const now = Date.now();
  const key = `${ip}:${endpoint}`;

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // New window or expired entry
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (entry.count >= limit) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too Many Requests", message: "Rate limit exceeded. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(entry.resetAt),
        }
      }
    );
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  // Periodic cleanup: remove expired entries every CLEANUP_INTERVAL requests
  requestCount++;
  if (requestCount >= CLEANUP_INTERVAL) {
    requestCount = 0;
    const now = Date.now();
    for (const [k, v] of rateLimitStore.entries()) {
      if (now - v.resetAt > ENTRY_TTL_MS) {
        rateLimitStore.delete(k);
      }
    }
  }

  return null;
}

/**
 * Check if an endpoint matches any of the given patterns
 */
function matchesEndpoint(pathname: string, patterns: (string | RegExp)[]): boolean {
  return patterns.some((pattern) => {
    if (typeof pattern === "string") {
      return pathname === pattern || pathname.startsWith(`${pattern}/`);
    }
    return pattern.test(pathname);
  });
}

/**
 * Check if the user is a registered seller by querying the sellers table.
 * Uses the service role client for server-side Edge runtime access.
 */
async function isRegisteredSeller(userId: string): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Protected API routes for rate limiting
const AUTH_ROUTES = [
  "/api/auth/callback",
  "/api/auth/login",
  "/api/auth/register",
];
const STRIPE_ROUTES = [
  "/api/stripe/checkout",
  "/api/stripe/webhook",
];

export const proxy = auth(async function (request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to API routes
  if (pathname.startsWith("/api/")) {
    const clientIP = getClientIP(request);

    // Determine rate limit based on endpoint type
    let rateLimit = API_RATE_LIMIT;

    if (matchesEndpoint(pathname, AUTH_ROUTES.map(r => new RegExp(`^${r}`)))) {
      rateLimit = AUTH_RATE_LIMIT;
    } else if (matchesEndpoint(pathname, STRIPE_ROUTES.map(r => new RegExp(`^${r}`)))) {
      rateLimit = AUTH_RATE_LIMIT; // Stripe endpoints use auth rate limit
    }

    const rateLimitResponse = checkRateLimit(clientIP, pathname, rateLimit);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  const session = await auth();
  const user = session?.user;
  const userId = user?.id;
  const isAdminFromSession = user?.isAdmin ?? false;

  // Check admin JWT token from cookie OR Authorization header for backoffice access
  // Admin auth is separate from NextAuth buyer session
  const adminToken =
    request.cookies.get("admin_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  let isAdminFromToken = false;
  if (adminToken) {
    const adminPayload = await verifyAdminToken(adminToken);
    isAdminFromToken = adminPayload?.isAdmin ?? false;
  }
  const isAdmin = isAdminFromSession || isAdminFromToken;

  // Block non-admins from backoffice pages — redirect to admin login
  // But allow /backoffice/login through so users can actually log in
  // EXCLUDE /api/admin/* routes — admin auth uses separate JWT system, not NextAuth buyer session
  const isApiAdminRoute = pathname.startsWith("/api/admin/");
  if (
    !isApiAdminRoute &&
    !isAdmin &&
    (pathname.startsWith("/backoffice") || pathname.startsWith("/admin")) &&
    pathname !== "/backoffice/login"
  ) {
    return NextResponse.redirect(new URL("/backoffice/login", request.url));
  }

  // Check if this is a seller-protected route (not the register page)
  const isSellerRoute = SELLER_PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isRegisterRoute =
    pathname === SELLER_REGISTER_ROUTE ||
    pathname.startsWith(`${SELLER_REGISTER_ROUTE}/`);

  // Step 3: /seller/register — must be logged in first (step 1)
  if (isRegisterRoute) {
    if (!userId) {
      // Not authenticated → go to sign-in (step 1 required first)
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Authenticated → allow through (will check if already registered seller below)
    return NextResponse.next();
  }

  // Unauthenticated user trying to access seller route → redirect to sign-in
  if (isSellerRoute && !userId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Authenticated user accessing seller route → verify seller registration
  if (isSellerRoute && userId) {
    // Verify the user is actually a registered seller
    const hasSellerAccess = await isRegisteredSeller(userId);

    if (!hasSellerAccess) {
      // Not a registered seller → redirect to registration (step 3)
      return NextResponse.redirect(new URL("/seller/register", request.url));
    }
  }

  return NextResponse.next();
});

export const proxyConfig = {
  matcher: [
    "/seller/:path*",
    "/backoffice/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};
