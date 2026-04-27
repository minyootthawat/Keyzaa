import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import {
  getIpAllowlist,
  addIpToAllowlist,
  removeIpFromAllowlist,
  toggleIpAllowlist,
} from "@/lib/db/admin-db";

export async function GET() {
  try {
    const access = await requireAdminPermission("admin:users:read");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const entries = await getIpAllowlist();
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("IP allowlist GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const access = await requireAdminPermission("admin:users:write");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { ip, label } = await req.json();

    if (!ip || typeof ip !== "string") {
      return NextResponse.json({ error: "ip is required" }, { status: 400 });
    }

    if (!label || typeof label !== "string") {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }

    const entry = await addIpToAllowlist(ip.trim(), label.trim(), access.userId!);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("IP allowlist POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const access = await requireAdminPermission("admin:users:write");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id, isActive } = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive is required" }, { status: 400 });
    }

    const entry = await toggleIpAllowlist(id, isActive);
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("IP allowlist PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const access = await requireAdminPermission("admin:users:write");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await removeIpFromAllowlist(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("IP allowlist DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
