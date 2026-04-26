"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatCard from "@/app/components/StatCard";
import SectionHeader from "@/app/components/SectionHeader";
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
  totalOrdersPages?: number;
}

// Static sparkline data patterns for KPI cards
const SPARKLINE_GROSS = [65, 80, 55, 90, 70, 95, 85];
const SPARKLINE_NET = [45, 60, 80, 50, 95, 70, 88];
const SPARKLINE_PAYOUT = [90, 70, 60, 85, 55, 75, 80];
const SPARKLINE_ORDERS = [55, 75, 90, 65, 80, 70, 95];

export default function SellerDashboardPage() {
  const { t, lang } = useLanguage();
  const { seller } = useAuth();
  const [overview, setOverview] = useState<SellerOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersPage, setOrdersPage] = useState(1);
  const ORDERS_LIMIT = 10;
  const [totalOrdersPages, setTotalOrdersPages] = useState(1);

  const fetchOverview = (page: number) => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const doFetch = async () => {
      try {
        const response = await fetch(`/api/seller/overview?page=${page}&limit=${ORDERS_LIMIT}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("API failed");
        const data = (await response.json()) as SellerOverviewResponse;
        setOverview(data);
        if (data.totalOrdersPages !== undefined) {
          setTotalOrdersPages(data.totalOrdersPages);
        }
      } catch {
        // API unavailable, leave overview as null (show empty state)
      } finally {
        setLoading(false);
      }
    };
    doFetch();

    return () => controller.abort();
  };

  useEffect(() => {
    fetchOverview(ordersPage);
  }, [ordersPage]);

  const statCards = useMemo(() => {
    const kpis = overview?.kpis;
    return [
      {
        label: t("seller_grossSales"),
        value: `฿${formatThaiBaht(kpis?.grossSales ?? 0)}`,
        delta: "↑ 12%",
        deltaColor: "text-accent" as const,
        sparklineData: SPARKLINE_GROSS,
      },
      {
        label: t("seller_netEarnings"),
        value: `฿${formatThaiBaht(kpis?.netEarnings ?? 0)}`,
        delta: "↑ 8.5%",
        deltaColor: "text-accent" as const,
        sparklineData: SPARKLINE_NET,
      },
      {
        label: t("seller_availablePayout"),
        value: `฿${formatThaiBaht(kpis?.availableForPayout ?? 0)}`,
        delta: "↑ 3.2%",
        deltaColor: "text-accent" as const,
        sparklineData: SPARKLINE_PAYOUT,
      },
      {
        label: t("seller_paidOrders"),
        value: `${kpis?.orderCount ?? 0}`,
        delta: "↓ 1%",
        deltaColor: "text-danger" as const,
        sparklineData: SPARKLINE_ORDERS,
      },
    ];
  }, [t, overview]);

  if (loading) {
    return (
      <div className="space-y-6 md:space-y-7">
        <div className="h-28 w-full rounded-2xl bg-bg-surface/60 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="surface-card p-5">
              <div className="h-3 w-20 rounded bg-bg-surface/80 animate-pulse" />
              <div className="mt-3 h-8 w-28 rounded bg-bg-surface/80 animate-pulse" />
              <div className="mt-3 h-10 w-full rounded bg-bg-surface/60 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-48 w-full rounded-2xl bg-bg-surface/60 animate-pulse" />
      </div>
    );
  }

  const displayOrders = overview?.orders || [];

  const handlePrevPage = () => {
    if (ordersPage > 1) {
      setOrdersPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (ordersPage < totalOrdersPages) {
      setOrdersPage((p) => p + 1);
    }
  };

  const lowStockCount = overview?.products.filter((p) => p.stock < 10).length ?? 0;

  return (
    <div className="space-y-6 md:space-y-7">
      {/* Page header */}
      <SectionHeader
        title={t("seller_title")}
        subtitle={
          lang === "th"
            ? "พื้นที่ทำงานของผู้ขายสำหรับจัดการสินค้า คำสั่งซื้อ รายได้สุทธิ และความพร้อมในการถอนเงินบนแพลตฟอร์มกลาง"
            : "Seller workspace for listings, orders, settlement totals, and payout readiness."
        }
        cta={{
          label: t("seller_addNewProduct"),
          href: seller?.verificationStatus === "verified" ? "/seller/dashboard/products" : undefined,
          disabled: seller?.verificationStatus !== "verified",
        }}
      />

      {/* Verification pending banner */}
      {seller?.verificationStatus === "new" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 shrink-0" width="20" height="20" fill="none" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="9" stroke="#F59E0B" strokeWidth="1.5" />
              <path d="M10 6v5M10 13.5h.01" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div>
              <p className="font-semibold text-warning">
                {lang === "th" ? "ร้านค้าของคุณกำลังรอการตรวจสอบ" : "Your store is pending review"}
              </p>
              <p className="mt-1 text-sm text-text-subtle">
                {lang === "th"
                  ? "ทีมงานกำลังตรวจสอบร้านค้าของคุณ คุณจะสามารถเพิ่มสินค้าได้หลังผ่านการอนุมัติ"
                  : "Our team is reviewing your store. You'll be able to list products once approved."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">
          <svg className="shrink-0" width="20" height="20" fill="none" viewBox="0 0 20 20">
            <path d="M10 3.5L18 17H2L10 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M10 9v3M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="font-medium">
            {lang === "th"
              ? `มี ${lowStockCount} รายการที่สต็อกใกล้หมด (ต่ำกว่า 10 ชิ้น)`
              : `${lowStockCount} items running low on stock`}
          </span>
        </div>
      )}

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <a
          href="/seller/dashboard/products"
          className="btn-primary flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {t("seller_addNewProduct")}
        </a>
        <Link
          href="/seller/dashboard/orders"
          className="btn-primary flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
            <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {t("seller_viewOrders")}
        </Link>
        <a
          href="/seller/dashboard/wallet"
          className="btn-primary flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v6M6 7l2 2 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("seller_withdraw")}
        </a>
      </div>

      {/* Recent orders */}
      <div className="surface-card motion-fade-up p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="type-h2">{t("seller_recentOrders")}</h2>
          {totalOrdersPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={ordersPage === 1}
                className="rounded-lg bg-bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 transition-all"
              >
                {lang === "th" ? "ก่อนหน้า" : "Previous"}
              </button>
              <span className="text-sm text-text-subtle">
                {lang === "th"
                  ? `หน้า ${ordersPage} จาก ${totalOrdersPages}`
                  : `Page ${ordersPage} of ${totalOrdersPages}`}
              </span>
              <button
                onClick={handleNextPage}
                disabled={ordersPage >= totalOrdersPages}
                className="rounded-lg bg-bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 transition-all"
              >
                {lang === "th" ? "ถัดไป" : "Next"}
              </button>
            </div>
          )}
        </div>

        {displayOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <svg width="48" height="48" fill="none" viewBox="0 0 48 48" className="text-text-muted">
              <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M6 18h36M14 26h20M14 32h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="font-semibold text-text-main">{t("seller_noOrders")}</p>
            <p className="text-sm text-text-muted">{t("seller_noOrdersDesc")}</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {displayOrders.map((order) => (
              <div
                key={order.id}
                className="min-w-[240px] flex-1 rounded-2xl border border-border-subtle bg-bg-surface/80 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-text-main">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {new Date(
                        "created_at" in order ? (order as { created_at: string }).created_at : order.id
                      ).toLocaleDateString(lang === "th" ? "th-TH" : "en-US")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      order.status === "delivered" || order.status === "paid"
                        ? "bg-accent/20 text-accent"
                        : "bg-warning/20 text-warning"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="mt-3 type-num text-lg font-bold text-text-main">
                  ฿{formatThaiBaht(order.totalPrice)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order summary */}
      <div className="surface-card motion-fade-up p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="type-h2">{t("seller_orderSummary")}</h2>
          <p className="type-num text-sm font-semibold text-accent">
            {overview?.kpis.orderCount ?? 0} {t("seller_paidOrders")}
          </p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-bg-surface/90 p-4 shadow-[0_14px_24px_rgba(5,10,24,0.16)]">
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("seller_grossSales")}</p>
            <p className="type-num mt-2 text-xl font-bold text-text-main">
              ฿{formatThaiBaht(overview?.kpis.grossSales ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl bg-bg-surface/90 p-4 shadow-[0_14px_24px_rgba(5,10,24,0.16)]">
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("seller_netEarnings")}</p>
            <p className="type-num mt-2 text-xl font-bold text-accent">
              ฿{formatThaiBaht(overview?.kpis.netEarnings ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Listings table */}
      <div className="surface-card motion-fade-up overflow-hidden">
        <div className="px-5 py-4">
          <h2 className="type-h2">{t("seller_listings")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted">
                <th className="px-5 py-3 font-semibold">{t("seller_products")}</th>
                <th className="px-5 py-3 font-semibold">{t("seller_stock")}</th>
                <th className="px-5 py-3 font-semibold">{t("seller_sold")}</th>
                <th className="px-5 py-3 font-semibold">{t("seller_grossSales")}</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.products ?? []).map((product) => (
                <tr key={product.id} className="border-b border-border-subtle/50 hover:bg-bg-surface/40 transition-colors">
                  <td className="max-w-[260px] truncate px-5 py-4 font-semibold text-text-main">
                    {product.title}
                  </td>
                  <td className="px-5 py-4 text-text-subtle">{product.stock}</td>
                  <td className="type-num px-5 py-4 text-text-subtle">{product.soldCount}</td>
                  <td className="type-num px-5 py-4 font-semibold text-text-main">
                    ฿{formatThaiBaht(product.price * product.soldCount)}
                  </td>
                </tr>
              ))}
              {(!overview?.products || overview.products.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-text-muted">
                    {t("seller_noListings")}
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