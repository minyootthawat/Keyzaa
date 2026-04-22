import productsData from "@/data/products.json";
import sellersData from "@/data/sellers.json";
import type { Order, OrderItem, OrderStatus, PaymentStatus, FulfillmentStatus, Product, Seller, SellerLedgerEntry, SellerWalletSummary } from "@/app/types";

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

export function getStaticSellerSeedById(sellerId: string) {
  return (sellersData as Seller[]).find((seller) => seller.id === sellerId) || null;
}

export function getStaticProductsBySellerId(sellerId: string) {
  return (productsData as Product[]).filter((product) => product.sellerId === sellerId);
}
