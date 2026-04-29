import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/server";
import { getSellerByUserId } from "@/lib/db/collections/sellers";
import { getProductById, updateProduct, deleteProduct } from "@/lib/db/collections/products";

function mapRowToProduct(row: { id: string; seller_id: string; name: string; description?: string | null; category: string; price: number; stock: number; image_url?: string | null; status: "active" | "inactive" | "out_of_stock" | "deleted" }) {
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.name,
    nameTh: row.name,
    nameEn: row.name,
    descriptionTh: row.description || "",
    descriptionEn: row.description || "",
    shortDescriptionTh: row.description || "",
    shortDescriptionEn: row.description || "",
    category: row.category,
    platform: "",
    price: Number(row.price),
    originalPrice: Number(row.price),
    discount: 0,
    stock: row.stock,
    soldCount: 0,
    image: row.image_url || "",
    isActive: row.status === "active",
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getServerUser(req);
    const userId = user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(userId);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    if (seller.status !== "active") {
      return NextResponse.json({ error: "Seller account is not active" }, { status: 403 });
    }

    const sellerId = seller.id;

    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.seller_id !== sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ product: mapRowToProduct(product) });
  } catch (error) {
    console.error("Seller product get error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getServerUser(req);
    const userId = user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(userId);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    if (seller.status !== "active") {
      return NextResponse.json({ error: "Seller account is not active" }, { status: 403 });
    }

    const sellerId = seller.id;

    const existing = await getProductById(id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (existing.seller_id !== sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description === "" ? undefined : body.description;
    }

    if (body.category !== undefined) {
      if (typeof body.category !== "string" || body.category.trim() === "") {
        return NextResponse.json({ error: "Category cannot be empty" }, { status: 400 });
      }
      updates.category = body.category.trim();
    }

    if (body.price !== undefined) {
      if (typeof body.price !== "number" || body.price <= 0) {
        return NextResponse.json({ error: "Price must be a number greater than 0" }, { status: 400 });
      }
      updates.price = body.price;
    }

    if (body.stock !== undefined) {
      if (typeof body.stock !== "number" || body.stock < 0) {
        return NextResponse.json({ error: "Stock must be a number of 0 or greater" }, { status: 400 });
      }
      updates.stock = body.stock;
    }

    if (body.image !== undefined) {
      updates.image_url = body.image === "" ? undefined : body.image;
    }

    if (body.listingStatus !== undefined) {
      updates.status = body.listingStatus;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await updateProduct(id, updates);

    if (!updated) {
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }

    return NextResponse.json({ product: mapRowToProduct(updated) });
  } catch (error) {
    console.error("Seller product update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getServerUser(req);
    const userId = user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(userId);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    if (seller.status !== "active") {
      return NextResponse.json({ error: "Seller account is not active" }, { status: 403 });
    }

    const sellerId = seller.id;

    const existing = await getProductById(id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (existing.seller_id !== sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete by setting status to deleted
    await updateProduct(id, { status: "deleted" });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Seller product delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
