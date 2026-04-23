import { MongoClient, Db, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "keyzaa";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// ─── Connection ──────────────────────────────────────────────────────────────

export async function connectDB(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  // Ensure indexes exist
  await ensureIndexes(db);

  return { client, db };
}

export function getDb(): Db {
  if (!cachedDb) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return cachedDb;
}

async function ensureIndexes(db: Db) {
  const orders = db.collection("orders");
  await Promise.all([
    orders.createIndex({ buyer_id: 1, created_at: -1 }),
    orders.createIndex({ seller_id: 1, created_at: -1 }),
    orders.createIndex({ status: 1 }),
    orders.createIndex({ created_at: -1 }),
  ]);

  const orderItems = db.collection("order_items");
  await orderItems.createIndex({ order_id: 1 });
}

// ─── Type helpers ────────────────────────────────────────────────────────────

function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

// ─── Order helpers ───────────────────────────────────────────────────────────

export async function createOrder(orderData: {
  buyerId: string;
  sellerId: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  status?: string;
  paymentMethod?: string;
}): Promise<string> {
  const db = getDb();
  const now = new Date().toISOString();

  const result = await db.collection("orders").insertOne({
    buyer_id: orderData.buyerId,
    seller_id: orderData.sellerId,
    product_id: orderData.productId,
    quantity: orderData.quantity,
    total_price: orderData.totalPrice,
    gross_amount: orderData.totalPrice,
    commission_amount: 0,
    seller_net_amount: orderData.totalPrice,
    platform_fee_rate: 0.05,
    currency: "THB",
    status: orderData.status || "pending",
    payment_status: "pending",
    fulfillment_status: "pending",
    payment_method: orderData.paymentMethod || null,
    created_at: now,
    updated_at: now,
  });

  return result.insertedId.toString();
}

export async function getOrderById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb();
  const order = await db.collection("orders").findOne({ _id: toObjectId(id) });
  return order as Record<string, unknown> | null;
}

export async function getOrdersByBuyer(buyerId: string): Promise<Record<string, unknown>[]> {
  const db = getDb();
  const orders = await db
    .collection("orders")
    .find({ buyer_id: buyerId })
    .sort({ created_at: -1 })
    .toArray();
  return orders as Record<string, unknown>[];
}

export async function getOrdersBySeller(sellerId: string): Promise<Record<string, unknown>[]> {
  const db = getDb();
  const orders = await db
    .collection("orders")
    .find({ seller_id: sellerId })
    .sort({ created_at: -1 })
    .toArray();
  return orders as Record<string, unknown>[];
}

export async function updateOrderStatus(
  id: string,
  status: string
): Promise<Record<string, unknown> | null> {
  const db = getDb();
  const result = await db.collection("orders").findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: { status, updated_at: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  return result as Record<string, unknown> | null;
}

export async function updateOrderFields(
  id: string,
  fields: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  const db = getDb();
  const result = await db.collection("orders").findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: { ...fields, updated_at: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  return result as Record<string, unknown> | null;
}

// ─── Order item helpers ──────────────────────────────────────────────────────

export async function addOrderItem(itemData: {
  orderId: string;
  productId: string;
  title: string;
  titleTh?: string;
  titleEn?: string;
  image?: string;
  price: number;
  quantity: number;
  platform?: string;
  regionCode?: string;
  activationMethodTh?: string;
  activationMethodEn?: string;
}): Promise<string> {
  const db = getDb();

  const result = await db.collection("order_items").insertOne({
    order_id: itemData.orderId,
    product_id: itemData.productId,
    title: itemData.title,
    title_th: itemData.titleTh || null,
    title_en: itemData.titleEn || null,
    image: itemData.image || null,
    price: itemData.price,
    quantity: itemData.quantity,
    platform: itemData.platform || null,
    region_code: itemData.regionCode || null,
    activation_method_th: itemData.activationMethodTh || null,
    activation_method_en: itemData.activationMethodEn || null,
  });

  return result.insertedId.toString();
}

export async function getOrderItems(orderId: string): Promise<Record<string, unknown>[]> {
  const db = getDb();
  const items = await db
    .collection("order_items")
    .find({ order_id: orderId })
    .toArray();
  return items as Record<string, unknown>[];
}
