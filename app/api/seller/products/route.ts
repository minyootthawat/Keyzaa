import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";
import { getStaticProductsBySellerId } from "@/lib/marketplace-server";
import type { Product, ProductListingStatus } from "@/app/types";

function mapProduct(document: {
  _id?: { toString: () => string };
  productId?: string;
  title: string;
  nameTh: string;
  nameEn: string;
  image: string;
  price: number;
  originalPrice: number;
  discount: number;
  badge?: string;
  category: string;
  platform: string;
  sellerId: string;
  stock: number;
  soldCount: number;
  isActive: boolean;
  listingStatus?: ProductListingStatus;
  currency?: string;
  marketplaceType?: "seller_owned";
  regionCode?: string;
  regionLabelTh?: string;
  regionLabelEn?: string;
  deliverySlaMinutes?: number;
  deliveryLabelTh?: string;
  deliveryLabelEn?: string;
  activationMethodTh?: string;
  activationMethodEn?: string;
}): Product {
  return {
    id: document.productId || document._id?.toString() || "",
    title: document.title,
    nameTh: document.nameTh,
    nameEn: document.nameEn,
    image: document.image,
    price: document.price,
    originalPrice: document.originalPrice,
    discount: document.discount,
    badge: document.badge,
    category: document.category,
    platform: document.platform,
    sellerId: document.sellerId,
    stock: document.stock,
    soldCount: document.soldCount,
    isActive: document.isActive,
    listingStatus: document.listingStatus || "active",
    currency: document.currency || "THB",
    marketplaceType: document.marketplaceType || "seller_owned",
    regionCode: document.regionCode,
    regionLabelTh: document.regionLabelTh,
    regionLabelEn: document.regionLabelEn,
    deliverySlaMinutes: document.deliverySlaMinutes,
    deliveryLabelTh: document.deliveryLabelTh,
    deliveryLabelEn: document.deliveryLabelEn,
    activationMethodTh: document.activationMethodTh,
    activationMethodEn: document.activationMethodEn,
  };
}

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectDB();
    const users = db.collection("users");
    const products = db.collection("products");
    const user = await users.findOne({ _id: new ObjectId(userId) });
    const sellerId = typeof user?.sellerId === "string" ? user.sellerId : null;

    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const documents = await products.find({ sellerId }).sort({ createdAt: -1 }).toArray();
    const databaseProducts = documents.map((document) => mapProduct(document as never));
    const staticProducts = getStaticProductsBySellerId(sellerId);

    return NextResponse.json({
      products: [...databaseProducts, ...staticProducts],
    });
  } catch (error) {
    console.error("Seller products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectDB();
    const users = db.collection("users");
    const products = db.collection("products");
    const user = await users.findOne({ _id: new ObjectId(userId) });
    const sellerId = typeof user?.sellerId === "string" ? user.sellerId : null;

    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const body = (await req.json()) as Product;
    const now = new Date().toISOString();
    const productId = `prd_${Date.now()}`;

    const productDocument = {
      productId,
      title: body.title,
      nameTh: body.nameTh || body.title,
      nameEn: body.nameEn || body.title,
      image: body.image || "/products/rov.png",
      price: body.price,
      originalPrice: body.originalPrice,
      discount: body.discount,
      badge: body.badge,
      category: body.category,
      platform: body.platform,
      sellerId,
      stock: body.stock,
      soldCount: body.soldCount || 0,
      isActive: true,
      listingStatus: body.listingStatus || "active",
      currency: body.currency || "THB",
      marketplaceType: "seller_owned" as const,
      regionCode: body.regionCode,
      regionLabelTh: body.regionLabelTh,
      regionLabelEn: body.regionLabelEn,
      deliverySlaMinutes: body.deliverySlaMinutes,
      deliveryLabelTh: body.deliveryLabelTh,
      deliveryLabelEn: body.deliveryLabelEn,
      activationMethodTh: body.activationMethodTh,
      activationMethodEn: body.activationMethodEn,
      createdAt: now,
      updatedAt: now,
    };

    const result = await products.insertOne(productDocument);

    return NextResponse.json({
      product: mapProduct({
        _id: result.insertedId as never,
        ...productDocument,
      }),
    });
  } catch (error) {
    console.error("Seller product create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
