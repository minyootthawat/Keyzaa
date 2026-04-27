import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

const VALID_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireAdminPermission("admin:orders:write");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { action } = await req.json();

    const supabase = createServiceRoleClient();

    if (action === "refund") {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: "cancelled", payment_status: "refunded" })
        .eq("id", id)
        .select()
        .single();

      if (error || !data) {
        console.error("Supabase refund error:", error);
        return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
      }
      return NextResponse.json({ order: data });
    }

    if (action && VALID_STATUSES.includes(action)) {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: action })
        .eq("id", id)
        .select()
        .single();

      if (error || !data) {
        console.error("Supabase order update error:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
      }
      return NextResponse.json({ order: data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin order PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
