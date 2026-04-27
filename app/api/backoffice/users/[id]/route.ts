import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { findUserById, updateUser } from "@/lib/db/collections/users";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getServerAdminAccess();
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    const user = await findUserById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id?.toString() ?? "",
        email: user.email,
        name: user.name,
        role: user.role,
        status: (user as unknown as Record<string, unknown>).status ?? "active",
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Admin user GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getServerAdminAccess();
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    const { action } = await req.json();

    if (!action || !["ban", "unban"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const newStatus = action === "ban" ? "banned" : "active";

    const updated = await updateUser(id, { status: newStatus } as Partial<import("@/lib/db/collections/users").DbUser>);

    if (!updated) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: updated._id?.toString() ?? "",
        email: updated.email,
        name: updated.name,
        role: updated.role,
        status: (updated as unknown as Record<string, unknown>).status ?? newStatus,
      },
    });
  } catch (error) {
    console.error("Admin user PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getServerAdminAccess();
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    const { getDB } = await import("@/lib/mongodb");
    const db = getDB();
    const dbResult = await db.collection("users").deleteOne({ _id: new (await import("mongodb")).ObjectId(id) });

    if (dbResult.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
