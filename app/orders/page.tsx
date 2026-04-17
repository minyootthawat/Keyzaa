"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import OrderCard from "@/app/components/OrderCard";
import CTAButton from "@/app/components/CTAButton";
import type { Order } from "@/app/types";

export default function BuyerOrdersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem("keyzaa_orders");
      if (saved) {
        try {
          const allOrders: Order[] = JSON.parse(saved);
          const userOrders = user
            ? allOrders.filter((o) => o.buyerId === user.id)
            : [];
          setOrders(userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch {
          setOrders([]);
        }
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="section-container max-w-3xl py-8 md:py-12">
      <h1 className="type-h1 mb-8">{t("buyerOrders_title")}</h1>

      {orders.length === 0 ? (
        <div className="surface-card glass-panel p-12 text-center space-y-4">
          <p className="text-4xl">📦</p>
          <h2 className="type-h2 text-text-main">{t("buyerOrders_empty")}</h2>
          <p className="type-body text-text-subtle">{t("buyerOrders_emptyDesc")}</p>
          <Link href="/products" className="inline-block mt-4">
            <CTAButton>{t("buyerOrders_shopNow")}</CTAButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              showSellerName
              viewDetailsLabel={t("buyerOrders_viewDetails")}
              orderIdLabel={t("buyerOrders_orderId")}
              dateLabel={t("buyerOrders_date")}
              totalLabel={t("buyerOrders_total")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
