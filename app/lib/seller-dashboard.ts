import { getStoredToken } from "@/app/lib/auth-client";
import type { Order, Product, SellerLedgerEntry, SellerWalletSummary } from "@/app/types";

export interface SellerOverviewResponse {
  kpis: {
    grossSales: number;
    netEarnings: number;
    availableForPayout: number;
    orderCount: number;
    platformFees?: number;
  };
  orders: Order[];
  products: Array<{
    id: string;
    title: string;
    stock: number;
    soldCount: number;
    price: number;
  }>;
}

export interface SellerProductsResponse {
  products: Product[];
}

export interface SellerWalletResponse {
  summary: SellerWalletSummary;
  entries: SellerLedgerEntry[];
}

export interface SellerMeResponse {
  seller: {
    id: string;
    userId?: string;
    shopName: string;
    phone: string;
    rating: number;
    salesCount: number;
    balance: number;
    pendingBalance: number;
    verificationStatus: string;
    payoutStatus?: string;
    responseTimeMinutes?: number;
    fulfillmentRate?: number;
    disputeRate?: number;
    createdAt?: string;
    totalGrossSales?: number;
    totalNetEarnings?: number;
    totalCommissionPaid?: number;
  };
}

export async function fetchSellerDashboard<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("missing-seller-token");
  }

  const response = await fetch(path, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`seller-dashboard-request-failed:${response.status}`);
  }

  return (await response.json()) as T;
}

export function getSellerStatusTone(status: string) {
  switch (status) {
    case "verified":
    case "active":
    case "paid":
    case "delivered":
    case "success":
      return "success";
    case "pending":
    case "pending_payment":
    case "fulfilling":
    case "processing":
    case "manual":
      return "warning";
    case "paused":
    case "out_of_stock":
    case "disputed":
    case "refunded":
    case "cancelled":
      return "danger";
    default:
      return "default";
  }
}
