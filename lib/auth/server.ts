/**
 * Server-side auth helpers.
 * Use these in API route handlers - NOT in client components.
 *
 * For client components, use useSession() from next-auth/react.
 * For server components, use auth() from @/auth directly.
 *
 * IMPORTANT: This module reads the custom JWT cookie set by /api/auth/login,
 * NOT NextAuth's session. All API routes should use these helpers.
 */

import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getAdminAccessForEmail } from "@/lib/auth/admin";
import type { AdminAccess } from "@/lib/auth/admin";
import { getSellerByUserId } from "@/lib/db/collections/sellers";

const JWT_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET || "").replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim() || "fallback-dev-secret"
);

export type { AdminAccess };

export interface TokenUser {
  id: string;
  email: string;
  sellerId?: string;
  isAdmin: boolean;
  adminRole?: string;
  adminPermissions: string[];
}

/**
 * Extract and verify the custom JWT from request cookies.
 * Returns the decoded payload or null if not authenticated.
 */
async function getTokenFromRequest(req: NextRequest): Promise<TokenUser | null> {
  // Check admin_token first (set by /api/admin/login), then token (set by /api/auth/login for buyer/seller)
  const bearerToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const cookieToken = req.cookies.get("admin_token")?.value ?? req.cookies.get("token")?.value;
  const token = bearerToken ?? cookieToken;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenUser;
  } catch {
    return null;
  }
}

/**
 * Get the current user from the custom JWT cookie.
 * Returns null if no request context is available.
 */
export async function getServerUser(req: NextRequest): Promise<TokenUser | null> {
  return getTokenFromRequest(req);
}

/**
 * Get admin access from the current request's JWT.
 * Accepts NextRequest as optional parameter (for backward compat, falls back to reading from global if available).
 */
export async function getServerAdminAccess(req?: NextRequest): Promise<{
  status: number;
  error?: string;
  access?: AdminAccess;
  userId?: string;
}> {
  const user = await getTokenFromRequest(req as NextRequest);

  if (!user) {
    return { status: 401, error: "Unauthorized" };
  }

  if (!user.isAdmin) {
    return { status: 403, error: "Forbidden" };
  }

  const access = await getAdminAccessForEmail(user.email);
  if (!access.isAdmin) {
    return { status: 403, error: "Forbidden" };
  }

  return {
    status: 200,
    access,
    userId: user.id,
  };
}

/**
 * Get seller access from the current request's JWT.
 */
export async function getServerSellerAccess(req: NextRequest): Promise<{
  status: number;
  error?: string;
  access?: { userId: string; sellerId: string; isVerified: boolean };
}> {
  const user = await getTokenFromRequest(req);

  if (!user) {
    return { status: 401, error: "Unauthorized" };
  }

  if (!user.sellerId) {
    return { status: 404, error: "Seller not found" };
  }

  const userId = user.id;
  const seller = await getSellerByUserId(userId);
  if (!seller) {
    return { status: 404, error: "Seller not found" };
  }

  return {
    status: 200,
    access: {
      userId,
      sellerId: seller.id,
      isVerified: seller.is_verified,
    },
  };
}
