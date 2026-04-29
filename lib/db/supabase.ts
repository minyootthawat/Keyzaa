import { createAdminClient } from "@/lib/supabase/supabase";

const supabase = createAdminClient();

// ─── Types matching supabase/schema.sql ────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "seller" | "both";
  password_hash: string | null;
  provider: string | null;
  provider_id: string | null;
  is_email_verified: boolean;
  avatar_url: string | null;
  phone: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSeller {
  id: string;
  user_id: string;
  store_name: string;
  store_slug: string;
  description: string | null;
  avatar_url: string | null;
  phone: string | null;
  id_card_url: string | null;
  status: "active" | "suspended" | "pending_verification" | "deleted";
  is_verified: boolean;
  rating: number;
  total_sales: number;
  balance: number;
  pending_balance: number;
  payout_status: "manual" | "enabled";
  response_time_minutes: number;
  fulfillment_rate: number;
  dispute_rate: number;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  public_id: string;
  seller_id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
  status: "active" | "inactive" | "out_of_stock" | "deleted";
  is_featured: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DbOrder {
  id: string;
  public_id: string;
  buyer_id: string | null;
  seller_id: string | null;
  items: OrderItem[];
  total_price: number;
  gross_amount: number;
  commission_amount: number;
  seller_net_amount: number;
  platform_fee_rate: number;
  currency: string;
  status: "pending" | "paid" | "processing" | "completed" | "cancelled";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  fulfillment_status: "pending" | "processing" | "delivered" | "failed" | "cancelled";
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface DbLedgerEntry {
  id: string;
  public_id: string;
  seller_id: string;
  type: "sale" | "commission_fee" | "withdrawal" | "refund" | "topup";
  amount: number;
  order_id: string | null;
  description: string | null;
  created_at: string;
}

export interface DbGameAccount {
  id: string;
  seller_id: string;
  game_name: string;
  game_name_th: string | null;
  account_username: string;
  account_password: string;
  description: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  platform: string | null;
  region: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAdmin {
  id: string;
  user_id: string | null;
  email: string;
  password_hash: string;
  role: string;
  is_super_admin: boolean;
  permissions: string[];
  created_by: string | null;
  created_at: string;
}

// ─── User helpers ───────────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();
  return data as DbUser | null;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  return data as DbUser | null;
}

export async function createUser(userData: {
  email: string;
  name: string;
  passwordHash?: string;
  provider?: string;
  providerId?: string;
  role?: "buyer" | "seller" | "both";
}): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from("users")
    .insert({
      email: userData.email.toLowerCase(),
      name: userData.name,
      password_hash: userData.passwordHash || null,
      role: userData.role || "buyer",
      provider: userData.provider || null,
      provider_id: userData.providerId || null,
    })
    .select()
    .single();
  if (error || !data) {
    console.error("createUser error:", error);
    return null;
  }
  return data as DbUser;
}

export async function updateUser(
  id: string,
  updates: Partial<DbUser>
): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from("users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return null;
  return data as DbUser;
}

export async function updateUserLastLogin(id: string): Promise<void> {
  await supabase
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", id);
}

export async function listUsers(opts?: {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
}): Promise<{ users: DbUser[]; total: number }> {
  let query = supabase.from("users").select("*", { count: "exact" });
  if (opts?.role) query = query.eq("role", opts.role);
  if (opts?.search) {
    query = query.or(`email.ilike.%${opts.search}%,name.ilike.%${opts.search}%`);
  }
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("listUsers error:", error);
    return { users: [], total: 0 };
  }
  return { users: (data ?? []) as DbUser[], total: count ?? 0 };
}

// ─── Seller helpers ─────────────────────────────────────────────────────────

export async function getSellerByUserId(userId: string): Promise<DbSeller | null> {
  const { data } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data as DbSeller | null;
}

export async function getSellerById(id: string): Promise<DbSeller | null> {
  const { data } = await supabase
    .from("sellers")
    .select("*")
    .eq("id", id)
    .single();
  return data as DbSeller | null;
}

export async function getSellerByEmail(email: string): Promise<DbSeller | null> {
  const { data } = await supabase
    .from("sellers")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();
  return data as DbSeller | null;
}

export async function createSeller(sellerData: {
  userId: string;
  storeName: string;
  storeSlug: string;
  phone?: string;
}): Promise<DbSeller | null> {
  const { data, error } = await supabase
    .from("sellers")
    .insert({
      user_id: sellerData.userId,
      store_name: sellerData.storeName,
      store_slug: sellerData.storeSlug,
      phone: sellerData.phone || null,
      status: "pending_verification",
      is_verified: false,
      rating: 0,
      total_sales: 0,
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
  return data as DbSeller;
}

export async function updateSeller(
  id: string,
  updates: Partial<DbSeller>
): Promise<DbSeller | null> {
  const { data, error } = await supabase
    .from("sellers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return null;
  return data as DbSeller;
}

export async function listSellers(opts?: {
  search?: string;
  status?: DbSeller["status"];
  isVerified?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ sellers: DbSeller[]; total: number }> {
  let query = supabase.from("sellers").select("*", { count: "exact" });
  if (opts?.status) query = query.eq("status", opts.status);
  if (typeof opts?.isVerified === "boolean")
    query = query.eq("is_verified", opts.isVerified);
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, count, error } = await query;
  return { sellers: (data ?? []) as DbSeller[], total: count ?? 0 };
}

// ─── Product helpers ───────────────────────────────────────────────────────

export async function getProductsBySeller(sellerId: string): Promise<DbProduct[]> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return (data ?? []) as DbProduct[];
}

export async function getProductById(id: string): Promise<DbProduct | null> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  return data as DbProduct | null;
}

export async function getProductByPublicId(publicId: string): Promise<DbProduct | null> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("public_id", publicId)
    .single();
  return data as DbProduct | null;
}

export async function createProduct(productData: {
  sellerId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  stock?: number;
}): Promise<DbProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      seller_id: productData.sellerId,
      name: productData.name,
      description: productData.description || null,
      price: productData.price,
      category: productData.category || "general",
      image_url: productData.imageUrl || null,
      stock: productData.stock ?? 0,
      status: "active",
    })
    .select()
    .single();
  if (error || !data) {
    console.error("createProduct error:", error);
    return null;
  }
  return data as DbProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<DbProduct>
): Promise<DbProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return null;
  return data as DbProduct;
}

export async function listProducts(opts?: {
  search?: string;
  category?: string;
  sellerId?: string;
  status?: DbProduct["status"];
  limit?: number;
  offset?: number;
}): Promise<{ products: DbProduct[]; total: number }> {
  let query = supabase.from("products").select("*", { count: "exact" });
  if (opts?.sellerId) query = query.eq("seller_id", opts.sellerId);
  if (opts?.category) query = query.eq("category", opts.category);
  if (opts?.status) {
    query = query.eq("status", opts.status);
  } else {
    query = query.eq("status", "active"); // default to active
  }
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, count, error } = await query;
  return { products: (data ?? []) as DbProduct[], total: count ?? 0 };
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("products")
    .update({ status: "deleted", updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

// ─── Order helpers ─────────────────────────────────────────────────────────

export async function getOrderById(id: string): Promise<DbOrder | null> {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();
  return data as DbOrder | null;
}

export async function getOrderByPublicId(publicId: string): Promise<DbOrder | null> {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("public_id", publicId)
    .single();
  return data as DbOrder | null;
}

export async function getOrdersByBuyer(buyerId: string): Promise<DbOrder[]> {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });
  return (data ?? []) as DbOrder[];
}

export async function getOrdersBySeller(sellerId: string): Promise<DbOrder[]> {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  return (data ?? []) as DbOrder[];
}

export async function createOrder(orderData: {
  buyerId: string;
  sellerId: string;
  items: OrderItem[];
  totalPrice: number;
  grossAmount?: number;
  platformFeeRate?: number;
  currency?: string;
  status?: DbOrder["status"];
  paymentMethod?: string;
}): Promise<DbOrder | null> {
  const platformFeeRate = orderData.platformFeeRate ?? 0.05;
  const totalPrice = orderData.totalPrice;
  const commissionAmount = totalPrice * platformFeeRate;

  const { data, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: orderData.buyerId,
      seller_id: orderData.sellerId,
      items: orderData.items,
      total_price: totalPrice,
      gross_amount: orderData.grossAmount ?? totalPrice,
      commission_amount: commissionAmount,
      seller_net_amount: totalPrice - commissionAmount,
      platform_fee_rate: platformFeeRate,
      currency: orderData.currency ?? "THB",
      status: orderData.status ?? "pending",
      payment_status: "pending",
      fulfillment_status: "pending",
      payment_method: orderData.paymentMethod ?? null,
    })
    .select()
    .single();
  if (error || !data) {
    console.error("createOrder error:", error);
    return null;
  }
  return data as DbOrder;
}

export async function updateOrder(
  id: string,
  updates: Partial<DbOrder>
): Promise<DbOrder | null> {
  const { data, error } = await supabase
    .from("orders")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return null;
  return data as DbOrder;
}

export async function updateOrderStatus(
  id: string,
  status: DbOrder["status"]
): Promise<DbOrder | null> {
  return updateOrder(id, { status });
}

export async function updateOrderFields(
  id: string,
  updates: Partial<DbOrder>
): Promise<DbOrder | null> {
  return updateOrder(id, updates);
}

export async function listOrders(opts?: {
  buyerId?: string;
  sellerId?: string;
  status?: DbOrder["status"];
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ orders: DbOrder[]; total: number }> {
  let query = supabase.from("orders").select("*", { count: "exact" });
  if (opts?.buyerId) query = query.eq("buyer_id", opts.buyerId);
  if (opts?.sellerId) query = query.eq("seller_id", opts.sellerId);
  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("listOrders error:", error);
    return { orders: [], total: 0 };
  }
  return { orders: (data ?? []) as DbOrder[], total: count ?? 0 };
}

// ─── Ledger helpers ─────────────────────────────────────────────────────────

export async function getLedgerBySeller(
  sellerId: string,
  opts?: { limit?: number; offset?: number }
): Promise<DbLedgerEntry[]> {
  let query = supabase
    .from("ledger_entries")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);
  const { data } = await query;
  return (data ?? []) as DbLedgerEntry[];
}

export async function createLedgerEntry(entryData: {
  sellerId: string;
  orderId?: string;
  amount: number;
  type: DbLedgerEntry["type"];
  description?: string;
}): Promise<DbLedgerEntry | null> {
  const { data, error } = await supabase
    .from("ledger_entries")
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
  return data as DbLedgerEntry;
}

// ─── Game Account helpers ─────────────────────────────────────────────────────

export async function getGameAccountsBySeller(sellerId: string): Promise<DbGameAccount[]> {
  const { data } = await supabase
    .from("game_accounts")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  return (data ?? []) as DbGameAccount[];
}

export async function getGameAccountById(id: string): Promise<DbGameAccount | null> {
  const { data } = await supabase
    .from("game_accounts")
    .select("*")
    .eq("id", id)
    .single();
  return data as DbGameAccount | null;
}

export async function createGameAccount(accountData: {
  sellerId: string;
  gameName: string;
  gameNameTh?: string;
  accountUsername: string;
  accountPassword: string;
  description?: string;
  price?: number;
  stock?: number;
  platform?: string;
  region?: string;
  imageUrl?: string;
}): Promise<DbGameAccount | null> {
  const { data, error } = await supabase
    .from("game_accounts")
    .insert({
      seller_id: accountData.sellerId,
      game_name: accountData.gameName,
      game_name_th: accountData.gameNameTh || null,
      account_username: accountData.accountUsername,
      account_password: accountData.accountPassword,
      description: accountData.description || null,
      price: accountData.price ?? 0,
      stock: accountData.stock ?? 1,
      platform: accountData.platform || null,
      region: accountData.region || null,
      image_url: accountData.imageUrl || null,
    })
    .select()
    .single();
  if (error || !data) {
    console.error("createGameAccount error:", error);
    return null;
  }
  return data as DbGameAccount;
}

export async function updateGameAccount(
  id: string,
  updates: Partial<DbGameAccount>
): Promise<DbGameAccount | null> {
  const { data, error } = await supabase
    .from("game_accounts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return null;
  return data as DbGameAccount;
}

export async function deleteGameAccount(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("game_accounts")
    .delete()
    .eq("id", id);
  return !error;
}

// ─── Admin helpers ──────────────────────────────────────────────────────────

export async function findAdminByEmail(email: string): Promise<DbAdmin | null> {
  const { data } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();
  return data as DbAdmin | null;
}

export async function findAdminByUserId(userId: string): Promise<DbAdmin | null> {
  const { data } = await supabase
    .from("admins")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data as DbAdmin | null;
}

export async function createAdmin(adminData: {
  email: string;
  passwordHash: string;
  role?: string;
  isSuperAdmin?: boolean;
  permissions?: string[];
  createdBy?: string;
}): Promise<DbAdmin | null> {
  const { data, error } = await supabase
    .from("admins")
    .insert({
      email: adminData.email.toLowerCase(),
      password_hash: adminData.passwordHash,
      role: adminData.role ?? "super_admin",
      is_super_admin: adminData.isSuperAdmin ?? false,
      permissions: adminData.permissions ?? [],
      created_by: adminData.createdBy ?? null,
    })
    .select()
    .single();
  if (error || !data) {
    console.error("createAdmin error:", error);
    return null;
  }
  return data as DbAdmin;
}

export async function listAdmins(opts?: {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
}): Promise<{ admins: DbAdmin[]; total: number }> {
  let query = supabase.from("admins").select("*", { count: "exact" });
  if (opts?.role) query = query.eq("role", opts.role);
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("listAdmins error:", error);
    return { admins: [], total: 0 };
  }
  return { admins: (data ?? []) as DbAdmin[], total: count ?? 0 };
}

export async function updateAdmin(
  id: string,
  updates: Partial<DbAdmin>
): Promise<DbAdmin | null> {
  const { data, error } = await supabase
    .from("admins")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return null;
  return data as DbAdmin;
}

export async function deleteAdmin(id: string): Promise<boolean> {
  const { error } = await supabase.from("admins").delete().eq("id", id);
  return !error;
}

// ─── Platform settings helpers ──────────────────────────────────────────────

export async function getPlatformSetting(key: string): Promise<{ key: string; value: unknown } | null> {
  const { data } = await supabase
    .from("platform_settings")
    .select("key, value")
    .eq("key", key)
    .single();
  return data as { key: string; value: unknown } | null;
}

export async function setPlatformSetting(key: string, value: unknown): Promise<void> {
  await supabase
    .from("platform_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
}

export async function listPlatformSettings(): Promise<{ key: string; value: unknown }[]> {
  const { data } = await supabase.from("platform_settings").select("key, value");
  return (data ?? []) as { key: string; value: unknown }[];
}
