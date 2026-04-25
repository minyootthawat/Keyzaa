import { createBrowserClientSupabase, createServiceRoleClient } from "@/lib/supabase/supabase";

// Re-export for backwards compatibility
export { createServiceRoleClient };

import type {
  User,
  Seller,
  Product,
  Order,
  SellerLedgerEntry,
} from "@/types/database";

type UserRow = User;
type SellerRow = Seller;
type ProductRow = Product;
type OrderRow = Order;
type LedgerRow = SellerLedgerEntry;

export function connectDB() {
  return createBrowserClientSupabase();
}

export function connectAdminDB() {
  return createServiceRoleClient();
}

// ─── User helpers ──────────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const supabase = connectAdminDB();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !data) return null;
  return data as UserRow;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const supabase = connectAdminDB();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as UserRow;
}

export async function createUser(userData: {
  email: string;
  name: string;
  passwordHash?: string;
  provider?: string;
  providerId?: string;
  role?: "buyer" | "seller" | "both";
}): Promise<UserRow | null> {
  const supabase = connectAdminDB();

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: userData.email.toLowerCase(),
      name: userData.name,
      password_hash: userData.passwordHash || null,
      role: userData.role || "buyer",
      provider: userData.provider || null,
      provider_id: userData.providerId || null,
      last_login_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    console.error("createUser error:", error);
    return null;
  }
  return data as UserRow;
}

export async function updateUser(
  id: string,
  updates: Partial<UserRow>
): Promise<UserRow | null> {
  const supabase = connectAdminDB();
  const { data, error } = await supabase
    .from("users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return data as UserRow;
}

export async function updateUserLastLogin(id: string): Promise<void> {
  const supabase = connectAdminDB();
  await supabase
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", id);
}

// ─── Seller helpers ─────────────────────────────────────────────────────────

export async function getSellerByUserId(userId: string): Promise<SellerRow | null> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data as SellerRow;
}

export async function getSellerById(id: string): Promise<SellerRow | null> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as SellerRow;
}

export async function createSeller(sellerData: {
  userId: string;
  storeName: string;
  phone?: string;
}): Promise<SellerRow | null> {
  const supabase = connectAdminDB();

  const { data, error } = await supabase
    .from("sellers")
    .insert({
      user_id: sellerData.userId,
      store_name: sellerData.storeName,
      phone: sellerData.phone || null,
      verified: false,
      rating: 0,
      sales_count: 0,
      balance: 0,
      pending_balance: 0,
      payout_status: "manual",
      response_time_minutes: 5,
      fulfillment_rate: 100,
      dispute_rate: 0,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("createSeller error:", error);
    return null;
  }
  return data as SellerRow;
}

export async function updateSeller(
  id: string,
  updates: Partial<SellerRow>
): Promise<SellerRow | null> {
  const supabase = connectAdminDB();
  const { data, error } = await supabase
    .from("sellers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return data as SellerRow;
}

// ─── Product helpers ────────────────────────────────────────────────────────

export async function getProductsBySeller(sellerId: string): Promise<ProductRow[]> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as ProductRow[];
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as ProductRow;
}

export async function createProduct(productData: {
  sellerId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
}): Promise<ProductRow | null> {
  const supabase = connectAdminDB();

  const { data, error } = await supabase
    .from("products")
    .insert({
      seller_id: productData.sellerId,
      name: productData.name,
      description: productData.description || null,
      price: productData.price,
      category: productData.category || "general",
      image_url: productData.imageUrl || null,
      is_active: true,
      stock: 0,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("createProduct error:", error);
    return null;
  }
  return data as ProductRow;
}

export async function updateProduct(
  id: string,
  updates: Partial<ProductRow>
): Promise<ProductRow | null> {
  const supabase = connectAdminDB();
  const { data, error } = await supabase
    .from("products")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return data as ProductRow;
}

// ─── Order helpers ──────────────────────────────────────────────────────────
// DEPRECATED: Orders have been migrated to MongoDB.
// These Supabase helpers are kept for backward compatibility only.
// Use lib/db/mongodb.ts order functions instead.

export async function getOrdersByBuyer(buyerId: string): Promise<OrderRow[]> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as OrderRow[];
}

export async function getOrdersBySeller(sellerId: string): Promise<OrderRow[]> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as OrderRow[];
}

export async function getOrderById(id: string): Promise<OrderRow | null> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as OrderRow;
}

export async function createOrder(orderData: {
  buyerId: string;
  sellerId: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  status?: Order["status"];
}): Promise<OrderRow | null> {
  const supabase = connectAdminDB();

  const { data, error } = await supabase
    .from("orders")
    .insert({
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
    })
    .select()
    .single();

  if (error || !data) {
    console.error("createOrder error:", error);
    return null;
  }
  return data as OrderRow;
}

export async function updateOrderStatus(
  id: string,
  status: Order["status"]
): Promise<OrderRow | null> {
  const supabase = connectAdminDB();
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return data as OrderRow;
}

// ─── Seller ledger helpers ───────────────────────────────────────────────────

export async function getLedgerEntriesBySeller(
  sellerId: string
): Promise<LedgerRow[]> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("seller_ledger_entries")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as LedgerRow[];
}

export async function createLedgerEntry(entryData: {
  sellerId: string;
  orderId?: string;
  amount: number;
  type: "sale" | "commission_fee" | "withdrawal";
  description?: string;
}): Promise<LedgerRow | null> {
  const supabase = connectAdminDB();

  const { data, error } = await supabase
    .from("seller_ledger_entries")
    .insert({
      seller_id: entryData.sellerId,
      order_id: entryData.orderId || null,
      amount: entryData.amount,
      type: entryData.type,
      description: entryData.description || null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("createLedgerEntry error:", error);
    return null;
  }
  return data as LedgerRow;
}
