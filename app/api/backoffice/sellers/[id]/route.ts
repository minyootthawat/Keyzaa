import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireAdminPermission("admin:sellers:write");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { action } = await req.json();
    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const verified = action === "approve";

    const { data, error } = await supabase
      .from("sellers")
      .update({ verified })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Supabase seller update error:", error);
      return NextResponse.json({ error: "Failed to update seller" }, { status: 500 });
    }

    return NextResponse.json({ seller: data });
  } catch (error) {
    console.error("Admin seller PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
