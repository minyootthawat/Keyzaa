import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getAdminAuditLog } from "@/lib/db/admin-db";

export async function GET(req: Request) {
  try {
    const access = await requireAdminPermission("admin:users:read");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("adminId") ?? undefined;
    const action = searchParams.get("action") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

    const logs = await getAdminAuditLog({
      adminId,
      action,
      dateFrom,
      dateTo,
      limit,
      offset,
    });

    return NextResponse.json({ logs, limit, offset });
  } catch (error) {
    console.error("Admin audit log GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
