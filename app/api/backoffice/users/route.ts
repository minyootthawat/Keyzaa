import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { listUsers, createUser } from "@/lib/db/collections/users";

export async function GET(req: Request) {
  try {
    const result = await getServerAdminAccess();
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
    const search = searchParams.get("search") ?? "";
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const { users, total } = await listUsers({
      search: search || undefined,
      role: role || undefined,
      status: status || undefined,
      limit,
      offset: (page - 1) * limit,
    });

    const mapped = users.map((u) => ({
      id: u._id?.toString() ?? "",
      email: u.email ?? "",
      name: u.name ?? "",
      phone: (u as unknown as Record<string, unknown>).phone ?? "",
      role: u.role ?? "buyer",
      status: (u as unknown as Record<string, unknown>).status ?? "active",
      createdAt: u.created_at,
    }));

    return NextResponse.json({ users: mapped, total, page, limit });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const result = await getServerAdminAccess();
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await req.json();
    const { email, name, phone, role } = body;

    if (!email || !name) {
      return NextResponse.json({ error: "email and name are required" }, { status: 400 });
    }

    const user = await createUser({
      email,
      name,
      role: role ?? "buyer",
    });

    return NextResponse.json({
      user: {
        id: user._id?.toString() ?? "",
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Admin users POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
