import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";
import { calculateWalletSummary } from "@/lib/marketplace-server";
import type { SellerLedgerEntry } from "@/app/types";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectDB();
    const users = db.collection("users");
    const ledgerEntries = db.collection("seller_ledger_entries");
    const user = await users.findOne({ _id: new ObjectId(userId) });
    const sellerId = typeof user?.sellerId === "string" ? user.sellerId : null;

    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const entries = await ledgerEntries.find({ sellerId }).sort({ createdAt: -1 }).toArray();
    const mappedEntries: SellerLedgerEntry[] = entries.map((entry) => ({
      id: entry._id.toString(),
      sellerId: entry.sellerId as string,
      orderId: entry.orderId as string | undefined,
      type: entry.type as SellerLedgerEntry["type"],
      amount: entry.amount as number,
      currency: entry.currency as string,
      createdAt: entry.createdAt as string,
      description: entry.description as string,
      metadata: entry.metadata as SellerLedgerEntry["metadata"],
    }));

    return NextResponse.json({
      summary: calculateWalletSummary(mappedEntries),
      entries: mappedEntries,
    });
  } catch (error) {
    console.error("Seller wallet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
