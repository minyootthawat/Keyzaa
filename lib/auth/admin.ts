import type { NextRequest } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { findUserById } from "@/lib/db/supabase";

export type AdminRole = "super_admin" | "ops_admin" | "support_admin" | "catalog_admin";

export type AdminPermission =
  | "admin:access"
  | "admin:overview:read"
  | "admin:orders:read"
  | "admin:sellers:read"
  | "admin:listings:read";

export interface AdminAccess {
  isAdmin: boolean;
  adminRole: AdminRole | null;
  permissions: AdminPermission[];
}

const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  "admin:access",
  "admin:overview:read",
  "admin:orders:read",
  "admin:sellers:read",
  "admin:listings:read",
];

const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: ALL_ADMIN_PERMISSIONS,
  ops_admin: ["admin:access", "admin:overview:read", "admin:orders:read", "admin:sellers:read"],
  support_admin: ["admin:access", "admin:orders:read", "admin:sellers:read"],
  catalog_admin: ["admin:access", "admin:overview:read", "admin:listings:read"],
};

function parseEmailRoleMap() {
  const configured = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";

  return configured
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [emailPart, rolePart] = entry.split(":");
      const email = emailPart?.trim().toLowerCase();
      const role = (rolePart?.trim() as AdminRole | undefined) || "super_admin";

      return email && role in ADMIN_ROLE_PERMISSIONS ? { email, role } : null;
    })
    .filter((entry): entry is { email: string; role: AdminRole } => Boolean(entry));
}

export function getAdminAccessForEmail(email: string | null | undefined): AdminAccess {
  if (!email) {
    return { isAdmin: false, adminRole: null, permissions: [] };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const configuredAdmin = parseEmailRoleMap().find((entry) => entry.email === normalizedEmail);

  if (!configuredAdmin) {
    return { isAdmin: false, adminRole: null, permissions: [] };
  }

  const permissions = ADMIN_ROLE_PERMISSIONS[configuredAdmin.role];
  return {
    isAdmin: true,
    adminRole: configuredAdmin.role,
    permissions,
  };
}

export function hasAdminPermission(access: AdminAccess, permission: AdminPermission) {
  return access.isAdmin && access.permissions.includes(permission);
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

  const access = getAdminAccessForEmail(user.email);
  if (!access.isAdmin) {
    return { status: 403, error: "Forbidden" };
  }

  return {
    status: 200,
    access,
    userId,
  };
}
