"use client";

import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import type { Order } from "@/app/types";

interface OrderCardProps {
  order: Order;
  showSellerName?: boolean;
  viewDetailsLabel?: string;
  orderIdLabel?: string;
  dateLabel?: string;
  totalLabel?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  paid: "bg-brand-primary/20 text-brand-primary",
  delivered: "bg-success/20 text-accent",
  cancelled: "bg-danger/20 text-danger",
};

export default function OrderCard({
  order,
  showSellerName = false,
  viewDetailsLabel,
  orderIdLabel,
  dateLabel,
  totalLabel,
}: OrderCardProps) {
  const { t } = useLanguage();
  const vdLabel = viewDetailsLabel ?? t("buyerOrders_viewDetails");
  const oidLabel = orderIdLabel ?? t("buyerOrders_orderId");
  const dLabel = dateLabel ?? t("buyerOrders_date");
  const total = totalLabel ?? t("buyerOrders_total");

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="surface-card overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">{oidLabel}</span>
          <span className="font-mono text-sm font-bold text-text-main">{order.id}</span>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[order.status]}`}>
          {order.status === "delivered"
            ? t("sellerOrders_delivered")
            : order.status === "paid"
            ? t("sellerOrders_paid")
            : order.status === "pending"
            ? t("sellerOrders_pending")
            : order.status}
        </span>
      </div>
      <div className="p-5 space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-bg-surface overflow-hidden relative shrink-0">
              <img src={item.image} alt={item.title} className="object-cover w-full h-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-main truncate">{item.title}</p>
              {showSellerName && (
                <p className="text-xs text-text-muted">{item.sellerId}</p>
              )}
              <p className="text-xs text-text-muted">x{item.quantity}</p>
            </div>
            <p className="text-sm font-bold text-text-main shrink-0">
              ฿{(item.price * item.quantity).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-5 py-4 border-t border-border-subtle bg-bg-surface/50">
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span>{dLabel}: {formatDate(order.date)}</span>
          <span>{total}: <span className="font-bold text-text-main">฿{order.totalPrice.toLocaleString()}</span></span>
        </div>
        <Link
          href={`/orders/${order.id}`}
          className="rounded-xl bg-brand-primary/20 px-4 py-2 text-xs font-semibold text-brand-primary hover:bg-brand-primary/30 transition-colors"
        >
          {vdLabel}
        </Link>
      </div>
    </div>
  );
}
