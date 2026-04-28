import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getBearerPayload } from "@/lib/auth/jwt";
import { findUserById, findUserByEmail } from "@/lib/db/collections/users";
import { getAdminByEmail } from "@/lib/db/collections/admins";
import { auth } from "@/auth";

const JWT_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET || "").replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim() || "fallback-dev-secret"
);

export interface AdminRecord {
  id: string;
  userId: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
}

/**
 * Verify admin credentials against Supabase admins table.
 * The password_hash is stored on the linked user record.
 */
export async function verifyAdminPassword(
  email: string,
  password: string
): Promise<AdminRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const dbAdmin = await getAdminByEmail(normalizedEmail);

  console.log("[verifyAdminPassword] email:", normalizedEmail, "-> dbAdmin:", dbAdmin ? { id: dbAdmin.id, email: dbAdmin.email } : "NOT FOUND");

  if (!dbAdmin) {
    return null;
  }

  const dbUser = await findUserByEmail(normalizedEmail);
  const hash = dbUser?.password_hash;

  if (!hash) {
    console.log("[verifyAdminPassword] user has no password_hash");
    return null;
  }

  const match = await bcrypt.compare(password, hash);
  console.log("[verifyAdminPassword] bcrypt match:", match);

  if (!match) {
    return null;
  }

  return {
    id: dbAdmin.user_id ?? dbAdmin.id,
    userId: dbAdmin.user_id ?? dbAdmin.id,
    email: dbAdmin.email,
    role: (dbAdmin.role ?? "super_admin") as AdminRole,
    permissions: normalizeAdminPermissions(
      (dbAdmin.role ?? "super_admin") as AdminRole,
      dbAdmin.is_super_admin,
      dbAdmin.permissions ?? []
    ),
  };
}

export type AdminRole = "super_admin" | "ops_admin" | "support_admin" | "catalog_admin";

export type AdminPermission =
  | "admin:access"
  | "admin:overview:read"
  | "admin:orders:read"
  | "admin:orders:write"
  | "admin:sellers:read"
  | "admin:sellers:write"
  | "admin:products:read"
  | "admin:products:write"
  | "admin:analytics:read"
  | "admin:settings:write"
  | "admin:listings:read"
  | "admin:users:read"
  | "admin:users:write";

export interface AdminAccess {
  isAdmin: boolean;
  adminRole: AdminRole | null;
  permissions: AdminPermission[];
}

const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  "admin:access",
  "admin:overview:read",
  "admin:orders:read",
  "admin:orders:write",
  "admin:sellers:read",
  "admin:sellers:write",
  "admin:products:read",
  "admin:products:write",
  "admin:analytics:read",
  "admin:settings:write",
  "admin:listings:read",
  "admin:users:read",
  "admin:users:write",
];

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: ALL_ADMIN_PERMISSIONS,
  ops_admin: [
    "admin:access",
    "admin:overview:read",
    "admin:orders:read",
    "admin:orders:write",
    "admin:sellers:read",
    "admin:sellers:write",
    "admin:products:read",
    "admin:products:write",
    "admin:analytics:read",
    "admin:users:read",
    "admin:users:write",
  ],
  support_admin: [
    "admin:access",
    "admin:orders:read",
    "admin:sellers:read",
    "admin:sellers:write",
    "admin:users:read",
  ],
  catalog_admin: [
    "admin:access",
    "admin:overview:read",
    "admin:products:read",
    "admin:products:write",
    "admin:listings:read",
  ],
};

const LEGACY_ADMIN_PERMISSION_MAP: Record<string, AdminPermission[]> = {
  "admin:users": ["admin:users:read", "admin:users:write"],
  "admin:products": ["admin:products:read", "admin:products:write", "admin:listings:read"],
  "admin:orders": ["admin:orders:read", "admin:orders:write"],
  "admin:settings": ["admin:settings:write"],
  "admin:analytics": ["admin:analytics:read"],
  "admin:support": ["admin:orders:read", "admin:sellers:read", "admin:users:read"],
};

export function normalizeAdminPermissions(
  role: AdminRole,
  isSuperAdmin: boolean,
  permissions: string[]
): AdminPermission[] {
  if (isSuperAdmin || role === "super_admin") {
    return ADMIN_ROLE_PERMISSIONS.super_admin;
  }

  const normalized = new Set<AdminPermission>();
  for (const permission of permissions) {
    if (permission in LEGACY_ADMIN_PERMISSION_MAP) {
      for (const mappedPermission of LEGACY_ADMIN_PERMISSION_MAP[permission]) {
        normalized.add(mappedPermission);
      }
      continue;
    }

    if ((ALL_ADMIN_PERMISSIONS as string[]).includes(permission)) {
      normalized.add(permission as AdminPermission);
    }
  }

  if (normalized.size === 0) {
    for (const permission of ADMIN_ROLE_PERMISSIONS[role] ?? ["admin:access"]) {
      normalized.add(permission);
    }
  }

  normalized.add("admin:access");
  return [...normalized];
}

export async function getAdminAccessForEmail(email: string | null | undefined): Promise<AdminAccess> {
  if (!email) {
    return { isAdmin: false, adminRole: null, permissions: [] };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check Supabase admins table
  try {
    const dbAdmin = await getAdminByEmail(normalizedEmail);
    if (dbAdmin) {
      return {
        isAdmin: true,
        adminRole: dbAdmin.role as AdminRole,
        permissions: normalizeAdminPermissions(
          dbAdmin.role as AdminRole,
          dbAdmin.is_super_admin,
          dbAdmin.permissions ?? []
        ),
      };
    }
  } catch (error) {
    console.error("[getAdminAccessForEmail] Supabase error:", error);
    // Supabase unavailable — deny access (no env fallback in production)
  }

  return { isAdmin: false, adminRole: null, permissions: [] };
}

export function hasAdminPermission(access: AdminAccess, permission: AdminPermission) {
  return access.isAdmin && access.permissions.includes(permission);
}

export async function requireAdminPermission(permission: AdminPermission): Promise<{
  status: number;
  error?: string;
  access?: AdminAccess;
  userId?: string;
}> {
  const result = await getAdminAccessFromSession();
  if (result.status !== 200) return result;

  if (!hasAdminPermission(result.access!, permission)) {
    return { status: 403, error: `Missing permission: ${permission}` };
  }

  return result;
}

async function getAdminAccessFromCookie(): Promise<{
  status: number;
  error?: string;
  access?: AdminAccess;
  userId?: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return { status: 401, error: "Unauthorized" };
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const isAdmin = payload.isAdmin === true;
    const email = typeof payload.email === "string" ? payload.email : null;
    const userId =
      typeof payload.id === "string"
        ? payload.id
        : typeof payload.sub === "string"
          ? payload.sub
          : null;

    if (!isAdmin || !email || !userId) {
      return { status: 401, error: "Unauthorized" };
    }

    const access = await getAdminAccessForEmail(email);
    if (!access.isAdmin) {
      return { status: 403, error: "Forbidden" };
    }

    return {
      status: 200,
      access,
      userId,
    };
  } catch {
    return { status: 401, error: "Unauthorized" };
  }
}

export async function getAdminAccessFromRequest(req: NextRequest): Promise<{
  status: number;
  error?: string;
  access?: AdminAccess;
  userId?: string;
}> {
  const payload = await getBearerPayload(req);
  const userId = typeof payload?.userId === "string" ? payload.userId : null;

  if (!userId) {
    return { status: 401, error: "Unauthorized" };
  }

  const user = await findUserById(userId);
  if (!user) {
    return { status: 404, error: "User not found" };
  }

  const access = await getAdminAccessForEmail(user.email);
  if (!access.isAdmin) {
    return { status: 403, error: "Forbidden" };
  }

  return {
    status: 200,
    access,
    userId,
  };
}

export async function getAdminAccessFromSession(): Promise<{
  status: number;
  error?: string;
  access?: AdminAccess;
  userId?: string;
}> {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return getAdminAccessFromCookie();
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
