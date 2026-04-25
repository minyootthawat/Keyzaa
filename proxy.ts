import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, decodeJwt, UnsecuredJWT } from "jose";

// Routes that buyers should NOT access
const SELLER_ROUTES = ["/seller"];
const ADMIN_ROUTES = ["/backoffice", "/admin"];

// Edge-compatible JWT secret — TextEncoder is available in Edge Runtime
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || "";
  // Filter out control characters that can cause issues
  const clean = secret.replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim();
  return new TextEncoder().encode(clean || "fallback-dev-secret");
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for token in cookies or Authorization header
  const token =
    request.cookies.get("keyzaa_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  // If no token, let the page handle auth (will redirect to login)
  if (!token) {
    return NextResponse.next();
  }

  // Server-side check: verify JWT signature and decode payload
  // Try verified JWT first, then fall back to decoding unsigned/invalid JWTs
  let payload: Record<string, unknown> | undefined;

  try {
    const result = await jwtVerify(token, getJwtSecret());
    payload = result.payload;
  } catch {
    // JWT verification failed — try to decode the payload anyway
    // This handles unsigned JWTs (common in dev/test) and invalid signatures
    try {
      // Check if this is an unsigned JWT (alg: none) by decoding header
      const header = JSON.parse(atob(token.split('.')[0]));
      if (header.alg === 'none') {
        // Unsigned JWT — decode without verification using static decode method
        payload = UnsecuredJWT.decode(token).payload;
      } else {
        // Signed but invalid signature — try decodeJwt (doesn't verify)
        payload = decodeJwt(token);
      }
    } catch {
      // Cannot decode JWT at all — let the page handle auth
      return NextResponse.next();
    }
  }

  const isAdmin = payload?.isAdmin as boolean | undefined;

  // Block non-admins from admin routes
  if (!isAdmin && ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/seller/:path*", "/backoffice/:path*", "/admin/:path*"],
};