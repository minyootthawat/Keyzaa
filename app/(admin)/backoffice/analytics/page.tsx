"use client";

import AdminRouteGuard from "@/app/components/AdminRouteGuard";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import { formatThaiBaht } from "@/app/lib/marketplace";

interface AnalyticsResponse {
  revenueByDay: { date: string; amount: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { id: string; name: string; sold: number; revenue: number }[];
  topSellers: { id: string; storeName: string; sales: number; revenue: number }[];
  newUsersByDay: { date: string; count: number }[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    newUsers: number;
    activeSellers: number;
    avgOrderValue: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  processing: "bg-blue-500",
  shipped: "bg-purple-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  paid: "bg-green-500",
  failed: "bg-red-500",
  refunded: "bg-gray-500",
};

const STATUS_LABELS: Record<string, { th: string; en: string }> = {
  pending: { th: "รอดำเนินการ", en: "Pending" },
  processing: { th: "กำลังประมวลผล", en: "Processing" },
  shipped: { th: "จัดส่งแล้ว", en: "Shipped" },
  delivered: { th: "สำเร็จ", en: "Delivered" },
  cancelled: { th: "ยกเลิก", en: "Cancelled" },
  paid: { th: "ชำระแล้ว", en: "Paid" },
  failed: { th: "ล้มเหลว", en: "Failed" },
  refunded: { th: "คืนเงิน", en: "Refunded" },
};

function formatDate(dateStr: string, lang: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(dateStr: string, lang: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminAnalyticsPage() {
  return (
    <AdminRouteGuard requiredPermission="admin:analytics:read">
      <AnalyticsContent />
    </AdminRouteGuard>
  );
}

function AnalyticsContent() {
  const { lang } = useLanguage();
  const { adminRole } = useAuth();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/backoffice/analytics")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((d) => {
        setData(d as AnalyticsResponse);
        setError(null);
      })
      .catch(() => setError(lang === "th" ? "โหลดข้อมูลไม่สำเร็จ" : "Failed to load"))
      .finally(() => setLoading(false));
  }, [lang]);

  const maxRevenue = useMemo(() => {
    if (!data) return 1;
    return Math.max(...data.revenueByDay.map((d) => d.amount), 1);
  }, [data]);

  const maxUsers = useMemo(() => {
    if (!data) return 1;
    return Math.max(...data.newUsersByDay.map((d) => d.count), 1);
  }, [data]);

  const totalStatusCount = useMemo(() => {
    if (!data) return 0;
    return data.ordersByStatus.reduce((s, d) => s + d.count, 0);
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 animate-pulse rounded-lg bg-bg-subtle/40" />
            <div className="mt-1 h-4 w-64 animate-pulse rounded bg-bg-subtle/40" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="surface-card h-28 animate-pulse rounded-2xl bg-bg-subtle/40" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface-card h-72 animate-pulse rounded-2xl bg-bg-subtle/40" />
          <div className="surface-card h-72 animate-pulse rounded-2xl bg-bg-subtle/40" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-bg-subtle/20 py-16 text-center">
        <p className="text-text-muted">{error ?? "ไม่พบข้อมูล"}</p>
      </div>
    );
  }

  const t = (key: string) =>
    ({
      heading: lang === "th" ? "แดชบอร์ด Analytics" : "Analytics Dashboard",
      subtitle: lang === "th" ? "สถิติและแนวโน้มของแพลตฟอร์ม" : "Platform statistics and trends",
      totalRevenue: lang === "th" ? "รายได้รวม" : "Total Revenue",
      totalOrders: lang === "th" ? "คำสั่งซื้อทั้งหมด" : "Total Orders",
      newUsers30d: lang === "th" ? "ผู้ใช้ใหม่ (30 วัน)" : "New Users (30d)",
      activeSellers: lang === "th" ? "ร้านค้าที่ยืนยันแล้ว" : "Active Sellers",
      avgOrderValue: lang === "th" ? "มูลค่าคำสั่งซื้อเฉลี่ย" : "Avg Order Value",
      revenueTitle: lang === "th" ? "รายได้รายวัน (30 วัน)" : "Daily Revenue (30 Days)",
      ordersStatusTitle: lang === "th" ? "คำสั่งซื้อตามสถานะ" : "Orders by Status",
      topProductsTitle: lang === "th" ? "สินค้าขายดี" : "Top Products",
      topSellersTitle: lang === "th" ? "ร้านค้าขายดี" : "Top Sellers",
      newUsersTitle: lang === "th" ? "ผู้ใช้ใหม่ (30 วัน)" : "New Users (30 Days)",
      product: lang === "th" ? "สินค้า" : "Product",
      unitsSold: lang === "th" ? "ขายแล้ว" : "Units Sold",
      revenue: lang === "th" ? "รายได้" : "Revenue",
      storeName: lang === "th" ? "ชื่อร้าน" : "Store Name",
      sales: lang === "th" ? "คำสั่งซื้อ" : "Orders",
      last30d: lang === "th" ? "30 วันล่าสุด" : "Last 30 days",
      noData: lang === "th" ? "ยังไม่มีข้อมูล" : "No data yet",
    }[key]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="type-h2 text-text-main">{t("heading")}</h1>
        <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="surface-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{t("totalRevenue")}</p>
          <p className="mt-2 text-2xl font-black text-green-400">
            {formatThaiBaht(data.summary.totalRevenue)}
          </p>
        </div>
        <div className="surface-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{t("totalOrders")}</p>
          <p className="mt-2 text-2xl font-black text-text-main">
            {data.summary.totalOrders.toLocaleString()}
          </p>
        </div>
        <div className="surface-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{t("newUsers30d")}</p>
          <p className="mt-2 text-2xl font-black text-blue-400">
            +{data.summary.newUsers.toLocaleString()}
          </p>
        </div>
        <div className="surface-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{t("activeSellers")}</p>
          <p className="mt-2 text-2xl font-black text-purple-400">
            {data.summary.activeSellers.toLocaleString()}
          </p>
        </div>
        <div className="surface-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{t("avgOrderValue")}</p>
          <p className="mt-2 text-2xl font-black text-yellow-400">
            {formatThaiBaht(data.summary.avgOrderValue)}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="surface-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-text-main">{t("revenueTitle")}</h2>
          {data.revenueByDay.length === 0 || data.summary.totalRevenue === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-text-muted">
              {t("noData")}
            </div>
          ) : (
            <div className="mt-4 flex items-end gap-1" style={{ height: 160 }}>
              {data.revenueByDay.map((d) => {
                const heightPct = maxRevenue > 0 ? (d.amount / maxRevenue) * 100 : 0;
                return (
                  <div
                    key={d.date}
                    className="group relative flex-1 cursor-pointer"
                    title={`${formatFullDate(d.date, lang)}: ${formatThaiBaht(d.amount)}`}
                  >
                    <div
                      className="w-full rounded-sm bg-gradient-to-t from-brand-primary/60 to-brand-primary transition-all duration-200 hover:from-brand-primary/80 hover:to-brand-primary"
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                    />
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-max -translate-x-1/2 rounded-lg bg-bg-elevated px-2 py-1 text-xs shadow-lg group-hover:block">
                      <p className="font-semibold">{formatDate(d.date, lang)}</p>
                      <p className="text-green-400">{formatThaiBaht(d.amount)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* X-axis labels */}
          <div className="mt-2 flex justify-between text-xs text-text-muted">
            <span>{formatDate(data.revenueByDay[0]?.date ?? "", lang)}</span>
            <span>{formatDate(data.revenueByDay[data.revenueByDay.length - 1]?.date ?? "", lang)}</span>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="surface-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-text-main">{t("ordersStatusTitle")}</h2>
          {data.ordersByStatus.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-text-muted">
              {t("noData")}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {data.ordersByStatus
                .sort((a, b) => b.count - a.count)
                .map((s) => {
                  const pct = totalStatusCount > 0 ? (s.count / totalStatusCount) * 100 : 0;
                  const color = STATUS_COLORS[s.status] ?? "bg-gray-500";
                  const label = STATUS_LABELS[s.status] ?? { th: s.status, en: s.status };
                  return (
                    <div key={s.status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-text-main">
                          {lang === "th" ? label.th : label.en}
                        </span>
                        <span className="text-text-muted">
                          {s.count} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-subtle">
                        <div
                          className={`h-full rounded-full ${color} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* New Users Chart */}
      <div className="surface-card rounded-2xl p-5">
        <h2 className="text-sm font-bold text-text-main">{t("newUsersTitle")}</h2>
        {data.newUsersByDay.length === 0 || data.summary.newUsers === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-text-muted">
            {t("noData")}
          </div>
        ) : (
          <div className="mt-4 flex items-end gap-0.5" style={{ height: 120 }}>
            {data.newUsersByDay.map((d) => {
              const heightPct = maxUsers > 0 ? (d.count / maxUsers) * 100 : 0;
              return (
                <div
                  key={d.date}
                  className="group relative flex-1 cursor-pointer"
                  title={`${formatFullDate(d.date, lang)}: +${d.count}`}
                >
                  <div
                    className="w-full rounded-sm bg-blue-500/60 transition-all duration-200 hover:bg-blue-500"
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                  />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-max -translate-x-1/2 rounded-lg bg-bg-elevated px-2 py-1 text-xs shadow-lg group-hover:block">
                    <p className="font-semibold">{formatDate(d.date, lang)}</p>
                    <p className="text-blue-400">+{d.count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-2 flex justify-between text-xs text-text-muted">
          <span>{formatDate(data.newUsersByDay[0]?.date ?? "", lang)}</span>
          <span>{formatDate(data.newUsersByDay[data.newUsersByDay.length - 1]?.date ?? "", lang)}</span>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="surface-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-text-main">{t("topProductsTitle")}</h2>
          {data.topProducts.length === 0 ? (
            <div className="mt-6 flex items-center justify-center text-sm text-text-muted">
              {t("noData")}
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left">
                    <th className="pb-2 text-xs font-bold uppercase tracking-wide text-text-muted">#</th>
                    <th className="pb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                      {t("product")}
                    </th>
                    <th className="pb-2 text-right text-xs font-bold uppercase tracking-wide text-text-muted">
                      {t("unitsSold")}
                    </th>
                    <th className="pb-2 text-right text-xs font-bold uppercase tracking-wide text-text-muted">
                      {t("revenue")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.topProducts.map((p, i) => (
                    <tr key={p.id} className="text-text-main">
                      <td className="py-2.5 text-text-muted">{i + 1}</td>
                      <td className="py-2.5 font-medium">{p.name}</td>
                      <td className="py-2.5 text-right">{p.sold.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-semibold text-green-400">
                        {formatThaiBaht(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Sellers */}
        <div className="surface-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-text-main">{t("topSellersTitle")}</h2>
          {data.topSellers.length === 0 ? (
            <div className="mt-6 flex items-center justify-center text-sm text-text-muted">
              {t("noData")}
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left">
                    <th className="pb-2 text-xs font-bold uppercase tracking-wide text-text-muted">#</th>
                    <th className="pb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                      {t("storeName")}
                    </th>
                    <th className="pb-2 text-right text-xs font-bold uppercase tracking-wide text-text-muted">
                      {t("sales")}
                    </th>
                    <th className="pb-2 text-right text-xs font-bold uppercase tracking-wide text-text-muted">
                      {t("revenue")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.topSellers.map((s, i) => (
                    <tr key={s.id} className="text-text-main">
                      <td className="py-2.5 text-text-muted">{i + 1}</td>
                      <td className="py-2.5 font-medium">{s.storeName}</td>
                      <td className="py-2.5 text-right">{s.sales.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-semibold text-green-400">
                        {formatThaiBaht(s.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
