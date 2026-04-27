"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import { getStoredToken } from "@/app/lib/auth-client";
import { formatThaiBaht } from "@/app/lib/marketplace";
import SectionHeader from "@/app/components/SectionHeader";
import StatCard from "@/app/components/StatCard";
import type { Order, OrderStatus } from "@/app/types";

type FilterStatus = "all" | OrderStatus;

const STATUS_TABS: { key: FilterStatus; labelTh: string; labelEn: string }[] = [
  { key: "all", labelTh: "ทั้งหมด", labelEn: "All" },
  { key: "pending_payment", labelTh: "รอชำระ", labelEn: "Pending" },
  { key: "paid", labelTh: "ชำระแล้ว", labelEn: "Paid" },
  { key: "delivered", labelTh: "ส่งแล้ว", labelEn: "Delivered" },
  { key: "cancelled", labelTh: "ยกเลิก", labelEn: "Cancelled" },
  { key: "disputed", labelTh: "ข้อพิพาท", labelEn: "Disputed" },
];

// Sparkline data patterns for KPI cards
const SPARKLINE_ORDERS = [55, 70, 60, 85, 75, 90, 95];
const SPARKLINE_REVENUE = [80, 65, 90, 70, 85, 95, 100];
const SPARKLINE_PENDING = [30, 45, 60, 40, 55, 35, 50];
const SPARKLINE_DELIVERED = [70, 80, 75, 90, 85, 95, 100];

function StatusBadge({ status }: { status: OrderStatus }) {
  const config: Record<OrderStatus, { labelTh: string; labelEn: string; cls: string }> = {
    pending_payment: { labelTh: "รอชำระ", labelEn: "Pending", cls: "bg-warning/20 text-warning" },
    paid: { labelTh: "ชำระแล้ว", labelEn: "Paid", cls: "bg-brand-primary/20 text-brand-primary" },
    fulfilling: { labelTh: "กำลังดำเนินการ", labelEn: "Fulfilling", cls: "bg-brand-primary/20 text-brand-primary" },
    delivered: { labelTh: "ส่งแล้ว", labelEn: "Delivered", cls: "bg-accent/20 text-accent" },
    disputed: { labelTh: "ข้อพิพาท", labelEn: "Disputed", cls: "bg-danger/20 text-danger" },
    refunded: { labelTh: "คืนเงิน", labelEn: "Refunded", cls: "bg-text-muted/20 text-text-muted" },
    cancelled: { labelTh: "ยกเลิก", labelEn: "Cancelled", cls: "bg-text-muted/20 text-text-muted" },
  };
  const { lang } = useLanguage();
  const c = config[status] ?? { labelTh: status, labelEn: status, cls: "bg-white/10 text-text-subtle" };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.cls}`}>
      {lang === "th" ? c.labelTh : c.labelEn}
    </span>
  );
}

function formatDate(iso: string, lang: "th" | "en") {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface OrdersResponse {
  orders: Order[];
  totalPages: number;
  totalCount: number;
}

export default function SellerOrdersPage() {
  const { t, lang } = useLanguage();
  const { seller } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<"7" | "30" | "all">("30");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const isMountedRef = useRef(true);

  const fetchOrders = useCallback(
    (pageNum: number) => {
      const token = getStoredToken();
      if (!token) {
        if (isMountedRef.current) setLoading(false);
        return;
      }
      const controller = new AbortController();
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: "15",
        ...(filterStatus !== "all" ? { status: filterStatus } : {}),
        ...(dateRange !== "all" ? { days: dateRange } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      fetch(`/api/seller/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to load orders");
          const data = (await res.json()) as OrdersResponse;
          if (isMountedRef.current) {
            setOrders(data.orders);
            setTotalPages(data.totalPages);
            setTotalCount(data.totalCount);
          }
        })
        .catch(() => {
          // leave orders empty on error
        })
        .finally(() => { if (isMountedRef.current) setLoading(false); });
      return () => controller.abort();
    },
    [filterStatus, dateRange, search]
  );

  useEffect(() => {
    setTimeout(() => fetchOrders(page), 0);
    return () => { isMountedRef.current = false; };
  }, [fetchOrders, page]);

  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders(1);
  };

  const handleTabClick = (status: FilterStatus) => {
    setFilterStatus(status);
    setPage(1);
  };

  // KPI calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.sellerNetAmount, 0);
  const pendingCount = orders.filter((o) => o.status === "pending_payment").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  const statCards = [
    {
      label: lang === "th" ? "คำสั่งซื้อทั้งหมด" : "Total Orders",
      value: String(totalCount),
      delta: "↑ 8%",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_ORDERS,
    },
    {
      label: lang === "th" ? "รายได้รวม" : "Total Revenue",
      value: `฿${formatThaiBaht(totalRevenue)}`,
      delta: "↑ 12%",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_REVENUE,
    },
    {
      label: lang === "th" ? "รอชำระ" : "Pending",
      value: String(pendingCount),
      delta: pendingCount > 0 ? "⚠️" : "—",
      deltaColor: pendingCount > 0 ? "text-warning" as const : "text-text-muted" as const,
      sparklineData: SPARKLINE_PENDING,
    },
    {
      label: lang === "th" ? "ส่งแล้ว" : "Delivered",
      value: String(deliveredCount),
      delta: "↑ 5%",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_DELIVERED,
    },
  ];

  return (
    <div className="space-y-6 md:space-y-7">
      {/* Page header */}
      <SectionHeader
        title={t("sellerOrders_title")}
        subtitle={
          lang === "th"
            ? `ร้าน ${seller?.shopName ?? ""} · ดูและจัดการคำสั่งซื้อทั้งหมดของคุณ`
            : `${seller?.shopName ?? ""} · Manage and track all your orders`
        }
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Filter bar */}
      <div className="surface-card p-4">
        <div className="flex flex-col gap-4">
          {/* Status tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {STATUS_TABS.map((tab) => {
              const isActive = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-brand-primary/25 text-text-main border border-brand-primary/40"
                      : "bg-transparent text-text-muted hover:bg-bg-surface"
                  }`}
                >
                  {lang === "th" ? tab.labelTh : tab.labelEn}
                </button>
              );
            })}
          </div>

          {/* Search + date range row */}
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] flex gap-2">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  width="16" height="16" fill="none" viewBox="0 0 16 16"
                >
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={lang === "th" ? "ค้นหาคำสั่งซื้อ..." : "Search orders..."}
                  className="w-full rounded-xl border border-border-subtle bg-bg-surface pl-9 pr-4 py-2.5 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="btn-primary rounded-xl px-4 py-2.5 text-sm shrink-0"
              >
                {lang === "th" ? "ค้นหา" : "Search"}
              </button>
            </form>

            <div className="flex items-center gap-1.5">
              {(["7", "30", "all"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => { setDateRange(d); setPage(1); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    dateRange === d
                      ? "bg-brand-primary text-white"
                      : "bg-bg-surface text-text-muted hover:bg-bg-surface-hover"
                  }`}
                >
                  {d === "7" ? (lang === "th" ? "7 วัน" : "7 days") : d === "30" ? (lang === "th" ? "30 วัน" : "30 days") : (lang === "th" ? "ทั้งหมด" : "All")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results summary */}
      {!loading && (
        <p className="text-sm text-text-muted">
          {lang === "th"
            ? `แสดง ${orders.length} จาก ${totalCount} คำสั่งซื้อ`
            : `Showing ${orders.length} of ${totalCount} orders`}
        </p>
      )}

      {/* Orders table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                  {t("sellerOrders_orderId") ?? "Order ID"}
                </th>
                <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                  {lang === "th" ? "ผู้ซื้อ" : "Buyer"}
                </th>
                <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                  {lang === "th" ? "สินค้า" : "Products"}
                </th>
                <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                  {lang === "th" ? "ยอดรวม" : "Total"}
                </th>
                <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                  {lang === "th" ? "สถานะ" : "Status"}
                </th>
                <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                  {t("buyerOrders_date") ?? "Date"}
                </th>
                <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                  {lang === "th" ? "การดำเนินการ" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border-subtle/50">
                    <td className="px-5 py-4"><div className="h-4 w-20 rounded bg-bg-surface animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 rounded bg-bg-surface animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-36 rounded bg-bg-surface animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 rounded bg-bg-surface animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 rounded bg-bg-surface animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 rounded bg-bg-surface animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 rounded bg-bg-surface animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg width="48" height="48" fill="none" viewBox="0 0 48 48" className="text-text-muted">
                        <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
                        <path d="M6 18h36M14 26h20M14 32h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <p className="font-semibold text-text-main">{t("sellerOrders_empty")}</p>
                      <p className="text-sm text-text-muted">{t("sellerOrders_emptyDesc")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border-subtle/50 hover:bg-bg-surface/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-text-main">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-text-subtle">
                      {order.buyerId ? `Buyer-${order.buyerId.slice(-4)}` : "—"}
                    </td>
                    <td className="px-5 py-4 text-text-subtle">
                      <span className="truncate max-w-[200px] block">
                        {order.items.length > 0
                          ? `${order.items.length}× ${order.items[0].title}`
                          : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="type-num font-bold text-text-main">
                        ฿{formatThaiBaht(order.sellerNetAmount)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 text-text-muted text-xs">
                      {formatDate(order.date, lang)}
                    </td>
                    <td className="px-5 py-4">
                      <button className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-bg-surface hover:bg-bg-surface-hover text-text-subtle transition-all">
                        ⋮
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-subtle px-5 py-4">
            <p className="text-sm text-text-muted">
              {lang === "th"
                ? `หน้า ${page} จาก ${totalPages}`
                : `Page ${page} of ${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg bg-bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 transition-all"
              >
                {lang === "th" ? "ก่อนหน้า" : "Previous"}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg bg-bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 transition-all"
              >
                {lang === "th" ? "ถัดไป" : "Next"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
