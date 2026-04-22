import { createBrowserClientSupabase, createServiceRoleClient } from "@/lib/supabase/supabase";
import type { User, Seller, Product, Order, SellerLedgerEntry } from "@/types/database";

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

// User helpers
export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !data) return null;
  return data as UserRow;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const supabase = connectDB();
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
  name?: string;
  passwordHash?: string;
  provider?: string;
  providerId?: string;
  role?: "buyer" | "seller" | "both";
}): Promise<UserRow | null> {
  const supabase = connectAdminDB();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: userData.email.toLowerCase(),
      name: userData.name || null,
      role: userData.role || "buyer",
      provider: userData.provider || null,
      providerId: userData.providerId || null,
      sellerId: null,
      lastLoginAt: now,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select()
    .single();

  if (error || !data) {
    console.error("createUser error:", error);
    return null;
  }
  return data as UserRow;
}

export async function updateUser(id: string, updates: Partial<UserRow>): Promise<UserRow | null> {
  const supabase = connectAdminDB();
  const { data, error } = await supabase
    .from("users")
    .update({ ...updates, updatedAt: new Date().toISOString() })
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
    .update({ lastLoginAt: new Date().toISOString() })
    .eq("id", id);
}

// Seller helpers
export async function getSellerByUserId(userId: string): Promise<SellerRow | null> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("userId", userId)
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
  name: string;
  description?: string;
}): Promise<SellerRow | null> {
  const supabase = connectAdminDB();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("sellers")
    .insert({
      userId: sellerData.userId,
      name: sellerData.name,
      description: sellerData.description || null,
      rating: null,
      totalSales: 0,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("createSeller error:", error);
    return null;
  }
  return data as SellerRow;
}

export async function updateSeller(id: string, updates: Partial<SellerRow>): Promise<SellerRow | null> {
  const supabase = connectAdminDB();
  const { data, error } = await supabase
    .from("sellers")
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return data as SellerRow;
}

// Product helpers
export async function getProductsBySeller(sellerId: string): Promise<ProductRow[]> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("sellerId", sellerId)
    .eq("isActive", true)
    .order("createdAt", { ascending: false });

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
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("products")
    .insert({
      sellerId: productData.sellerId,
      name: productData.name,
      description: productData.description || null,
      price: productData.price,
      category: productData.category || null,
      imageUrl: productData.imageUrl || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("createProduct error:", error);
    return null;
  }
  return data as ProductRow;
}

export async function updateProduct(id: string, updates: Partial<ProductRow>): Promise<ProductRow | null> {
  const supabase = connectAdminDB();
  const { data, error } = await supabase
    .from("products")
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return data as ProductRow;
}

// Order helpers
export async function getOrdersByBuyer(buyerId: string): Promise<OrderRow[]> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("buyerId", buyerId)
    .order("createdAt", { ascending: false });

  if (error || !data) return [];
  return data as OrderRow[];
}

export async function getOrdersBySeller(sellerId: string): Promise<OrderRow[]> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("sellerId", sellerId)
    .order("createdAt", { ascending: false });

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
  status?: "pending" | "completed" | "failed" | "refunded";
}): Promise<OrderRow | null> {
  const supabase = connectAdminDB();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .insert({
      buyerId: orderData.buyerId,
      sellerId: orderData.sellerId,
      productId: orderData.productId,
      quantity: orderData.quantity,
      totalPrice: orderData.totalPrice,
      status: orderData.status || "pending",
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("createOrder error:", error);
    return null;
  }
  return data as Order;
}

export async function updateOrderStatus(id: string, status: OrderRow["status"]): Promise<OrderRow | null> {
  const supabase = connectAdminDB();
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return data as OrderRow;
}

// Seller ledger helpers
export async function getLedgerEntriesBySeller(sellerId: string): Promise<LedgerRow[]> {
  const supabase = connectDB();
  const { data, error } = await supabase
    .from("seller_ledger_entries")
    .select("*")
    .eq("sellerId", sellerId)
    .order("createdAt", { ascending: false });

  if (error || !data) return [];
  return data as LedgerRow[];
}

export async function createLedgerEntry(entryData: {
  sellerId: string;
  orderId?: string;
  amount: number;
  type: "credit" | "debit";
  description?: string;
}): Promise<LedgerRow | null> {
  const supabase = connectAdminDB();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("seller_ledger_entries")
    .insert({
      sellerId: entryData.sellerId,
      orderId: entryData.orderId || null,
      amount: entryData.amount,
      type: entryData.type,
      description: entryData.description || null,
      createdAt: now,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("createLedgerEntry error:", error);
    return null;
  }
  return data as LedgerRow;
}
