import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import type { AdminRole } from "@/lib/auth/admin";
import { getAdmins, createAdmin, getAdminByUserId } from "@/lib/db/admin-db";

export async function GET() {
  try {
    const access = await requireAdminPermission("admin:users:read");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const admins = await getAdmins();
    return NextResponse.json({ admins });
  } catch (error) {
    console.error("Admin list GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const access = await requireAdminPermission("admin:users:write");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { userId, role } = await req.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const validRoles: AdminRole[] = ["super_admin", "ops_admin", "support_admin", "catalog_admin"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: "Valid role is required" }, { status: 400 });
    }

    const existing = await getAdminByUserId(userId);
    if (existing) {
      return NextResponse.json({ error: "User is already an admin" }, { status: 409 });
    }

    const admin = await createAdmin(userId, role, access.userId!);
    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    console.error("Admin create POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
