import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { findUserByEmail } from "@/lib/db/supabase";
import { findAdminByEmail } from "@/lib/db/supabase";
import { normalizeAdminPermissions, type AdminRole } from "@/lib/auth/admin";

const JWT_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET || "fallback-secret-key-for-dev").replace(/[\x00-\x1F\x7F-\x9F]/g, "")
);

interface TokenPayload {
  id: string;
  email: string;
  role?: string;
  sellerId?: string;
  isAdmin?: boolean;
  adminRole?: string;
  adminPermissions?: string[];
}

export async function GET(req: NextRequest) {
  let token = req.cookies.get("token")?.value;
  if (!token) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized", reason: "no_token" }, { status: 401 });
  }

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as unknown as TokenPayload;

    if (!payload.email) {
      return NextResponse.json({ error: "Unauthorized", reason: "no_email_in_token" }, { status: 401 });
    }

    let name = payload.email.split("@")[0];
    let adminRole = payload.adminRole ?? null;
    let adminPermissions = payload.adminPermissions ?? [];

    try {
      const user = await findUserByEmail(payload.email);
      if (user?.name) name = user.name;

      if (payload.isAdmin) {
        const admin = await findAdminByEmail(payload.email);
        if (admin) {
          adminRole = admin.role ?? adminRole;
          adminPermissions = normalizeAdminPermissions(
            admin.role as AdminRole,
            admin.is_super_admin,
            admin.permissions ?? []
          );
        }
      }
    } catch {
      // Supabase unavailable — use JWT payload as fallback
    }

    return NextResponse.json({
      user: {
        id: payload.id,
        name,
        email: payload.email,
        role: payload.role ?? "buyer",
        sellerId: payload.sellerId ?? null,
        isAdmin: payload.isAdmin ?? false,
        adminRole,
        adminPermissions,
        createdAt: "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized", reason: "jwt_verify_failed" }, { status: 401 });
  }
}
