export type UserRole = "buyer" | "seller" | "both";

export interface User {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  role: UserRole;
  sellerId?: string | null;
  provider?: string | null;
  providerId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface Seller {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  rating?: number | null;
  totalSales?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: string;
  updatedAt: string;
}

export interface SellerLedgerEntry {
  id: string;
  sellerId: string;
  orderId?: string | null;
  amount: number;
  type: "credit" | "debit";
  description?: string | null;
  createdAt: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          image: string | null;
          role: UserRole;
          sellerId: string | null;
          provider: string | null;
          providerId: string | null;
          createdAt: string;
          updatedAt: string;
          lastLoginAt: string | null;
        };
        Insert: Omit<User, "id" | "createdAt" | "updatedAt"> & {
          id?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: Partial<Omit<User, "id" | "createdAt">>;
      };
      sellers: {
        Row: Seller;
        Insert: Omit<Seller, "id" | "createdAt" | "updatedAt"> & {
          id?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: Partial<Omit<Seller, "id" | "createdAt">>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "createdAt" | "updatedAt"> & {
          id?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: Partial<Omit<Product, "id" | "createdAt">>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "createdAt" | "updatedAt"> & {
          id?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: Partial<Omit<Order, "id" | "createdAt">>;
      };
      seller_ledger_entries: {
        Row: SellerLedgerEntry;
        Insert: Omit<SellerLedgerEntry, "id" | "createdAt"> & {
          id?: string;
          createdAt?: string;
        };
        Update: Partial<Omit<SellerLedgerEntry, "id" | "createdAt">>;
      };
    };
  };
}
