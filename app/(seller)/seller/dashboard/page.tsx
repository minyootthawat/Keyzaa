"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CTAButton from "@/app/components/CTAButton";
import SellerPageShell from "@/app/components/seller/seller-page-shell";
import SellerStatusBadge from "@/app/components/seller/seller-status-badge";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { formatThaiBaht } from "@/app/lib/marketplace";
import { fetchSellerDashboard, type SellerOverviewResponse } from "@/app/lib/seller-dashboard";

export default function SellerDashboardPage() {
  const { lang } = useLanguage();
  const { seller } = useAuth();
  const [overview, setOverview] = useState<SellerOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchSellerDashboard<SellerOverviewResponse>("/api/seller/overview", controller.signal)
      .then((data) => {
        setOverview(data);
        setError(null);
      })
      .catch(() => {
        setOverview(null);
        setError(lang === "th" ? "โหลดภาพรวมร้านค้าไม่สำเร็จ" : "Failed to load seller overview.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lang]);

  const lowStockItems = overview?.products.filter((product) => product.stock < 10) ?? [];
  const stats = useMemo(
    () => [
      {
        label: lang === "th" ? "ยอดขายรวม" : "Gross sales",
        value: `฿${formatThaiBaht(overview?.kpis.grossSales || 0)}`,
      },
      {
        label: lang === "th" ? "รายได้สุทธิ" : "Net earnings",
        value: `฿${formatThaiBaht(overview?.kpis.netEarnings || 0)}`,
      },
      {
        label: lang === "th" ? "พร้อมถอน" : "Available",
        value: `฿${formatThaiBaht(overview?.kpis.availableForPayout || 0)}`,
      },
      {
        label: lang === "th" ? "ออเดอร์ที่จ่ายแล้ว" : "Paid orders",
        value: `${overview?.kpis.orderCount || 0}`,
      },
    ],
    [lang, overview]
  );

  return (
    <SellerPageShell
      eyebrow={lang === "th" ? "Seller Command" : "Seller Command"}
      title={lang === "th" ? "ศูนย์ควบคุมร้านค้า" : "Seller command center"}
      description={
        lang === "th"
          ? "ติดตามรายได้ รายการขาย คำสั่งซื้อ และงานที่ต้องรีบทำจากหน้าเดียว"
          : "Track earnings, listings, orders, and the tasks that need immediate attention from one place."
      }
      action={
        <CTAButton href="/seller/dashboard/products">
          {lang === "th" ? "จัดการรายการสินค้า" : "Manage listings"}
        </CTAButton>
      }
    >
      {loading ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-[1.8rem] bg-bg-surface/70" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-[1.5rem] bg-bg-surface/70" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-[1.75rem] border border-danger/20 bg-danger/10 p-6 text-danger">{error}</div>
      ) : (
        <>
          <div className="rounded-[1.9rem] border border-brand-primary/16 bg-[linear-gradient(145deg,rgba(18,30,55,0.96),rgba(8,15,28,0.98))] p-6 shadow-[0_24px_70px_rgba(5,10,24,0.28)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-tertiary">
                  {seller?.shopName || "Seller Workspace"}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-text-main">
                  {lang === "th" ? "เห็นยอด รายการ และความเสี่ยงของร้านในมุมเดียว" : "One view for earnings, listings, and store risk"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-text-subtle">
                  {lang === "th"
                    ? "ใช้ overview นี้เพื่อตรวจสอบว่าวันนี้ควรโฟกัสที่การส่งมอบ การเติมสต็อก หรือการเตรียมถอนยอด"
                    : "Use this overview to decide whether today should focus on fulfillment, stock replenishment, or payout readiness."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">{lang === "th" ? "รายการสินค้าทั้งหมด" : "Total listings"}</p>
                  <p className="type-num mt-2 text-2xl font-black text-text-main">{overview?.products.length || 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">{lang === "th" ? "สต็อกใกล้หมด" : "Low stock"}</p>
                  <p className="type-num mt-2 text-2xl font-black text-warning">{lowStockItems.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-bg-surface/80 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
                <p className="type-num mt-2 text-2xl font-extrabold text-text-main">{item.value}</p>
              </div>
            ))}
          </div>

          {lowStockItems.length > 0 ? (
            <div className="rounded-[1.6rem] border border-warning/20 bg-warning/10 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-text-main">
                    {lang === "th" ? "มีรายการที่ต้องเติมสต็อก" : "Listings need stock attention"}
                  </h3>
                  <p className="mt-1 text-sm text-text-subtle">
                    {lang === "th"
                      ? `ตอนนี้มี ${lowStockItems.length} รายการที่เหลือน้อยกว่า 10 ชิ้น`
                      : `${lowStockItems.length} listings are below 10 units right now.`}
                  </p>
                </div>
                <CTAButton href="/seller/dashboard/products" variant="secondary">
                  {lang === "th" ? "ไปจัดการสินค้า" : "Open products"}
                </CTAButton>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.94fr)]">
            <div className="rounded-[1.75rem] border border-white/10 bg-bg-surface/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-text-main">
                  {lang === "th" ? "ออเดอร์ล่าสุด" : "Recent orders"}
                </h2>
                <Link href="/seller/dashboard/orders" className="text-sm font-semibold text-brand-tertiary hover:text-text-main">
                  {lang === "th" ? "ดูทั้งหมด" : "View all"}
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {(overview?.orders || []).slice(0, 5).map((order) => (
                  <div key={order.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text-main">#{order.id.slice(-8).toUpperCase()}</p>
                        <p className="mt-1 text-xs text-text-muted">
                          {new Date(order.date).toLocaleDateString(lang === "th" ? "th-TH" : "en-US")}
                        </p>
                      </div>
                      <SellerStatusBadge label={order.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                      <p className="text-sm text-text-subtle">{order.items.length} {lang === "th" ? "รายการ" : "items"}</p>
                      <p className="type-num font-semibold text-text-main">฿{formatThaiBaht(order.sellerNetAmount)}</p>
                    </div>
                  </div>
                ))}
                {(overview?.orders.length || 0) === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-text-muted">
                    {lang === "th" ? "ยังไม่มีออเดอร์ในร้าน" : "No orders yet."}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-bg-surface/80 p-5">
              <h2 className="text-xl font-semibold text-text-main">
                {lang === "th" ? "โฟกัสของวันนี้" : "Today’s focus"}
              </h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-sm font-semibold text-text-main">{lang === "th" ? "พร้อมถอนยอด" : "Payout readiness"}</p>
                  <p className="mt-1 text-sm text-text-subtle">
                    {lang === "th"
                      ? `ยอดพร้อมถอนตอนนี้คือ ฿${formatThaiBaht(overview?.kpis.availableForPayout || 0)}`
                      : `You currently have ฿${formatThaiBaht(overview?.kpis.availableForPayout || 0)} available for payout.`}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-sm font-semibold text-text-main">{lang === "th" ? "อัตราการเคลื่อนไหวร้าน" : "Store activity"}</p>
                  <p className="mt-1 text-sm text-text-subtle">
                    {lang === "th"
                      ? `${overview?.kpis.orderCount || 0} ออเดอร์ที่จ่ายแล้ว และ ${overview?.products.length || 0} รายการในแคตตาล็อก`
                      : `${overview?.kpis.orderCount || 0} paid orders and ${overview?.products.length || 0} listings in catalog.`}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-sm font-semibold text-text-main">{lang === "th" ? "จุดที่ควรทำต่อ" : "Next action"}</p>
                  <p className="mt-1 text-sm text-text-subtle">
                    {lowStockItems.length > 0
                      ? lang === "th"
                        ? "เริ่มจากเติมสต็อกสินค้าที่ใกล้หมด แล้วค่อยตรวจสอบออเดอร์ค้าง"
                        : "Start by replenishing low-stock listings, then review pending orders."
                      : lang === "th"
                        ? "ตรวจสอบออเดอร์ล่าสุดและเตรียมรอบถอนยอดถัดไป"
                        : "Review recent orders and prepare the next payout cycle."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </SellerPageShell>
  );
}
