"use client";

import { useEffect, useMemo, useState } from "react";
import SellerPageShell from "@/app/components/seller/seller-page-shell";
import SellerStatusBadge from "@/app/components/seller/seller-status-badge";
import { useLanguage } from "@/app/context/LanguageContext";
import { formatThaiBaht } from "@/app/lib/marketplace";
import { fetchSellerDashboard } from "@/app/lib/seller-dashboard";
import type { Order } from "@/app/types";

const STATUS_FILTERS = ["all", "pending_payment", "paid", "fulfilling", "delivered"] as const;

export default function SellerOrdersPage() {
  const { lang } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchSellerDashboard<{ orders: Order[] }>("/api/seller/orders", controller.signal)
      .then((data) => {
        setOrders(data.orders);
        setError(null);
      })
      .catch(() => {
        setOrders([]);
        setError(lang === "th" ? "โหลดคำสั่งซื้อไม่สำเร็จ" : "Failed to load seller orders.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lang]);

  const visibleOrders = status === "all" ? orders : orders.filter((order) => order.status === status);
  const stats = useMemo(() => {
    const delivered = orders.filter((order) => order.status === "delivered").length;
    const processing = orders.filter((order) => order.status === "paid" || order.status === "fulfilling").length;
    const netTotal = orders.reduce((sum, order) => sum + order.sellerNetAmount, 0);

    return [
      { label: lang === "th" ? "ออเดอร์ทั้งหมด" : "All orders", value: `${orders.length}` },
      { label: lang === "th" ? "กำลังดำเนินการ" : "In progress", value: `${processing}` },
      { label: lang === "th" ? "ส่งสำเร็จ" : "Delivered", value: `${delivered}` },
      { label: lang === "th" ? "รายได้จากออเดอร์" : "Net order value", value: `฿${formatThaiBaht(netTotal)}` },
    ];
  }, [lang, orders]);

  return (
    <SellerPageShell
      eyebrow={lang === "th" ? "Order Operations" : "Order Operations"}
      title={lang === "th" ? "ระบบจัดการคำสั่งซื้อ" : "Order operations"}
      description={
        lang === "th"
          ? "รวมออเดอร์ของร้านไว้ในมุมเดียว เพื่อให้เห็นสถานะชำระเงิน การส่งมอบ และรายได้สุทธิของแต่ละงาน"
          : "A unified order view for payment state, fulfillment progress, and net revenue by order."
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-bg-surface/80 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
            <p className="type-num mt-2 text-2xl font-extrabold text-text-main">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-bg-surface/80 p-5">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                status === item
                  ? "border-brand-primary/20 bg-brand-primary/12 text-text-main"
                  : "border-white/10 bg-white/[0.04] text-text-subtle hover:text-text-main"
              }`}
            >
              {item === "all" ? (lang === "th" ? "ทั้งหมด" : "All") : item}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-5 h-48 animate-pulse rounded-2xl bg-bg-base/60" />
        ) : error ? (
          <div className="mt-5 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-6 text-danger">{error}</div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-text-muted">
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ออเดอร์" : "Order"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "จำนวนรายการ" : "Items"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ยอดรวม" : "Gross"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "สุทธิ" : "Net"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ชำระเงิน" : "Payment"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "สถานะ" : "Status"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "วันที่" : "Date"}</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/6 last:border-b-0">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-text-main">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="mt-1 text-xs text-text-muted">{order.id}</p>
                    </td>
                    <td className="px-4 py-4 text-text-subtle">{order.items.length}</td>
                    <td className="type-num px-4 py-4 text-text-subtle">฿{formatThaiBaht(order.grossAmount)}</td>
                    <td className="type-num px-4 py-4 font-semibold text-text-main">฿{formatThaiBaht(order.sellerNetAmount)}</td>
                    <td className="px-4 py-4 text-text-subtle">{order.paymentMethod || "-"}</td>
                    <td className="px-4 py-4"><SellerStatusBadge label={order.status} /></td>
                    <td className="px-4 py-4 text-text-muted">
                      {new Date(order.date).toLocaleDateString(lang === "th" ? "th-TH" : "en-US")}
                    </td>
                  </tr>
                ))}
                {visibleOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                      {lang === "th" ? "ไม่พบออเดอร์ในมุมมองนี้" : "No orders found in this view."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SellerPageShell>
  );
}
