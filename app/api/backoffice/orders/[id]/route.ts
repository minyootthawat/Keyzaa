import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { getOrderById, updateOrderStatus, updateOrderFields } from "@/lib/db/collections/orders";

const VALID_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getServerAdminAccess(req);
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Admin order GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getServerAdminAccess(req);
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    const { action } = await req.json();

    if (action === "refund") {
      const updated = await updateOrderFields(id, {
        status: "cancelled",
        payment_status: "refunded",
      } as Partial<import("@/lib/db/collections/orders").DbOrder>);

      if (!updated) {
        return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
      }
      return NextResponse.json({ order: updated });
    }

    if (action && VALID_STATUSES.includes(action)) {
      const updated = await updateOrderStatus(id, action as "pending" | "paid" | "shipped" | "completed" | "cancelled");

      if (!updated) {
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
      }
      return NextResponse.json({ order: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin order PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
