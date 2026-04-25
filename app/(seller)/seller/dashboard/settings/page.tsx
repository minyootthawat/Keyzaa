"use client";

import { useEffect, useState } from "react";
import CTAButton from "@/app/components/CTAButton";
import SellerPageShell from "@/app/components/seller/seller-page-shell";
import SellerStatusBadge from "@/app/components/seller/seller-status-badge";
import { useLanguage } from "@/app/context/LanguageContext";
import { fetchSellerDashboard, type SellerMeResponse } from "@/app/lib/seller-dashboard";
import { formatThaiBaht } from "@/app/lib/marketplace";

export default function SellerSettingsPage() {
  const { lang } = useLanguage();
  const [profile, setProfile] = useState<SellerMeResponse["seller"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchSellerDashboard<SellerMeResponse>("/api/seller/me", controller.signal)
      .then((data) => {
        setProfile(data.seller);
        setError(null);
      })
      .catch(() => {
        setProfile(null);
        setError(lang === "th" ? "โหลดข้อมูลร้านไม่สำเร็จ" : "Failed to load seller settings.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lang]);

  return (
    <SellerPageShell
      eyebrow={lang === "th" ? "Store Profile" : "Store Profile"}
      title={lang === "th" ? "การตั้งค่าร้านค้า" : "Store settings"}
      description={
        lang === "th"
          ? "ดูข้อมูลร้าน สถานะยืนยันตัวตน และความพร้อมรับยอดในหน้าเดียว"
          : "Review store identity, verification status, and payout readiness in one place."
      }
      action={<CTAButton variant="secondary">{lang === "th" ? "แก้ไขข้อมูลร้าน" : "Edit profile"}</CTAButton>}
    >
      {loading ? (
        <div className="h-48 animate-pulse rounded-[1.8rem] bg-bg-surface/70" />
      ) : error ? (
        <div className="rounded-[1.75rem] border border-danger/20 bg-danger/10 p-6 text-danger">{error}</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)]">
          <div className="rounded-[1.75rem] border border-white/10 bg-bg-surface/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-text-muted">{lang === "th" ? "ชื่อร้าน" : "Store name"}</p>
                <h2 className="mt-1 text-2xl font-semibold text-text-main">{profile?.shopName}</h2>
              </div>
              <SellerStatusBadge label={profile?.verificationStatus || "pending"} />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{lang === "th" ? "เบอร์โทร" : "Phone"}</p>
                <p className="mt-2 text-sm font-medium text-text-main">{profile?.phone || "-"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{lang === "th" ? "สถานะรับยอด" : "Payout mode"}</p>
                <p className="mt-2 text-sm font-medium text-text-main">{profile?.payoutStatus || "manual"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{lang === "th" ? "เวลาตอบกลับ" : "Response time"}</p>
                <p className="mt-2 text-sm font-medium text-text-main">{profile?.responseTimeMinutes || 0} นาที</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{lang === "th" ? "Fulfillment rate" : "Fulfillment rate"}</p>
                <p className="mt-2 text-sm font-medium text-text-main">{profile?.fulfillmentRate || 0}%</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-bg-surface/80 p-5">
            <h2 className="text-xl font-semibold text-text-main">{lang === "th" ? "ตัวเลขสำคัญของร้าน" : "Store metrics"}</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-sm text-text-muted">{lang === "th" ? "ยอดขายรวม" : "Gross sales"}</p>
                <p className="type-num mt-1 text-xl font-bold text-text-main">฿{formatThaiBaht(profile?.totalGrossSales || 0)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-sm text-text-muted">{lang === "th" ? "รายได้สุทธิ" : "Net earnings"}</p>
                <p className="type-num mt-1 text-xl font-bold text-accent">฿{formatThaiBaht(profile?.totalNetEarnings || 0)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-sm text-text-muted">{lang === "th" ? "ค่าคอมมิชชันสะสม" : "Commission paid"}</p>
                <p className="type-num mt-1 text-xl font-bold text-text-main">฿{formatThaiBaht(profile?.totalCommissionPaid || 0)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-sm text-text-muted">{lang === "th" ? "คะแนนร้าน" : "Store rating"}</p>
                <p className="type-num mt-1 text-xl font-bold text-text-main">{profile?.rating?.toFixed(1) || "0.0"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </SellerPageShell>
  );
}
