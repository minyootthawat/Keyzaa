"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import OrderCard from "@/app/components/OrderCard";
import type { Order } from "@/app/types";

export default function SellerOrdersPage() {
  const { seller } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem("keyzaa_orders");
      if (saved) {
        try {
          const allOrders: Order[] = JSON.parse(saved);
          // Filter orders that have items for this seller
          const sellerOrders = allOrders
            .filter((o) => o.items.some((i) => i.sellerId === seller?.id))
            .map((o) => ({
              ...o,
              items: o.items.filter((i) => i.sellerId === seller?.id),
              totalPrice: o.items
                .filter((i) => i.sellerId === seller?.id)
                .reduce((sum, i) => sum + i.price * i.quantity, 0),
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setOrders(sellerOrders);
        } catch {
          setOrders([]);
        }
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [seller]);

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
              viewDetailsLabel={t("buyerOrders_viewDetails")}
              orderIdLabel={t("sellerOrders_orderId")}
              dateLabel={t("buyerOrders_date")}
              totalLabel={t("seller_revenue")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
