"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import { getStoredToken } from "@/app/lib/auth-client";
import OrderCard from "@/app/components/OrderCard";
import type { Order } from "@/app/types";


type ViewMode = "list" | "kanban";

const KANBAN_COLUMNS = [
  { key: "waiting", label: "รอดำเนินการ", statuses: ["pending_payment", "paid"] as const },
  { key: "processing", label: "กำลังดำเนินการ", statuses: ["fulfilling"] as const },
  { key: "done", label: "เสร็จสิ้น", statuses: ["delivered"] as const },
];

function KanbanCard({ order }: { order: Order }) {
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  };

  const statusColors: Record<string, string> = {
    pending_payment: "bg-warning/20 text-warning",
    paid: "bg-brand-primary/20 text-brand-primary",
    fulfilling: "bg-brand-primary/20 text-brand-primary",
    delivered: "bg-success/20 text-accent",
  };

  const getStatusLabel = () => {
    if (order.status === "delivered") return "เสร็จสิ้น";
    if (order.status === "paid" || order.status === "fulfilling") return "กำลังดำเนินการ";
    if (order.status === "pending_payment") return "รอดำเนินการ";
    return order.status;
  };

  return (
    <div className="surface-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-text-main">{order.id}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[order.status] ?? "bg-white/10 text-text-subtle"}`}>
          {getStatusLabel()}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{formatTime(order.date)}</span>
        <span className="text-sm font-bold text-text-main">
          ฿{order.sellerNetAmount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function SellerOrdersPage() {
  const { seller } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setLoading(false);
      return;
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
        // error — orders stay empty
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

  const getOrdersByColumn = (statuses: readonly string[]) =>
    orders.filter((o) => statuses.includes(o.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-h1">{t("sellerOrders_title")}</h1>
          <p className="type-body mt-1 text-text-subtle">{seller?.shopName}</p>
        </div>
        <div className="flex rounded-xl border border-border-subtle overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              viewMode === "list"
                ? "bg-brand-primary text-white"
                : "bg-surface-card text-text-muted hover:bg-bg-surface"
            }`}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              viewMode === "kanban"
                ? "bg-brand-primary text-white"
                : "bg-surface-card text-text-muted hover:bg-bg-surface"
            }`}
          >
            ▦ Kanban
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="surface-card glass-panel p-12 text-center space-y-3">
          <p className="text-4xl">📦</p>
          <h2 className="type-h2 text-text-main">{t("sellerOrders_empty")}</h2>
          <p className="type-body text-text-subtle">{t("sellerOrders_emptyDesc")}</p>
        </div>
      ) : viewMode === "kanban" ? (
        <div className="grid grid-cols-3 gap-4">
          {KANBAN_COLUMNS.map((col) => {
            const colOrders = getOrdersByColumn(col.statuses);
            return (
              <div key={col.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="type-body font-semibold text-text-main">{col.label}</h3>
                  <span className="text-xs text-text-muted bg-bg-surface px-2 py-0.5 rounded-full">
                    {colOrders.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {colOrders.length === 0 ? (
                    <div className="border border-dashed border-border-subtle rounded-xl p-6 text-center text-xs text-text-muted">
                      —
                    </div>
                  ) : (
                    colOrders.map((order) => <KanbanCard key={order.id} order={order} />)
                  )}
                </div>
              </div>
            );
          })}
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
