"use client";

import { useEffect, useMemo, useState } from "react";
import CTAButton from "@/app/components/CTAButton";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import { getStoredToken } from "@/app/lib/auth-client";
import { formatThaiBaht } from "@/app/lib/marketplace";
import type { Order } from "@/app/types";

interface SellerOverviewResponse {
  kpis: {
    grossSales: number;
    netEarnings: number;
    availableForPayout: number;
    orderCount: number;
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

export default function SellerDashboardPage() {
  const { t, lang } = useLanguage();
  const { seller } = useAuth();
  const [overview, setOverview] = useState<SellerOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Try API first; fall back to mock data
    const controller = new AbortController();
    fetch("/api/seller/overview", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("API failed");
        const data = (await response.json()) as SellerOverviewResponse;
        setOverview(data);
      })
      .catch(() => {
        // API unavailable, leave overview as null (show empty state)
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const kpis = useMemo(
    () => [
      { label: lang === "th" ? "ยอดขายรวม" : "Gross sales", value: `฿${formatThaiBaht(overview?.kpis.grossSales || 0)}` },
      { label: lang === "th" ? "รายได้สุทธิ" : "Net earnings", value: `฿${formatThaiBaht(overview?.kpis.netEarnings || 0)}` },
      { label: lang === "th" ? "ยอดพร้อมถอน" : "Available for payout", value: `฿${formatThaiBaht(overview?.kpis.availableForPayout || 0)}` },
      { label: lang === "th" ? "ออเดอร์ที่ชำระแล้ว" : "Paid orders", value: `${overview?.kpis.orderCount || 0}` },
    ],
    [lang, overview]
  );

  if (loading) {
    return (
      <div className="space-y-6 md:space-y-7">
        <div className="h-28 w-full rounded-2xl bg-bg-surface/60 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="surface-card p-5">
              <div className="h-3 w-20 rounded bg-bg-surface/80 animate-pulse" />
              <div className="mt-3 h-8 w-28 rounded bg-bg-surface/80 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-48 w-full rounded-2xl bg-bg-surface/60 animate-pulse" />
      </div>
    );
  }

  const displayOrders = overview?.orders || [];

  return (
    <div className="space-y-6 md:space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="type-h1">{t("seller_title")}</h1>
          <p className="type-body mt-1 max-w-[58ch] text-text-subtle">
            {lang === "th"
              ? "พื้นที่ทำงานของผู้ขายสำหรับจัดการสินค้า คำสั่งซื้อ รายได้สุทธิ และความพร้อมในการถอนเงินบนแพลตฟอร์มกลาง"
              : "Seller workspace for listings, orders, settlement totals, and payout readiness."}
          </p>
          <p className="mt-2 text-sm text-text-muted">{seller?.shopName || "GameZone Shop"}</p>
        </div>
        <CTAButton>{t("seller_addProduct")}</CTAButton>
      </div>

      {/* Low stock alert */}
      {overview?.products.some((p) => p.stock < 10) && (
        <div className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">
          <svg className="shrink-0" width="20" height="20" fill="none" viewBox="0 0 20 20">
            <path d="M10 3.5L18 17H2L10 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M10 9v3M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="font-medium">
            {lang === "th"
              ? `มี ${overview.products.filter((p) => p.stock < 10).length} รายการที่สต็อกใกล้หมด (ต่ำกว่า 10 ชิ้น)`
              : `${overview.products.filter((p) => p.stock < 10).length} items running low on stock`}
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item, i) => {
          const sparkHeights = [[65, 80, 55, 90, 70, 95, 85], [45, 60, 80, 50, 95, 70, 88], [90, 70, 60, 85, 55, 75, 80], [55, 75, 90, 65, 80, 70, 95]];
          const trends = ["↑ 12%", "↑ 8.5%", "↑ 3.2%", "↓ 1%"];
          const trendColors = ["text-accent", "text-accent", "text-accent", "text-danger"];
          return (
            <div key={item.label} className="surface-card motion-fade-in p-5">
              <p className="text-xs text-text-muted">{item.label}</p>
              <p className="type-num mt-1 text-2xl font-extrabold text-text-main">{item.value}</p>
              <p className={`type-num mt-1 text-xs font-semibold ${trendColors[i]}`}>{trends[i]}</p>
              <div className="mt-3 flex h-10 items-end gap-[3px]">
                {sparkHeights[i].map((h, j) => (
                  <div
                    key={j}
                    className="w-3 rounded-t-sm bg-brand-primary/40 transition-all duration-300 hover:bg-brand-primary"
                    style={{ height: `${h}%`, opacity: j === 6 ? 1 : 0.5 + j * 0.08 }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <a href="/seller/dashboard/products" className="btn-primary flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          {lang === "th" ? "เพิ่มสินค้าใหม่" : "Add new product"}
        </a>
        <a href="/seller/dashboard/orders" className="btn-primary flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          {lang === "th" ? "ดูออเดอร์" : "View orders"}
        </a>
        <a href="/seller/dashboard/wallet" className="btn-primary flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M8 5v6M6 7l2 2 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {lang === "th" ? "ถอนเงิน" : "Withdraw"}
        </a>
      </div>

      {/* Recent orders */}
      <div className="surface-card motion-fade-up p-5 sm:p-6">
        <h2 className="type-h2 mb-4">{lang === "th" ? "ออเดอร์ล่าสุด" : "Recent orders"}</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {displayOrders.slice(0, 5).map((order) => (
            <div key={order.id} className="min-w-[240px] flex-1 rounded-2xl border border-border-subtle bg-bg-surface/80 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-text-main">#{order.id.slice(-6).toUpperCase()}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {new Date("created_at" in order ? (order as {created_at: string}).created_at : order.id).toLocaleDateString(lang === "th" ? "th-TH" : "en-US")}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${order.status === "delivered" || order.status === "paid" ? "bg-accent/20 text-accent" : "bg-warning/20 text-warning"}`}>
                  {order.status}
                </span>
              </div>
              <p className="mt-3 type-num text-lg font-bold text-text-main">฿{formatThaiBaht(order.totalPrice)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card motion-fade-up p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="type-h2">{lang === "th" ? "สรุปคำสั่งซื้อ" : "Marketplace order summary"}</h2>
          <p className="type-num text-sm font-semibold text-accent">
            {overview?.kpis.orderCount || 0} {lang === "th" ? "ออเดอร์ที่ชำระแล้ว" : "paid orders"}
          </p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-bg-surface/90 p-4 shadow-[0_14px_24px_rgba(5,10,24,0.16)]">
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{lang === "th" ? "ยอดรวม" : "Gross"}</p>
            <p className="type-num mt-2 text-xl font-bold text-text-main">฿{formatThaiBaht(overview?.kpis.grossSales || 0)}</p>
          </div>
          <div className="rounded-2xl bg-bg-surface/90 p-4 shadow-[0_14px_24px_rgba(5,10,24,0.16)]">
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{lang === "th" ? "สุทธิ" : "Net"}</p>
            <p className="type-num mt-2 text-xl font-bold text-accent">฿{formatThaiBaht(overview?.kpis.netEarnings || 0)}</p>
          </div>
        </div>
      </div>

      <div className="surface-card motion-fade-up overflow-hidden">
        <div className="px-5 py-4">
          <h2 className="type-h2">{lang === "th" ? "รายการสินค้าของร้าน" : "Seller-owned listings"}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-text-muted">
                <th className="px-5 py-3 font-semibold">{t("seller_products")}</th>
                <th className="px-5 py-3 font-semibold">{t("seller_stock")}</th>
                <th className="px-5 py-3 font-semibold">{t("seller_sold")}</th>
                <th className="px-5 py-3 font-semibold">{lang === "th" ? "ยอดขายรวม" : "Gross sales"}</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.products || []).map((product) => (
                <tr key={product.id}>
                  <td className="max-w-[260px] truncate px-5 py-4 font-semibold text-text-main">{product.title}</td>
                  <td className="px-5 py-4 text-text-subtle">{product.stock}</td>
                  <td className="type-num px-5 py-4 text-text-subtle">{product.soldCount}</td>
                  <td className="type-num px-5 py-4 font-semibold text-text-main">฿{formatThaiBaht(product.price * product.soldCount)}</td>
                </tr>
              ))}
              {(!overview?.products || overview.products.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-text-muted">
                    {lang === "th" ? "ยังไม่มีรายการสินค้าของร้าน" : "No seller-owned listings yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
