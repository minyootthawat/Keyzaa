// Database types matching actual Supabase schema (snake_case columns)
// Schema: public.users, public.sellers, public.products, public.orders,
//         public.order_items, public.seller_ledger_entries

export type UserRole = "buyer" | "seller" | "both";

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string | null;
  role: UserRole;
  provider?: string | null;
  provider_id?: string | null;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export interface Seller {
  id: string;
  user_id: string;
  store_name: string;
  phone?: string | null;
  id_card_url?: string | null;
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

export interface Product {
  id: string;
  seller_id: string;
  name: string;
  description?: string | null;
  category: string;
  price: number;
  stock: number;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type FulfillmentStatus = "pending" | "processing" | "delivered" | "failed" | "cancelled";

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  gross_amount: number;
  commission_amount: number;
  seller_net_amount: number;
  platform_fee_rate: number;
  currency: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  payment_method?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  title_th?: string | null;
  title_en?: string | null;
  image?: string | null;
  price: number;
  quantity: number;
  platform?: string | null;
  region_code?: string | null;
  activation_method_th?: string | null;
  activation_method_en?: string | null;
}

export type LedgerEntryType = "sale" | "commission_fee" | "withdrawal";

export interface GameAccount {
  id: string;
  seller_id: string;
  game_name: string;
  game_name_th?: string | null;
  account_username: string;
  account_password: string;
  description?: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  platform?: string | null;
  region?: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerLedgerEntry {
  id: string;
  seller_id: string;
  type: LedgerEntryType;
  amount: number;
  order_id?: string | null;
  description?: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      sellers: {
        Row: Seller;
        Insert: Omit<Seller, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Seller, "id" | "created_at">>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Product, "id" | "created_at">>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Order, "id" | "created_at">>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id"> & { id?: string };
        Update: Partial<Omit<OrderItem, "id">>;
      };
      seller_ledger_entries: {
        Row: SellerLedgerEntry;
        Insert: Omit<SellerLedgerEntry, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<SellerLedgerEntry, "id" | "created_at">>;
      };
      game_accounts: {
        Row: GameAccount;
        Insert: Omit<GameAccount, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<GameAccount, "id" | "created_at">>;
      };
    };
  };
}
