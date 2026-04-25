"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageShell from "@/app/components/backoffice/admin-page-shell";
import AdminStatusBadge from "@/app/components/backoffice/admin-status-badge";
import { useLanguage } from "@/app/context/LanguageContext";
import { fetchBackoffice, type BackofficeSeller, type BackofficeSellersResponse } from "@/app/lib/backoffice";
import { formatThaiBaht } from "@/app/lib/marketplace";

export default function AdminSellersPage() {
  const { lang } = useLanguage();
  const [sellers, setSellers] = useState<BackofficeSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchBackoffice<BackofficeSellersResponse>("/api/backoffice/sellers", controller.signal)
      .then((response) => {
        setSellers(response.sellers);
        setError(null);
      })
      .catch(() => {
        setSellers([]);
        setError(lang === "th" ? "โหลดข้อมูลผู้ขายไม่สำเร็จ" : "Failed to load seller oversight.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lang]);

  const stats = useMemo(() => {
    const verified = sellers.filter((seller) => seller.verified).length;
    const pending = sellers.length - verified;
    const totalBalance = sellers.reduce((sum, seller) => sum + seller.balance, 0);

    return [
      { label: lang === "th" ? "ร้านค้าทั้งหมด" : "Total stores", value: sellers.length.toLocaleString() },
      { label: lang === "th" ? "ยืนยันแล้ว" : "Verified", value: verified.toLocaleString() },
      { label: lang === "th" ? "รอตรวจสอบ" : "Pending review", value: pending.toLocaleString() },
      { label: lang === "th" ? "ยอดคงเหลือรวม" : "Combined balance", value: `฿${formatThaiBaht(totalBalance)}` },
    ];
  }, [lang, sellers]);

  return (
    <AdminPageShell
      eyebrow={lang === "th" ? "Seller Oversight" : "Seller Oversight"}
      title={lang === "th" ? "ระบบกำกับดูแลผู้ขาย" : "Seller oversight"}
      description={
        lang === "th"
          ? "รวมสถานะยืนยันตัวตน คะแนนร้าน และยอดคงเหลือ เพื่อช่วยคัดกรองร้านที่ต้องติดตามใกล้ชิด"
          : "Track verification, store quality, and balances to identify sellers that need attention."
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-bg-surface/80 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
            <p className="type-num mt-2 text-2xl font-extrabold text-text-main">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-bg-surface/80 p-5">
        {loading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-bg-base/60" />
        ) : error ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-6 text-sm text-danger">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-text-muted">
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ร้านค้า" : "Store"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ผู้ถือบัญชี" : "Account owner"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "สถานะ" : "Status"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ยอดขาย" : "Sales"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "เรตติ้ง" : "Rating"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "คงเหลือ" : "Balance"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "รอถอน" : "Pending"}</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller.id} className="border-b border-white/6 last:border-b-0">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-text-main">{seller.storeName}</p>
                      <p className="mt-1 text-xs text-text-muted">{seller.phone || seller.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-text-main">{seller.user.name || seller.user.email}</p>
                      <p className="mt-1 text-xs text-text-muted">{seller.user.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge label={seller.verified ? "verified" : "pending"} />
                    </td>
                    <td className="type-num px-4 py-4 text-text-subtle">{seller.salesCount.toLocaleString()}</td>
                    <td className="type-num px-4 py-4 text-text-subtle">{seller.rating.toFixed(1)}</td>
                    <td className="type-num px-4 py-4 font-semibold text-text-main">฿{formatThaiBaht(seller.balance)}</td>
                    <td className="type-num px-4 py-4 text-text-subtle">฿{formatThaiBaht(seller.pendingBalance)}</td>
                  </tr>
                ))}
                {sellers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                      {lang === "th" ? "ยังไม่พบร้านค้า" : "No sellers found."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
