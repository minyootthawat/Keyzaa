import { ObjectId } from "mongodb";
import { getDB } from "@/lib/mongodb";

export interface DbProduct {
  _id?: ObjectId;
  seller_id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getProductById(id: string): Promise<DbProduct | null> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return null;
  return db.collection<DbProduct>("products").findOne({ _id: new ObjectId(id) });
}

export async function getProductsBySeller(sellerId: string): Promise<DbProduct[]> {
  const db = getDB();
  return db
    .collection<DbProduct>("products")
    .find({ seller_id: sellerId, is_active: true })
    .sort({ created_at: -1 })
    .toArray();
}

export async function createProduct(data: {
  sellerId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
}): Promise<DbProduct> {
  const db = getDB();
  const now = new Date().toISOString();
  const doc: Omit<DbProduct, "_id"> = {
    seller_id: data.sellerId,
    name: data.name,
    description: data.description ?? undefined,
    price: data.price,
    category: data.category ?? "general",
    image_url: data.imageUrl ?? undefined,
    stock: 0,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
  const result = await db.collection<DbProduct>("products").insertOne(doc as DbProduct);
  return { ...doc, _id: result.insertedId } as DbProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<DbProduct>
): Promise<DbProduct | null> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return null;
  const result = await db
    .collection<DbProduct>("products")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updated_at: new Date().toISOString() } },
      { returnDocument: "after" }
    );
  return result;
}

export async function listProducts(opts?: {
  search?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<{ products: DbProduct[]; total: number }> {
  const db = getDB();
  const filter: Record<string, unknown> = { is_active: true };
  if (opts?.search) {
    filter.$or = [
      { name: { $regex: opts.search, $options: "i" } },
      { description: { $regex: opts.search, $options: "i" } },
    ];
  }
  if (opts?.category) filter.category = opts.category;

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const [products, total] = await Promise.all([
    db
      .collection<DbProduct>("products")
      .find(filter)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
    db.collection<DbProduct>("products").countDocuments(filter),
  ]);

  return { products, total };
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return false;
  const result = await db
    .collection<DbProduct>("products")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
