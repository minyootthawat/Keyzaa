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

  const products = db.collection("products");
  await Promise.all([
    products.createIndex({ seller_id: 1, created_at: -1 }),
    products.createIndex({ seller_id: 1, is_active: 1 }),
  ]);

  const ledger = db.collection("seller_ledger_entries");
  await ledger.createIndex({ seller_id: 1, created_at: -1 });
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

// ─── Product helpers ───────────────────────────────────────────────────────────

interface ProductFilter {
  seller_id?: string;
  category?: string;
  is_active?: boolean;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

export async function getProducts(
  filters: ProductFilter = {},
  pagination: PaginationOptions = {}
): Promise<Record<string, unknown>[]> {
  const db = getDb();
  const { page = 1, limit = 20 } = pagination;
  const query: Record<string, unknown> = {};

  if (filters.seller_id !== undefined) query.seller_id = filters.seller_id;
  if (filters.category !== undefined) query.category = filters.category;
  if (filters.is_active !== undefined) query.is_active = filters.is_active;

  const skip = (page - 1) * limit;
  const products = await db
    .collection("products")
    .find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  return products as Record<string, unknown>[];
}

export async function getProductById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb();
  const product = await db.collection("products").findOne({ _id: toObjectId(id) });
  return product as Record<string, unknown> | null;
}

export async function getProductsBySeller(sellerId: string): Promise<Record<string, unknown>[]> {
  const db = getDb();
  const products = await db
    .collection("products")
    .find({ seller_id: sellerId })
    .sort({ created_at: -1 })
    .toArray();
  return products as Record<string, unknown>[];
}

export async function createProduct(data: {
  seller_id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  image_url?: string;
  is_active?: boolean;
}): Promise<string> {
  const db = getDb();
  const now = new Date().toISOString();

  const result = await db.collection("products").insertOne({
    seller_id: data.seller_id,
    name: data.name,
    description: data.description || null,
    category: data.category,
    price: data.price,
    stock: data.stock,
    image_url: data.image_url || null,
    is_active: data.is_active ?? true,
    created_at: now,
    updated_at: now,
  });

  return result.insertedId.toString();
}

export async function updateProduct(
  id: string,
  fields: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  const db = getDb();
  const result = await db.collection("products").findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: { ...fields, updated_at: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  return result as Record<string, unknown> | null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db.collection("products").deleteOne({ _id: toObjectId(id) });
  return result.deletedCount > 0;
}

// ─── Seller helpers ───────────────────────────────────────────────────────────

export async function getSellerById(sellerId: string): Promise<Record<string, unknown> | null> {
  const db = getDb();
  const seller = await db.collection("sellers").findOne({ _id: toObjectId(sellerId) });
  return seller as Record<string, unknown> | null;
}

export async function getSellerByUserId(userId: string): Promise<Record<string, unknown> | null> {
  const db = getDb();
  const seller = await db.collection("sellers").findOne({ user_id: userId });
  return seller as Record<string, unknown> | null;
}

// ─── Seller ledger helpers ─────────────────────────────────────────────────────

export async function getLedgerEntriesBySeller(
  sellerId: string
): Promise<Record<string, unknown>[]> {
  const db = getDb();
  const entries = await db
    .collection("seller_ledger_entries")
    .find({ seller_id: sellerId })
    .sort({ created_at: -1 })
    .toArray();
  return entries as Record<string, unknown>[];
}

export async function insertLedgerEntry(entry: {
  seller_id: string;
  type: "sale" | "commission_fee" | "withdrawal";
  amount: number;
  order_id?: string;
  description?: string;
}): Promise<string> {
  const db = getDb();
  const now = new Date().toISOString();

  const result = await db.collection("seller_ledger_entries").insertOne({
    seller_id: entry.seller_id,
    type: entry.type,
    amount: entry.amount,
    order_id: entry.order_id || null,
    description: entry.description || null,
    created_at: now,
  });

  return result.insertedId.toString();
}

export async function getSellerWalletSummary(
  sellerId: string
): Promise<{ balance: number; pending_balance: number; total_sales: number; total_withdrawals: number }> {
  const db = getDb();

  const seller = await db.collection("sellers").findOne(
    { _id: toObjectId(sellerId) },
    { projection: { balance: 1, pending_balance: 1 } }
  );

  const ledgerEntries = await db
    .collection("seller_ledger_entries")
    .find({ seller_id: sellerId })
    .toArray();

  let totalSales = 0;
  let totalWithdrawals = 0;

  for (const entry of ledgerEntries as Array<{ type: string; amount: number }>) {
    if (entry.type === "sale") totalSales += entry.amount;
    if (entry.type === "withdrawal") totalWithdrawals += entry.amount;
  }

  return {
    balance: (seller as { balance: number })?.balance ?? 0,
    pending_balance: (seller as { pending_balance: number })?.pending_balance ?? 0,
    total_sales: totalSales,
    total_withdrawals: totalWithdrawals,
  };
}

