import { getStoredToken } from "@/app/lib/auth-client";

export interface BackofficeOverviewResponse {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeListings: number;
}

export interface BackofficeOrder {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerStoreName: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackofficeOrdersResponse {
  orders: BackofficeOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface BackofficeProduct {
  id: string;
  sellerId: string;
  title: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  isActive: boolean;
  seller: {
    id: string;
    storeName: string;
    verified: boolean;
  };
}

export interface BackofficeProductsResponse {
  products: BackofficeProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface BackofficeSeller {
  id: string;
  storeName: string;
  phone: string;
  verified: boolean;
  balance: number;
  pendingBalance: number;
  salesCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
}

export interface BackofficeSellersResponse {
  sellers: BackofficeSeller[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchBackoffice<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("missing-admin-token");
  }

  const response = await fetch(path, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`backoffice-request-failed:${response.status}`);
  }

  return (await response.json()) as T;
}

export function getBackofficeStatusTone(status: string) {
  switch (status) {
    case "paid":
    case "delivered":
    case "active":
    case "verified":
      return "success";
    case "pending_payment":
    case "fulfilling":
    case "processing":
      return "warning";
    case "disputed":
    case "refunded":
    case "cancelled":
    case "failed":
      return "danger";
    default:
      return "default";
  }
}
