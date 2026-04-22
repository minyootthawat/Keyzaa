"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { formatThaiBaht } from "@/app/lib/marketplace";

interface AdminOverviewResponse {
  kpis: {
    buyers: number;
    sellers: number;
    orders: number;
    activeListings: number;
    grossVolume: number;
    platformRevenue: number;
  };
  recentOrders: Array<{
    id: string;
    buyerId: string;
    sellerId: string;
    totalPrice: number;
    status: string;
    paymentStatus: string;
    date: string;
  }>;
  topSellers: Array<{
    sellerId: string;
    totalSales: number;
  }>;
  listingBreakdown: {
    active: number;
    draft: number;
    paused: number;
    archived: number;
  };
}

export default function AdminDashboardPage() {
  const { lang } = useLanguage();
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("keyzaa_token");

    if (!token) {
      queueMicrotask(() => {
        setError(lang === "th" ? "ไม่พบสิทธิ์แอดมิน" : "Admin access was not found.");
        setLoading(false);
      });
      return;
    }

    fetch("/api/admin/overview", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load admin overview");
        }

        const data = (await response.json()) as AdminOverviewResponse;
        setOverview(data);
        setError(null);
      })
      .catch(() => {
        setOverview(null);
        setError(lang === "th" ? "โหลดข้อมูลแอดมินไม่สำเร็จ" : "Failed to load admin data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [lang]);

  const cards = useMemo(
    () => [
      {
        label: lang === "th" ? "ผู้ซื้อ" : "Buyers",
        value: `${overview?.kpis.buyers || 0}`,
      },
      {
        label: lang === "th" ? "ผู้ขาย" : "Sellers",
        value: `${overview?.kpis.sellers || 0}`,
      },
      {
        label: lang === "th" ? "ออเดอร์ทั้งหมด" : "Total orders",
        value: `${overview?.kpis.orders || 0}`,
      },
      {
        label: lang === "th" ? "รายการขายที่ใช้งานอยู่" : "Active listings",
        value: `${overview?.kpis.activeListings || 0}`,
      },
      {
        label: lang === "th" ? "มูลค่ารวม" : "Gross volume",
        value: `฿${formatThaiBaht(overview?.kpis.grossVolume || 0)}`,
      },
      {
        label: lang === "th" ? "รายได้แพลตฟอร์ม" : "Platform revenue",
        value: `฿${formatThaiBaht(overview?.kpis.platformRevenue || 0)}`,
      },
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

  if (error) {
    return (
      <div className="surface-card flex min-h-[320px] items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="type-h2">{lang === "th" ? "เข้าใช้งานไม่ได้" : "Access unavailable"}</h1>
          <p className="type-body text-text-subtle">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <div className="space-y-2">
        <h1 className="type-h1">{lang === "th" ? "แดชบอร์ดแอดมิน" : "Admin dashboard"}</h1>
        <p className="type-body max-w-[66ch] text-text-subtle">
          {lang === "th"
            ? "ศูนย์กลางสำหรับตรวจสอบผู้ซื้อ ผู้ขาย คำสั่งซื้อ รายการขาย และรายได้ของแพลตฟอร์ม"
            : "Central workspace for monitoring buyers, sellers, orders, listings, and platform revenue."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="surface-card p-5">
            <p className="text-xs text-text-muted">{card.label}</p>
            <p className="type-num mt-1 text-2xl font-extrabold text-text-main">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="surface-card overflow-hidden">
          <div className="border-b border-border-subtle px-5 py-4">
            <h2 className="type-h2">{lang === "th" ? "คำสั่งซื้อล่าสุด" : "Recent orders"}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-text-muted">
                  <th className="px-5 py-3 font-semibold">{lang === "th" ? "ออเดอร์" : "Order"}</th>
                  <th className="px-5 py-3 font-semibold">{lang === "th" ? "ผู้ซื้อ" : "Buyer"}</th>
                  <th className="px-5 py-3 font-semibold">{lang === "th" ? "ผู้ขาย" : "Seller"}</th>
                  <th className="px-5 py-3 font-semibold">{lang === "th" ? "ยอดรวม" : "Total"}</th>
                  <th className="px-5 py-3 font-semibold">{lang === "th" ? "สถานะ" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.recentOrders || []).map((order) => (
                  <tr key={order.id} className="border-t border-border-subtle">
                    <td className="px-5 py-4 font-medium text-text-main">{order.id}</td>
                    <td className="px-5 py-4 text-text-subtle">{order.buyerId}</td>
                    <td className="px-5 py-4 text-text-subtle">{order.sellerId}</td>
                    <td className="px-5 py-4 font-semibold text-text-main">฿{formatThaiBaht(order.totalPrice)}</td>
                    <td className="px-5 py-4 text-text-subtle">{order.status}</td>
                  </tr>
                ))}
                {(overview?.recentOrders || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-text-muted">
                      {lang === "th" ? "ยังไม่มีคำสั่งซื้อ" : "No orders yet."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface-card p-5">
            <h2 className="type-h2">{lang === "th" ? "ผู้ขายยอดสูงสุด" : "Top sellers"}</h2>
            <div className="mt-4 space-y-3">
              {(overview?.topSellers || []).map((seller) => (
                <div key={seller.sellerId} className="flex items-center justify-between rounded-2xl bg-bg-surface/80 px-4 py-3">
                  <div>
                    <p className="font-semibold text-text-main">{seller.sellerId}</p>
                    <p className="text-xs text-text-muted">{lang === "th" ? "ยอดขายสะสม" : "Total sales"}</p>
                  </div>
                  <p className="type-num font-bold text-accent">฿{formatThaiBaht(seller.totalSales)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="type-h2">{lang === "th" ? "สถานะรายการขาย" : "Listing breakdown"}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                { label: lang === "th" ? "ใช้งานอยู่" : "Active", value: overview?.listingBreakdown.active || 0 },
                { label: lang === "th" ? "ฉบับร่าง" : "Draft", value: overview?.listingBreakdown.draft || 0 },
                { label: lang === "th" ? "หยุดชั่วคราว" : "Paused", value: overview?.listingBreakdown.paused || 0 },
                { label: lang === "th" ? "เก็บถาวร" : "Archived", value: overview?.listingBreakdown.archived || 0 },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{item.label}</p>
                  <p className="type-num mt-2 text-xl font-bold text-text-main">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
