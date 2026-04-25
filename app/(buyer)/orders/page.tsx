"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { getStoredToken } from "@/app/lib/auth-client";
import { useLanguage } from "@/app/context/LanguageContext";
import OrderCard from "@/app/components/OrderCard";
import CTAButton from "@/app/components/CTAButton";
import BuyerRouteGuard from "@/app/components/BuyerRouteGuard";
import type { Order } from "@/app/types";

function BuyerOrdersContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const token = getStoredToken();

    if (!user || !token) {
      return;
    }

    const controller = new AbortController();

    fetch("/api/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load orders");
        }

        const data = (await response.json()) as { orders: Order[] };
        setOrders(data.orders);
      })
      .catch(() => {
        setOrders([]);
      });

    return () => controller.abort();
  }, [user]);

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

export default function BuyerOrdersPage() {
  return (
    <BuyerRouteGuard>
      <BuyerOrdersContent />
    </BuyerRouteGuard>
  );
}
