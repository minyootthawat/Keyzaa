import { ObjectId } from "mongodb";
import { getDB } from "@/lib/mongodb";

export interface DbSeller {
  _id?: ObjectId;
  user_id: string;
  store_name: string;
  phone?: string;
  id_card_url?: string;
  verified: boolean;
  rating: number;
  sales_count: number;
  balance: number;
  pending_balance: number;
  payout_status: "manual" | "enabled";
  response_time_minutes: number;
  fulfillment_rate: number;
  dispute_rate: number;
  created_at: string;
  updated_at: string;
}

export async function getSellerByUserId(userId: string): Promise<DbSeller | null> {
  const db = getDB();
  return db.collection<DbSeller>("sellers").findOne({ user_id: userId });
}

export async function getSellerById(id: string): Promise<DbSeller | null> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return null;
  return db.collection<DbSeller>("sellers").findOne({ _id: new ObjectId(id) });
}

export async function createSeller(data: {
  userId: string;
  storeName: string;
  phone?: string;
}): Promise<DbSeller> {
  const db = getDB();
  const now = new Date().toISOString();
  const doc: Omit<DbSeller, "_id"> = {
    user_id: data.userId,
    store_name: data.storeName,
    phone: data.phone ?? undefined,
    verified: false,
    rating: 0,
    sales_count: 0,
    balance: 0,
    pending_balance: 0,
    payout_status: "manual",
    response_time_minutes: 5,
    fulfillment_rate: 100,
    dispute_rate: 0,
    created_at: now,
    updated_at: now,
  };
  const result = await db.collection<DbSeller>("sellers").insertOne(doc as DbSeller);
  return { ...doc, _id: result.insertedId } as DbSeller;
}

export async function updateSeller(
  id: string,
  updates: Partial<DbSeller>
): Promise<DbSeller | null> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return null;
  const result = await db
    .collection<DbSeller>("sellers")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updated_at: new Date().toISOString() } },
      { returnDocument: "after" }
    );
  return result;
}

export async function listSellers(opts?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ sellers: DbSeller[]; total: number }> {
  const db = getDB();
  const filter: Record<string, unknown> = {};
  if (opts?.search) {
    filter.store_name = { $regex: opts.search, $options: "i" };
  }
  if (opts?.status === "verified") filter.verified = true;
  if (opts?.status === "unverified") filter.verified = false;

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const [sellers, total] = await Promise.all([
    db
      .collection<DbSeller>("sellers")
      .find(filter)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
    db.collection<DbSeller>("sellers").countDocuments(filter),
  ]);

  return { sellers, total };
}
