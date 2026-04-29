import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { findAdminByEmail, findUserByEmail } from "@/lib/db/supabase";
import { normalizeAdminPermissions, type AdminRole } from "@/lib/auth/admin";

const JWT_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET || "")
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .trim() || "fallback-dev-secret"
);

export async function POST(request: NextRequest) {
  try {
    // Try refresh cookie first, then Authorization header
    let token = request.cookies.get("admin_refresh_token")?.value;
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No refresh token provided" },
        { status: 401 }
      );
    }

    // Verify current token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (!payload.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Invalid admin token" },
        { status: 401 }
      );
    }

    // ── Fetch fresh admin data from Supabase ───────────────────────────────
    const adminEmail = payload.email as string;
    const admin = await findAdminByEmail(adminEmail.toLowerCase());
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 401 }
      );
    }

    // Fetch user for name
    const user = await findUserByEmail(adminEmail.toLowerCase());
    const userName = user?.name || adminEmail.split("@")[0];

    const adminPermissions = normalizeAdminPermissions(
      admin.role as AdminRole,
      admin.is_super_admin,
      admin.permissions ?? []
    );

    // ── Issue new tokens ───────────────────────────────────────────────────
    const newAccessToken = await new SignJWT({
      id: admin.id,
      sub: admin.id,
      email: admin.email,
      isAdmin: true,
      adminRole: admin.role,
      adminPermissions,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(JWT_SECRET);

    const newRefreshToken = await new SignJWT({
      id: admin.id,
      sub: admin.id,
      email: admin.email,
      isAdmin: true,
      adminRole: admin.role,
      adminPermissions,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    const response = NextResponse.json(
      {
        success: true,
        token: newAccessToken,
        user: {
          id: admin.id,
          email: admin.email,
          name: userName,
          isAdmin: true,
          adminRole: admin.role,
          adminPermissions,
        },
      },
      { status: 200 }
    );

    // Set refreshed access token cookie (short-lived)
    response.cookies.set("admin_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    // Set new refresh token cookie (long-lived)
    response.cookies.set("admin_refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[admin-refresh] error:", error);
    return NextResponse.json(
      { success: false, error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
