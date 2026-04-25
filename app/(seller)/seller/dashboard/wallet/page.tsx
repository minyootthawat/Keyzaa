"use client";

import { useEffect, useMemo, useState } from "react";
import CTAButton from "@/app/components/CTAButton";
import SellerPageShell from "@/app/components/seller/seller-page-shell";
import { useLanguage } from "@/app/context/LanguageContext";
import { formatThaiBaht } from "@/app/lib/marketplace";
import { getMockPayoutNotice } from "@/app/lib/payment-mock";
import { fetchSellerDashboard, type SellerWalletResponse } from "@/app/lib/seller-dashboard";

export default function SellerWalletPage() {
  const { lang, t } = useLanguage();
  const [wallet, setWallet] = useState<SellerWalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchSellerDashboard<SellerWalletResponse>("/api/seller/wallet", controller.signal)
      .then((data) => {
        setWallet(data);
        setError(null);
      })
      .catch(() => {
        setWallet(null);
        setError(lang === "th" ? "โหลดกระเป๋าร้านค้าไม่สำเร็จ" : "Failed to load seller wallet.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lang]);

  const visibleEntries = useMemo(
    () => wallet?.entries.filter((entry) => entry.type !== "commission_fee") || [],
    [wallet]
  );

  return (
    <SellerPageShell
      eyebrow={lang === "th" ? "Payout Center" : "Payout Center"}
      title={t("wallet_title")}
      description={
        lang === "th"
          ? "ติดตามยอดที่พร้อมถอน ประวัติการเคลื่อนไหว และองค์ประกอบของรายได้สุทธิ"
          : "Track available balance, ledger history, and the composition of net earnings."
      }
      action={<CTAButton>{lang === "th" ? "ถอนเงินจำลอง" : "Mock withdraw"}</CTAButton>}
    >
      <div className="rounded-[1.6rem] border border-warning/20 bg-warning/10 px-4 py-3 text-sm leading-7 text-text-subtle">
        {getMockPayoutNotice(lang)}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-[1.5rem] bg-bg-surface/70" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[1.75rem] border border-danger/20 bg-danger/10 p-6 text-danger">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-bg-surface/80 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{lang === "th" ? "ยอดขายรวม" : "Gross sales"}</p>
              <p className="type-num mt-2 text-2xl font-extrabold text-text-main">฿{formatThaiBaht(wallet?.summary.grossSales || 0)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-bg-surface/80 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{lang === "th" ? "รายได้สุทธิ" : "Net earnings"}</p>
              <p className="type-num mt-2 text-2xl font-extrabold text-accent">฿{formatThaiBaht(wallet?.summary.netEarnings || 0)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-bg-surface/80 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{t("wallet_available")}</p>
              <p className="type-num mt-2 text-2xl font-extrabold text-text-main">฿{formatThaiBaht(wallet?.summary.availableBalance || 0)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-bg-surface/80 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{lang === "th" ? "ค่าคอมมิชชัน" : "Commission"}</p>
              <p className="type-num mt-2 text-2xl font-extrabold text-text-main">฿{formatThaiBaht(wallet?.summary.totalCommission || 0)}</p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-bg-surface/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-text-main">{t("wallet_history")}</h2>
              <p className="text-sm text-text-muted">{visibleEntries.length} entries</p>
            </div>
            {visibleEntries.length === 0 ? (
              <p className="py-8 text-center text-text-muted">{t("wallet_noHistory")}</p>
            ) : (
              <div className="mt-4 space-y-3">
                {visibleEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-text-main">{entry.description}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {new Date(entry.createdAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-US")}
                      </p>
                    </div>
                    <p className={`type-num text-lg font-bold ${entry.amount >= 0 ? "text-accent" : "text-text-main"}`}>
                      {entry.amount >= 0 ? "+" : ""}฿{formatThaiBaht(Math.abs(entry.amount))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </SellerPageShell>
  );
}
