import { ObjectId } from "mongodb";
import { getDB } from "@/lib/mongodb";

export interface OrderItem {
  product_id: string;
  title: string;
  title_th?: string;
  title_en?: string;
  image?: string;
  price: number;
  quantity: number;
  platform?: string;
  region_code?: string;
  activation_method_th?: string;
  activation_method_en?: string;
}

export interface DbOrder {
  _id?: ObjectId;
  buyer_id: string;
  seller_id: string;
  items: OrderItem[];
  total_price: number;
  gross_amount: number;
  commission_amount: number;
  seller_net_amount: number;
  platform_fee_rate: number;
  currency: string;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  fulfillment_status: "pending" | "processing" | "delivered" | "failed" | "cancelled";
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

export async function getOrderById(id: string): Promise<DbOrder | null> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return null;
  return db.collection<DbOrder>("orders").findOne({ _id: new ObjectId(id) });
}

export async function getOrdersByBuyer(buyerId: string): Promise<DbOrder[]> {
  const db = getDB();
  return db
    .collection<DbOrder>("orders")
    .find({ buyer_id: buyerId })
    .sort({ created_at: -1 })
    .toArray();
}

export async function getOrdersBySeller(sellerId: string): Promise<DbOrder[]> {
  const db = getDB();
  return db
    .collection<DbOrder>("orders")
    .find({ seller_id: sellerId })
    .sort({ created_at: -1 })
    .toArray();
}

export async function createOrder(data: {
  buyerId: string;
  sellerId: string;
  items: OrderItem[];
  totalPrice: number;
  paymentMethod?: string;
}): Promise<DbOrder> {
  const db = getDB();
  const now = new Date().toISOString();
  const platformFeeRate = 0.05;
  const commissionAmount = data.totalPrice * platformFeeRate;
  const doc: Omit<DbOrder, "_id"> = {
    buyer_id: data.buyerId,
    seller_id: data.sellerId,
    items: data.items,
    total_price: data.totalPrice,
    gross_amount: data.totalPrice,
    commission_amount: commissionAmount,
    seller_net_amount: data.totalPrice - commissionAmount,
    platform_fee_rate: platformFeeRate,
    currency: "THB",
    status: "pending",
    payment_status: "pending",
    fulfillment_status: "pending",
    payment_method: data.paymentMethod ?? undefined,
    created_at: now,
    updated_at: now,
  };
  const result = await db.collection<DbOrder>("orders").insertOne(doc as DbOrder);
  return { ...doc, _id: result.insertedId } as DbOrder;
}

export async function updateOrderStatus(
  id: string,
  status: DbOrder["status"]
): Promise<DbOrder | null> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return null;
  return db
    .collection<DbOrder>("orders")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, updated_at: new Date().toISOString() } },
      { returnDocument: "after" }
    );
}

export async function updateOrderFields(
  id: string,
  updates: Partial<DbOrder>
): Promise<DbOrder | null> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return null;
  return db
    .collection<DbOrder>("orders")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updated_at: new Date().toISOString() } },
      { returnDocument: "after" }
    );
}

export async function listOrders(opts?: {
  buyerId?: string;
  sellerId?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ orders: DbOrder[]; total: number }> {
  const db = getDB();
  const filter: Record<string, unknown> = {};
  if (opts?.buyerId) filter.buyer_id = opts.buyerId;
  if (opts?.sellerId) filter.seller_id = opts.sellerId;
  if (opts?.status) filter.status = opts.status;

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const [orders, total] = await Promise.all([
    db
      .collection<DbOrder>("orders")
      .find(filter)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
    db.collection<DbOrder>("orders").countDocuments(filter),
  ]);

  return { orders, total };
}
