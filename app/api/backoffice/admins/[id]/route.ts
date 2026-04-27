import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import type { AdminRole } from "@/lib/auth/admin";
import { getAdmins, updateAdminRole, deleteAdmin } from "@/lib/db/admin-db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminPermission("admin:users:read");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;
    const admins = await getAdmins();
    const admin = admins.find((a) => a.id === id);

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({ admin });
  } catch (error) {
    console.error("Admin GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminPermission("admin:users:write");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;
    const { role } = await req.json();

    const validRoles: AdminRole[] = ["super_admin", "ops_admin", "support_admin", "catalog_admin"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: "Valid role is required" }, { status: 400 });
    }

    const admin = await updateAdminRole(id, role);
    return NextResponse.json({ admin });
  } catch (error) {
    console.error("Admin PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminPermission("admin:users:write");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;
    await deleteAdmin(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
