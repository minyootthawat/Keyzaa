"use client";

import AdminRouteGuard from "@/app/components/AdminRouteGuard";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { formatThaiBaht } from "@/app/lib/marketplace";

// Actual API response shape (flat)
interface AdminOverviewResponse {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeListings: number;
}

export default function AdminDashboardPage() {
  const { lang } = useLanguage();
  const { isAdmin, loading: authLoading } = useAuth();
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth state to resolve
    if (authLoading) return;

    if (!isAdmin) {
      queueMicrotask(() => {
        setError(lang === "th" ? "ไม่พบสิทธิ์แอดมิน" : "Admin access was not found.");
        setLoading(false);
      });
      return;
    }

    fetch("/api/backoffice/overview")
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
  }, [lang, isAdmin, authLoading]);

  // Platform revenue = platform fee cut from gross volume
  // We show gross volume (all orders total) separately from platform revenue (our cut)
  const grossVolume = overview?.totalRevenue ?? 0;
  const platformRevenue = grossVolume > 0 ? Math.round(grossVolume * 0.05 * 100) / 100 : 0;

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
        value: `฿${formatThaiBaht(grossVolume)}`,
      },
      {
        label: lang === "th" ? "รายได้แพลตฟอร์ม" : "Platform revenue",
        value: `฿${formatThaiBaht(platformRevenue)}`,
      },
    ],
    [lang, overview, grossVolume, platformRevenue]
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
    <AdminRouteGuard requiredPermission="admin:overview:read">
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

      <div className="surface-card p-6">
        <h2 className="type-h2">{lang === "th" ? "สถานะแพลตฟอร์ม" : "Platform status"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{lang === "th" ? "สินค้าทั้งหมด" : "Total products"}</p>
            <p className="type-num mt-2 text-xl font-bold text-text-main">{overview?.totalProducts || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{lang === "th" ? "ยอดรวม" : "Total revenue"}</p>
            <p className="type-num mt-2 text-xl font-bold text-text-main">฿{formatThaiBaht(overview?.totalRevenue || 0)}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{lang === "th" ? "รายการขายที่ใช้งาน" : "Active listings"}</p>
            <p className="type-num mt-2 text-xl font-bold text-text-main">{overview?.activeListings || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{lang === "th" ? "ยังไม่ดำเนินการ" : "Pending"}</p>
            <p className="type-num mt-2 text-xl font-bold text-text-muted">0</p>
          </div>
        </div>
      </div>
    </div>
    </AdminRouteGuard>
  );
}
