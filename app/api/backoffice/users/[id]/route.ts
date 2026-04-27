import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireAdminPermission("admin:users:write");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { action } = await req.json();
    if (!action || !["ban", "unban"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const newStatus = action === "ban" ? "banned" : "active";

    const { data, error } = await supabase
      .from("users")
      .update({ status: newStatus })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Supabase user update error:", error);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: data.id,
        email: data.email,
        name: data.full_name,
        role: data.role,
        status: data.status,
      },
    });
  } catch (error) {
    console.error("Admin user PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
