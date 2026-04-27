import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export async function GET(req: Request) {
  try {
    const access = await requireAdminPermission("admin:users:read");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
    const search = searchParams.get("search") ?? "";
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const supabase = createServiceRoleClient();
    let query = supabase
      .from("users")
      .select("id, email, name, phone, role, status, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }
    if (role) query = query.eq("role", role);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase users error:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    const users = (data ?? []).map((u: Record<string, unknown>) => ({
      id: u.id,
      email: u.email ?? "",
      name: u.name ?? "",
      phone: u.phone ?? "",
      role: u.role ?? "buyer",
      status: u.status ?? "active",
      createdAt: u.created_at,
    }));

    return NextResponse.json({ users, total: count ?? 0, page, limit });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
