import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import type { AdminRole } from "@/lib/auth/admin";
import { getAdmins, createAdmin } from "@/lib/db/admin-db";
import { getAdminByEmail } from "@/lib/db/collections/admins";

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

    const { email, role } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const validRoles: AdminRole[] = ["super_admin", "ops_admin", "support_admin", "catalog_admin"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: "Valid role is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await getAdminByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json({ error: "User is already an admin" }, { status: 409 });
    }

    const admin = await createAdmin(normalizedEmail, role, access.userId!);
    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Admin create POST error:", message, { stack, error });
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 });
  }
}
