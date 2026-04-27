import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/server";
import { getSellerByUserId } from "@/lib/db/collections/sellers";
import { getDB } from "@/lib/mongodb";

export async function GET() {
  try {
    const user = await getServerUser();
    const userId = user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(userId);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller._id!.toString();
    const db = getDB();
    
    const accounts = await db
      .collection("game_accounts")
      .find({ seller_id: sellerId })
      .toArray();

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Seller game accounts get error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    const userId = user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(userId);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller._id!.toString();
    const body = await req.json().catch(() => ({}));

    const db = getDB();
    const now = new Date().toISOString();
    
    const doc = {
      seller_id: sellerId,
      is_active: true,
      created_at: now,
      updated_at: now,
      ...body,
    };

    const result = await db.collection("game_accounts").insertOne(doc);

    return NextResponse.json({ 
      account: { 
        id: result.insertedId.toString(),
        ...doc 
      } 
    }, { status: 201 });
  } catch (error) {
    console.error("Seller game accounts create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
