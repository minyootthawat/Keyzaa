import type { Order, OrderItem, OrderStatus, PaymentStatus, FulfillmentStatus, Product, SellerLedgerEntry, SellerWalletSummary } from "@/app/types";
import { getSellerById } from "@/lib/db/supabase";
import { getProductsBySeller } from "@/lib/db/supabase";

export const MARKETPLACE_COMMISSION_RATE = Number(process.env.PLATFORM_COMMISSION_RATE || "0.12");
export const MARKETPLACE_CURRENCY = "THB";

export function calculateMarketplaceAmounts(grossAmount: number) {
  const commissionAmount = Math.round(grossAmount * MARKETPLACE_COMMISSION_RATE * 100) / 100;
  const sellerNetAmount = Math.round((grossAmount - commissionAmount) * 100) / 100;

  return {
    grossAmount,
    commissionAmount,
    sellerNetAmount,
    platformFeeRate: MARKETPLACE_COMMISSION_RATE,
    currency: MARKETPLACE_CURRENCY,
  };
}

export function mapOrderDocument(document: {
  orderId: string;
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
}): Order {
  return {
    id: document.orderId,
    buyerId: document.buyerId,
    sellerId: document.sellerId,
    date: document.date,
    status: document.status,
    paymentStatus: document.paymentStatus,
    fulfillmentStatus: document.fulfillmentStatus,
    totalPrice: document.totalPrice,
    grossAmount: document.grossAmount,
    commissionAmount: document.commissionAmount,
    sellerNetAmount: document.sellerNetAmount,
    platformFeeRate: document.platformFeeRate,
    currency: document.currency,
    paymentMethod: document.paymentMethod,
    items: document.items,
  };
}

export function deriveOrderState(status: OrderStatus): {
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
} {
  if (status === "pending_payment") {
    return { paymentStatus: "pending", fulfillmentStatus: "pending" };
  }

  if (status === "cancelled") {
    return { paymentStatus: "failed", fulfillmentStatus: "cancelled" };
  }

  if (status === "refunded") {
    return { paymentStatus: "refunded", fulfillmentStatus: "cancelled" };
  }

  if (status === "paid") {
    return { paymentStatus: "paid", fulfillmentStatus: "pending" };
  }

  if (status === "fulfilling") {
    return { paymentStatus: "paid", fulfillmentStatus: "processing" };
  }

  if (status === "disputed") {
    return { paymentStatus: "paid", fulfillmentStatus: "failed" };
  }

  return { paymentStatus: "paid", fulfillmentStatus: "delivered" };
}

export function buildLedgerEntries(params: {
  sellerId: string;
  orderId: string;
  grossAmount: number;
  commissionAmount: number;
  sellerNetAmount: number;
  createdAt: string;
}): Array<Omit<SellerLedgerEntry, "id">> {
  return [
    {
      sellerId: params.sellerId,
      orderId: params.orderId,
      type: "sale_credit",
      amount: params.sellerNetAmount,
      currency: MARKETPLACE_CURRENCY,
      createdAt: params.createdAt,
      description: "Seller net settlement from marketplace sale",
      metadata: {
        grossAmount: params.grossAmount,
        commissionAmount: params.commissionAmount,
      },
    },
    {
      sellerId: params.sellerId,
      orderId: params.orderId,
      type: "commission_fee",
      amount: -params.commissionAmount,
      currency: MARKETPLACE_CURRENCY,
      createdAt: params.createdAt,
      description: "Platform fee retained by Keyzaa",
      metadata: {
        grossAmount: params.grossAmount,
        sellerNetAmount: params.sellerNetAmount,
      },
    },
  ];
}

export function calculateWalletSummary(entries: SellerLedgerEntry[]): SellerWalletSummary {
  let availableBalance = 0;
  const pendingBalance = 0;
  let grossSales = 0;
  let totalCommission = 0;
  let netEarnings = 0;

  for (const entry of entries) {
    if (entry.type === "sale_credit") {
      availableBalance += entry.amount;
      netEarnings += entry.amount;
      const grossAmount = Number(entry.metadata?.grossAmount || 0);
      grossSales += grossAmount;
    }

    if (entry.type === "commission_fee") {
      totalCommission += Math.abs(entry.amount);
    }

    if (entry.type === "refund_debit" || entry.type === "withdrawal" || entry.type === "manual_adjustment") {
      availableBalance += entry.amount;
    }
  }

  return {
    availableBalance: Math.round(availableBalance * 100) / 100,
    pendingBalance: Math.round(pendingBalance * 100) / 100,
    grossSales: Math.round(grossSales * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    netEarnings: Math.round(netEarnings * 100) / 100,
    entryCount: entries.length,
  };
}

export async function getSellerByIdFromDb(sellerId: string) {
  const seller = await getSellerById(sellerId);
  if (!seller) return null;
  return {
    id: seller.id,
    userId: seller.user_id,
    shopName: seller.store_name,
    phone: seller.phone ?? "",
    rating: seller.rating,
    salesCount: seller.sales_count,
    balance: seller.balance,
    pendingBalance: seller.pending_balance,
    verificationStatus: seller.verified ? "verified" as const : "new" as const,
    responseTimeMinutes: seller.response_time_minutes,
    fulfillmentRate: seller.fulfillment_rate,
    disputeRate: seller.dispute_rate,
    payoutStatus: seller.payout_status,
    createdAt: seller.created_at,
  };
}

export async function getProductsBySellerId(sellerId: string): Promise<Product[]> {
  const products = await getProductsBySeller(sellerId);
  return products.map((p) => ({
    id: p.id,
    title: p.name,
    nameTh: p.name,
    nameEn: p.name,
    image: p.image_url ?? "",
    price: p.price,
    originalPrice: p.price,
    discount: 0,
    category: p.category,
    platform: "",
    sellerId: p.seller_id,
    stock: p.stock,
    soldCount: 0,
    isActive: p.is_active,
    description: p.description ?? "",
    createdAt: p.created_at,
  }));
}
