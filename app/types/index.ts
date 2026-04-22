// User & Auth
export type UserRole = "buyer" | "seller" | "both";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  sellerId?: string | null;
  createdAt: string;
}

export type SellerVerificationStatus = "new" | "verified" | "top_rated";

export interface Seller {
  id: string;
  userId: string;
  shopName: string;
  phone: string;
  rating: number;
  salesCount: number;
  balance: number;
  pendingBalance: number;
  verificationStatus?: SellerVerificationStatus;
  responseTimeMinutes?: number;
  fulfillmentRate?: number;
  disputeRate?: number;
  payoutStatus?: "manual" | "enabled";
  totalGrossSales?: number;
  totalNetEarnings?: number;
  totalCommissionPaid?: number;
  createdAt?: string;
}

// Product
export type ProductListingStatus = "draft" | "active" | "paused" | "archived";

export interface Product {
  id: string;
  title: string;
  nameTh: string;
  nameEn: string;
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
  sellerCount?: number;
  listingStatus?: ProductListingStatus;
  currency?: string;
  marketplaceType?: "seller_owned";
  regionCode?: string;
  regionLabelTh?: string;
  regionLabelEn?: string;
  deliverySlaMinutes?: number;
  deliveryLabelTh?: string;
  deliveryLabelEn?: string;
  activationMethodTh?: string;
  activationMethodEn?: string;
  shortDescriptionTh?: string;
  shortDescriptionEn?: string;
  descriptionTh?: string;
  descriptionEn?: string;
  activationStepsTh?: string[];
  activationStepsEn?: string[];
  trustLabelTh?: string;
  trustLabelEn?: string;
  searchTermsTh?: string[];
  searchTermsEn?: string[];
}

// Cart
export interface CartItem {
  id: string;
  title: string;
  titleTh?: string;
  titleEn?: string;
  price: number;
  image: string;
  quantity: number;
  sellerId: string;
  sellerName: string;
  platform?: string;
  regionCode?: string;
  deliveryLabelTh?: string;
  deliveryLabelEn?: string;
  activationMethodTh?: string;
  activationMethodEn?: string;
}

// Orders
export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "fulfilling"
  | "delivered"
  | "disputed"
  | "refunded"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type FulfillmentStatus = "pending" | "processing" | "delivered" | "failed" | "cancelled";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  title: string;
  titleTh?: string;
  titleEn?: string;
  image: string;
  price: number;
  quantity: number;
  sellerId: string;
  keys: string[];
  platform: string;
  regionCode?: string;
  activationMethodTh?: string;
  activationMethodEn?: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  date: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  totalPrice: number;
  grossAmount: number;
  commissionAmount: number;
  sellerNetAmount: number;
  platformFeeRate: number;
  currency: string;
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
export type SellerProduct = Product;

// Seller option for product display/selection (lightweight)
export interface SellerOption {
  id: string;
  name: string;
  price: number;
  rating: number;
  salesCount: number;
  deliverySpeed: string;
  isOfficial?: boolean;
  verificationStatus?: SellerVerificationStatus;
  fulfillmentRate?: number;
}

export type SellerLedgerEntryType =
  | "sale_credit"
  | "commission_fee"
  | "refund_debit"
  | "manual_adjustment"
  | "withdrawal";

export interface SellerLedgerEntry {
  id: string;
  sellerId: string;
  orderId?: string;
  type: SellerLedgerEntryType;
  amount: number;
  currency: string;
  createdAt: string;
  description: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface SellerWalletSummary {
  availableBalance: number;
  pendingBalance: number;
  grossSales: number;
  totalCommission: number;
  netEarnings: number;
  entryCount: number;
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
