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
      const timeout = window.setTimeout(() => {
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    const controller = new AbortController();

    fetch("/api/seller/overview", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load seller overview");
        }

        const data = (await response.json()) as SellerOverviewResponse;
        setOverview(data);
      })
      .catch(() => {
        setOverview(null);
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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="type-h1">{t("seller_title")}</h1>
          <p className="type-body mt-1 max-w-[58ch] text-text-subtle">
            {lang === "th"
              ? "พื้นที่ทำงานของผู้ขายสำหรับจัดการสินค้า คำสั่งซื้อ รายได้สุทธิ และความพร้อมในการถอนเงินบนแพลตฟอร์มกลาง"
              : "Seller workspace for listings, orders, settlement totals, and payout readiness on the central platform."}
          </p>
          <p className="mt-2 text-sm text-text-muted">{seller?.shopName}</p>
        </div>
        <CTAButton>{t("seller_addProduct")}</CTAButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.label} className="surface-card motion-fade-in p-5">
            <p className="text-xs text-text-muted">{item.label}</p>
            <p className="type-num mt-1 text-2xl font-extrabold text-text-main">{item.value}</p>
          </div>
        ))}
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
                  <td className="type-num px-5 py-4 font-semibold text-text-main">
                    ฿{formatThaiBaht(product.price * product.soldCount)}
                  </td>
                </tr>
              ))}
              {(overview?.products || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-text-muted">
                    {lang === "th" ? "ยังไม่มีรายการสินค้าของร้าน" : "No seller-owned listings yet."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
