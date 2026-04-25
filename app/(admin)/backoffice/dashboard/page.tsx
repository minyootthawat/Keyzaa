"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminPageShell from "@/app/components/backoffice/admin-page-shell";
import { useLanguage } from "@/app/context/LanguageContext";
import { fetchBackoffice, type BackofficeOverviewResponse } from "@/app/lib/backoffice";
import { formatThaiBaht } from "@/app/lib/marketplace";

export default function AdminDashboardPage() {
  const { lang } = useLanguage();
  const [overview, setOverview] = useState<BackofficeOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchBackoffice<BackofficeOverviewResponse>("/api/backoffice/overview", controller.signal)
      .then((data) => {
        setOverview(data);
        setError(null);
      })
      .catch((fetchError: Error) => {
        setOverview(null);
        setError(
          fetchError.message === "missing-admin-token"
            ? lang === "th"
              ? "ไม่พบสิทธิ์แอดมิน"
              : "Admin access was not found."
            : lang === "th"
              ? "โหลดข้อมูลแอดมินไม่สำเร็จ"
              : "Failed to load admin data."
        );
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lang]);

  const cards = useMemo(
    () => [
      {
        label: lang === "th" ? "ผู้ซื้อ" : "Buyers",
        value: `${overview?.totalUsers || 0}`,
      },
      {
        label: lang === "th" ? "ผู้ขาย" : "Sellers",
        value: `${overview?.totalSellers || 0}`,
      },
      {
        label: lang === "th" ? "ออเดอร์ทั้งหมด" : "Total orders",
        value: `${overview?.totalOrders || 0}`,
      },
      {
        label: lang === "th" ? "รายการขายที่ใช้งานอยู่" : "Active listings",
        value: `${overview?.activeListings || 0}`,
      },
      {
        label: lang === "th" ? "มูลค่ารวม" : "Gross volume",
        value: `฿${formatThaiBaht(overview?.totalRevenue || 0)}`,
      },
      {
        label: lang === "th" ? "สัดส่วนรายการเปิดขาย" : "Listing activation",
        value:
          overview && overview.totalProducts > 0
            ? `${Math.round((overview.activeListings / overview.totalProducts) * 100)}%`
            : "0%",
      },
    ],
    [lang, overview]
  );

  const quickLinks = [
    {
      href: "/backoffice/orders",
      title: lang === "th" ? "จัดการออเดอร์" : "Manage orders",
      description: lang === "th" ? "ดูสถานะชำระเงินและความเสี่ยงจากข้อพิพาท" : "Inspect payments and dispute risk",
    },
    {
      href: "/backoffice/products",
      title: lang === "th" ? "กำกับดูแลสินค้า" : "Govern listings",
      description: lang === "th" ? "คุมสต็อก ราคา และรายการขายที่ active" : "Review stock, pricing, and active listings",
    },
    {
      href: "/backoffice/sellers",
      title: lang === "th" ? "ตรวจสอบผู้ขาย" : "Review sellers",
      description: lang === "th" ? "เห็นสถานะยืนยันตัวตนและยอดคงเหลือร้าน" : "See verification and store balances",
    },
  ];

  return (
    <AdminPageShell
      eyebrow={lang === "th" ? "Platform Command" : "Platform Command"}
      title={lang === "th" ? "แดชบอร์ดระบบหลังบ้าน" : "Backoffice command center"}
      description={
        lang === "th"
          ? "ศูนย์กลางสำหรับติดตามสุขภาพแพลตฟอร์ม รายได้ และจุดที่ทีมปฏิบัติการต้องลงมือเร็วที่สุด"
          : "A central workspace for platform health, revenue, and the areas operations should react to first."
      }
    >
      {loading ? (
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-[1.75rem] bg-bg-surface/70" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-[1.5rem] bg-bg-surface/70" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-[1.75rem] border border-danger/20 bg-danger/10 p-6 text-center">
          <h2 className="type-h2 text-text-main">{lang === "th" ? "เข้าใช้งานไม่ได้" : "Access unavailable"}</h2>
          <p className="mt-3 type-body text-text-subtle">{error}</p>
        </div>
      ) : (
        <>
          <div className="rounded-[1.9rem] border border-warning/15 bg-[linear-gradient(135deg,rgba(37,27,12,0.8),rgba(16,20,33,0.98))] p-6 shadow-[0_24px_70px_rgba(5,10,24,0.26)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warning">
                  {lang === "th" ? "System Snapshot" : "System Snapshot"}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-text-main">
                  {lang === "th" ? "มองเห็นธุรกรรม แคตตาล็อก และร้านค้าจากโครงเดียวกัน" : "One system for transactions, catalog, and seller operations"}
                </h2>
                <p className="mt-3 max-w-[60ch] text-sm leading-7 text-text-subtle">
                  {lang === "th"
                    ? "โครงหลังบ้านนี้รวมตัวเลขหลักและเส้นทางทำงานของทีมปฏิบัติการไว้ด้วยกัน เพื่อลดเวลาสลับหน้าระหว่างการตรวจสอบ"
                    : "This backoffice brings the core numbers and operational pathways together so the team spends less time switching contexts."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">{lang === "th" ? "รายได้รวม" : "Gross revenue"}</p>
                  <p className="type-num mt-2 text-2xl font-black text-text-main">฿{formatThaiBaht(overview?.totalRevenue || 0)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">{lang === "th" ? "รายการเปิดขาย" : "Active listings"}</p>
                  <p className="type-num mt-2 text-2xl font-black text-text-main">{overview?.activeListings || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <div key={card.label} className="rounded-[1.5rem] border border-white/10 bg-bg-surface/80 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{card.label}</p>
                <p className="type-num mt-2 text-2xl font-extrabold text-text-main">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <div className="rounded-[1.75rem] border border-white/10 bg-bg-surface/80 p-5">
              <h2 className="text-xl font-semibold text-text-main">
                {lang === "th" ? "Operational Surfaces" : "Operational surfaces"}
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-warning/20 hover:bg-warning/10"
                  >
                    <h3 className="font-semibold text-text-main">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-text-subtle">{item.description}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-bg-surface/80 p-5">
              <h2 className="text-xl font-semibold text-text-main">
                {lang === "th" ? "Platform Watchlist" : "Platform watchlist"}
              </h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-sm font-semibold text-text-main">{lang === "th" ? "ผู้ขายเทียบกับผู้ซื้อ" : "Seller to buyer mix"}</p>
                  <p className="mt-1 text-sm text-text-subtle">
                    {overview?.totalUsers
                      ? `${Math.round(((overview?.totalSellers || 0) / overview.totalUsers) * 100)}%`
                      : "0%"}{" "}
                    {lang === "th" ? "ของฐานผู้ใช้ทั้งหมดเป็นผู้ขาย" : "of the user base are sellers"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-sm font-semibold text-text-main">{lang === "th" ? "มูลค่าต่อออเดอร์เฉลี่ย" : "Average order value"}</p>
                  <p className="mt-1 text-sm text-text-subtle">
                    ฿
                    {formatThaiBaht(
                      overview && overview.totalOrders > 0 ? overview.totalRevenue / overview.totalOrders : 0
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-sm font-semibold text-text-main">{lang === "th" ? "ความหนาแน่นแคตตาล็อก" : "Catalog density"}</p>
                  <p className="mt-1 text-sm text-text-subtle">
                    {overview?.totalSellers
                      ? `${Math.round((overview.totalProducts / overview.totalSellers) * 10) / 10}`
                      : "0"}{" "}
                    {lang === "th" ? "สินค้าต่อร้านโดยเฉลี่ย" : "products per seller on average"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
