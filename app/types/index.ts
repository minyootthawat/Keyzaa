// User & Auth
export type UserRole = "buyer" | "seller" | "both";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  sellerId?: string;
  createdAt: string;
}

export interface Seller {
  id: string;
  userId: string;
  shopName: string;
  phone: string;
  rating: number;
  salesCount: number;
  balance: number;
  pendingBalance: number;
  createdAt: string;
}

// Product
export interface Product {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice: number;
  discount: number;
  badge?: string;
  category: string;
  platform: string;
  sellerId: string;
  stock: number;
  soldCount: number;
  isActive: boolean;
}

// Cart
export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  sellerId: string;
  sellerName: string;
  platform?: string;
}

// Orders
export type OrderStatus = "pending" | "paid" | "delivered" | "cancelled";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  sellerId: string;
  keys: string[];
  platform: string;
}

export interface Order {
  id: string;
  buyerId: string;
  date: string;
  status: OrderStatus;
  totalPrice: number;
  paymentMethod: string;
  items: OrderItem[];
}

// Seller-specific order view
export interface SellerOrder {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  totalPrice: number;
}

// Seller mode - product management
export interface SellerProduct {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice: number;
  discount: number;
  badge?: string;
  category: string;
  platform: string;
  stock: number;
  soldCount: number;
  isActive: boolean;
}

// Seller option for product display/selection (lightweight)
export interface SellerOption {
  id: string;
  name: string;
  price: number;
  rating: number;
  salesCount: number;
  deliverySpeed: string;
  isOfficial?: boolean;
}

// Wallet
export type TransactionType = "earning" | "withdrawal";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
}
