import { NextResponse } from "next/server";
import { requireAdminPermission, ADMIN_ROLE_PERMISSIONS } from "@/lib/auth/admin";
import type { AdminRole } from "@/lib/auth/admin";

export async function GET() {
  try {
    const access = await requireAdminPermission("admin:users:read");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const rolePermissions: Record<AdminRole, string[]> = {} as Record<AdminRole, string[]>;
    for (const [role, permissions] of Object.entries(ADMIN_ROLE_PERMISSIONS)) {
      rolePermissions[role as AdminRole] = permissions;
    }

    return NextResponse.json({ rolePermissions });
  } catch (error) {
    console.error("Admin permissions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
