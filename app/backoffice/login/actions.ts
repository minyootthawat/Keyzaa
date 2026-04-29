"use server";

import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findAdminByEmail } from "@/lib/db/supabase";
import { normalizeAdminPermissions, type AdminRole } from "@/lib/auth/admin";

const JWT_SECRET=*** TextEncoder().encode(
  (process.env.JWT_SECRET || "").replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim() || "fallback-dev-secret"
);

export async function adminLogin(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password required" };
  }

  try {
    const admin = await findAdminByEmail(email.toLowerCase());
    if (!admin) {
      return { error: "Invalid credentials" };
    }

    const passwordMatch = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatch) {
      return { error: "Invalid credentials" };
    }

    const adminPermissions = normalizeAdminPermissions(
      admin.role as AdminRole,
      admin.is_super_admin,
      admin.permissions ?? []
    );

    const token = await new SignJWT({
      id: String(admin.id),
      sub: String(admin.id),
      email: admin.email,
      isAdmin: true,
      adminRole: admin.role,
      adminPermissions,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });
    cookieStore.set("admin_refresh_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400 * 7,
      path: "/",
    });

    redirect("/backoffice/dashboard");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error && (error as { digest: string }).digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("[admin-login] error:", error);
    return { error: "Internal server error" };
  }
}
