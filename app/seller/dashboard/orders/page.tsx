"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import { getStoredToken } from "@/app/lib/auth-client";
import OrderCard from "@/app/components/OrderCard";
import type { Order } from "@/app/types";

export default function SellerOrdersPage() {
  const { seller } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      const timeout = window.setTimeout(() => {
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    const controller = new AbortController();

    fetch("/api/seller/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load seller orders");
        }

        const data = (await response.json()) as { orders: Order[] };
        setOrders(data.orders);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1">{t("sellerOrders_title")}</h1>
        <p className="type-body mt-1 text-text-subtle">{seller?.shopName}</p>
      </div>

      {orders.length === 0 ? (
        <div className="surface-card glass-panel p-12 text-center space-y-3">
          <p className="text-4xl">📦</p>
          <h2 className="type-h2 text-text-main">{t("sellerOrders_empty")}</h2>
          <p className="type-body text-text-subtle">{t("sellerOrders_emptyDesc")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              showSellerName={false}
              viewDetailsLabel="Marketplace order"
              orderIdLabel={t("sellerOrders_orderId")}
              dateLabel={t("buyerOrders_date")}
              totalLabel="Net earnings"
              amountOverride={order.sellerNetAmount}
              hideDetailsLink
            />
          ))}
        </div>
      )}
    </div>
  );
}
