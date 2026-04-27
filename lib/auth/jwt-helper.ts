/**
 * Decode custom JWT from request (cookie or Authorization header).
 * Use this for API routes that use the custom JWT cookie.
 */
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET || "").replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim() || "fallback-dev-secret"
);

export interface CustomTokenPayload {
  userId: string;
  email: string;
  sellerId?: string;
  isAdmin: boolean;
  adminRole?: string;
  adminPermissions: string[];
}

export async function getTokenPayload(req: NextRequest): Promise<CustomTokenPayload | null> {
  // Try cookie first, then Authorization header
  let token = req.cookies.get("token")?.value;
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as CustomTokenPayload;
  } catch {
    return null;
  }
}
