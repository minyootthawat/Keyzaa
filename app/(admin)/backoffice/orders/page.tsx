"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageShell from "@/app/components/backoffice/admin-page-shell";
import AdminStatusBadge from "@/app/components/backoffice/admin-status-badge";
import { useLanguage } from "@/app/context/LanguageContext";
import { fetchBackoffice, type BackofficeOrder, type BackofficeOrdersResponse } from "@/app/lib/backoffice";
import { formatThaiBaht } from "@/app/lib/marketplace";

const ORDER_STATUSES = ["all", "pending_payment", "paid", "fulfilling", "delivered", "disputed"] as const;

export default function AdminOrdersPage() {
  const { lang } = useLanguage();
  const [orders, setOrders] = useState<BackofficeOrder[]>([]);
  const [status, setStatus] = useState<(typeof ORDER_STATUSES)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const query = status === "all" ? "" : `?status=${encodeURIComponent(status)}`;

    fetchBackoffice<BackofficeOrdersResponse>(`/api/backoffice/orders${query}`, controller.signal)
      .then((response) => {
        setOrders(response.orders);
        setError(null);
      })
      .catch(() => {
        setOrders([]);
        setError(lang === "th" ? "โหลดรายการออเดอร์ไม่สำเร็จ" : "Failed to load order operations.");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [lang, status]);

  const stats = useMemo(() => {
    const paidCount = orders.filter((order) => order.status === "paid" || order.status === "delivered").length;
    const disputedCount = orders.filter((order) => order.status === "disputed").length;
    const grossVolume = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    return [
      {
        label: lang === "th" ? "ออเดอร์ในมุมมองนี้" : "Orders in view",
        value: orders.length.toLocaleString(),
      },
      {
        label: lang === "th" ? "สำเร็จหรือชำระแล้ว" : "Paid or delivered",
        value: paidCount.toLocaleString(),
      },
      {
        label: lang === "th" ? "ข้อพิพาท" : "Disputes",
        value: disputedCount.toLocaleString(),
      },
      {
        label: lang === "th" ? "มูลค่ารวม" : "Gross value",
        value: `฿${formatThaiBaht(grossVolume)}`,
      },
    ];
  }, [lang, orders]);

  return (
    <AdminPageShell
      eyebrow={lang === "th" ? "Order Operations" : "Order Operations"}
      title={lang === "th" ? "ระบบติดตามออเดอร์" : "Order operations"}
      description={
        lang === "th"
          ? "ตรวจสอบสถานะการชำระเงิน การส่งมอบ และสัญญาณเสี่ยงของธุรกรรมหลักจากพื้นที่เดียว"
          : "Monitor payment states, fulfillment progress, and risk signals for marketplace transactions."
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
          {ORDER_STATUSES.map((item) => {
            const active = status === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "border-warning/20 bg-warning/10 text-warning"
                    : "border-white/10 bg-white/[0.04] text-text-subtle hover:text-text-main"
                }`}
              >
                {item === "all" ? (lang === "th" ? "ทั้งหมด" : "All") : item}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="mt-5 h-48 animate-pulse rounded-2xl bg-bg-base/60" />
        ) : error ? (
          <div className="mt-5 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-6 text-sm text-danger">
            {error}
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-text-muted">
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ออเดอร์" : "Order"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ผู้ซื้อ" : "Buyer"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ร้าน" : "Seller"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "จำนวน" : "Qty"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "มูลค่า" : "Value"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "สถานะ" : "Status"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ชำระเงิน" : "Payment"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "สร้างเมื่อ" : "Created"}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/6 align-top last:border-b-0">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-text-main">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="mt-1 text-xs text-text-muted">{order.productId.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-text-main">{order.buyerName}</p>
                      <p className="mt-1 text-xs text-text-muted">{order.buyerEmail || order.buyerId}</p>
                    </td>
                    <td className="px-4 py-4 text-text-subtle">{order.sellerStoreName}</td>
                    <td className="type-num px-4 py-4 text-text-subtle">{order.quantity}</td>
                    <td className="type-num px-4 py-4 font-semibold text-text-main">฿{formatThaiBaht(order.totalPrice)}</td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge label={order.status} />
                    </td>
                    <td className="px-4 py-4 text-text-subtle">{order.paymentMethod || "-"}</td>
                    <td className="px-4 py-4 text-text-muted">
                      {new Date(order.createdAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-US")}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-text-muted">
                      {lang === "th" ? "ไม่พบออเดอร์ในเงื่อนไขนี้" : "No orders found for this filter."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
