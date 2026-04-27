import { ObjectId } from "mongodb";
import { getDB } from "@/lib/mongodb";

export interface DbLedgerEntry {
  _id?: ObjectId;
  seller_id: string;
  type: "sale" | "commission_fee" | "withdrawal";
  amount: number;
  order_id?: string;
  description?: string;
  created_at: string;
}

export async function getLedgerBySeller(sellerId: string): Promise<DbLedgerEntry[]> {
  const db = getDB();
  return db
    .collection<DbLedgerEntry>("seller_ledger_entries")
    .find({ seller_id: sellerId })
    .sort({ created_at: -1 })
    .toArray();
}

export async function createLedgerEntry(data: {
  sellerId: string;
  orderId?: string;
  amount: number;
  type: "sale" | "commission_fee" | "withdrawal";
  description?: string;
}): Promise<DbLedgerEntry> {
  const db = getDB();
  const doc: Omit<DbLedgerEntry, "_id"> = {
    seller_id: data.sellerId,
    order_id: data.orderId ?? undefined,
    amount: data.amount,
    type: data.type,
    description: data.description ?? undefined,
    created_at: new Date().toISOString(),
  };
  const result = await db
    .collection<DbLedgerEntry>("seller_ledger_entries")
    .insertOne(doc as DbLedgerEntry);
  return { ...doc, _id: result.insertedId } as DbLedgerEntry;
}
