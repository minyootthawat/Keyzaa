import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { getProductById, updateProduct, deleteProduct } from "@/lib/db/collections/products";
import { getDB } from "@/lib/mongodb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getServerAdminAccess();
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        id: product._id?.toString() ?? "",
        sellerId: product.seller_id,
        name: product.name,
        price: Number(product.price),
        isActive: product.is_active,
        stockQuantity: product.stock ?? 0,
        createdAt: product.created_at,
      },
    });
  } catch (error) {
    console.error("Admin product GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await getServerAdminAccess();
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = {};

    if (body.isActive !== undefined) {
      updates.is_active = Boolean(body.isActive);
    } else if (body.action === "enable") {
      updates.is_active = true;
    } else if (body.action === "disable") {
      updates.is_active = false;
    }

    if (typeof body.price === "number" && body.price >= 0) {
      updates.price = body.price;
    }

    if (typeof body.stockQuantity === "number" && body.stockQuantity >= 0) {
      updates.stock = body.stockQuantity;
    } else if (typeof body.stock === "number" && body.stock >= 0) {
      updates.stock = body.stock;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await updateProduct(id, updates);

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        id: updated._id?.toString() ?? "",
        sellerId: updated.seller_id,
        name: updated.name,
        price: Number(updated.price),
        isActive: updated.is_active,
        stockQuantity: updated.stock ?? 0,
        createdAt: updated.created_at,
      },
    });
  } catch (error) {
    console.error("Admin product PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await getServerAdminAccess();
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (result.access?.adminRole !== "super_admin") {
      return NextResponse.json(
        { error: "Only super_admin can delete products" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const db = getDB();

    const orderCount = await db.collection("orders").countDocuments({ "items.product_id": id });

    if (orderCount > 0) {
      return NextResponse.json(
        { error: `Product has ${orderCount} existing order(s). Cannot delete.`, orderCount },
        { status: 409 }
      );
    }

    const deleted = await deleteProduct(id);

    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Admin product DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
