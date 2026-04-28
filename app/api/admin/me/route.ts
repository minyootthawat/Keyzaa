import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { auth } from "@/auth";
import { getAdminByEmail } from "@/lib/db/collections/admins";
import { normalizeAdminPermissions, type AdminRole } from "@/lib/auth/admin";

const JWT_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET || "").replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim() || "fallback-dev-secret"
);

export async function GET(request: NextRequest) {
  try {
    // 1. Try admin_token cookie/header first (Legacy/Direct Admin Login)
    let token = request.cookies.get("admin_token")?.value;
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.isAdmin) {
          let adminPermissions = payload.adminPermissions;
          let adminRole = payload.adminRole;

          if (typeof payload.email === "string") {
            try {
              const admin = await getAdminByEmail(payload.email);
              if (admin) {
                adminRole = admin.role;
                adminPermissions = normalizeAdminPermissions(
                  admin.role as AdminRole,
                  admin.is_super_admin,
                  admin.permissions ?? []
                );
              }
            } catch {
              // Fall back to token payload.
            }
          }

          return NextResponse.json({
            authenticated: true,
            user: {
              id: payload.sub,
              email: payload.email,
              isAdmin: true,
              adminRole,
              adminPermissions,
            },
          });
        }
      } catch {
        // Token invalid, fallback to session check
      }
    }

    // 2. Try NextAuth session (Home Page / Buyer-to-Admin Login)
    const session = await auth();
    if (session?.user?.isAdmin) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          isAdmin: true,
          adminRole: session.user.adminRole,
          adminPermissions: session.user.adminPermissions,
        },
      });
    }

    return NextResponse.json({ authenticated: false, user: null });
  } catch (error) {
    console.error("[api-admin-me] error:", error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
