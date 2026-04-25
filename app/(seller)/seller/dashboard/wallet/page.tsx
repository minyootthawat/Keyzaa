"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { getStoredToken } from "@/app/lib/auth-client";
import { formatThaiBaht } from "@/app/lib/marketplace";
import { getMockPayoutNotice } from "@/app/lib/payment-mock";
import CTAButton from "@/app/components/CTAButton";
import type { SellerLedgerEntry, SellerWalletSummary } from "@/app/types";
import { MOCK_WALLET } from "@/lib/mock-data";

interface SellerWalletResponse {
  summary: SellerWalletSummary;
  entries: SellerLedgerEntry[];
}

export default function SellerWalletPage() {
  const { t, lang } = useLanguage();
  const [wallet, setWallet] = useState<SellerWalletResponse | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setWallet(MOCK_WALLET as unknown as SellerWalletResponse);
      return;
    }

    fetch("/api/seller/wallet", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load seller wallet");
        }

        const data = (await response.json()) as SellerWalletResponse;
        setWallet(data);
      })
      .catch(() => {
        setWallet(MOCK_WALLET as unknown as SellerWalletResponse);
      });
  }, []);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawAmount("");
    setShowWithdrawModal(false);
    setWithdrawSuccess(true);
    setTimeout(() => setWithdrawSuccess(false), 3000);
  };

  const visibleEntries = wallet?.entries.filter((entry) => entry.type !== "commission_fee") || [];

  return (
    <div className="space-y-6">
      <h1 className="type-h1">{t("wallet_title")}</h1>

      <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm leading-7 text-text-subtle">
        {getMockPayoutNotice(lang)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="surface-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{lang === "th" ? "ยอดขายรวม" : "Gross sales"}</p>
          <p className="type-num mt-2 text-3xl font-extrabold text-text-main">
            ฿{formatThaiBaht(wallet?.summary.grossSales || 0)}
          </p>
        </div>
        <div className="surface-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{lang === "th" ? "รายได้สุทธิ" : "Net earnings"}</p>
          <p className="type-num mt-2 text-3xl font-extrabold text-accent">
            ฿{formatThaiBaht(wallet?.summary.netEarnings || 0)}
          </p>
        </div>
        <div className="surface-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{t("wallet_available")}</p>
          <p className="type-num mt-2 text-3xl font-extrabold text-accent">
            ฿{formatThaiBaht(wallet?.summary.availableBalance || 0)}
          </p>
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="type-h2">{t("wallet_history")}</h2>
          <CTAButton onClick={() => setShowWithdrawModal(true)} className="h-10 px-5">
            {lang === "th" ? "ถอนเงินจำลอง" : "Mock withdraw"}
          </CTAButton>
        </div>

        {!wallet || visibleEntries.length === 0 ? (
          <p className="py-8 text-center text-text-muted">{t("wallet_noHistory")}</p>
        ) : (
          <div className="space-y-3">
            {visibleEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between border-b border-border-subtle py-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${entry.amount >= 0 ? "bg-success/20 text-accent" : "bg-warning/20 text-warning"}`}>
                    {entry.amount >= 0 ? "+" : "-"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-main">{entry.description}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(entry.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <p className={`type-num text-lg font-bold ${entry.amount >= 0 ? "text-accent" : "text-text-main"}`}>
                  {entry.amount >= 0 ? "+" : ""}฿{formatThaiBaht(Math.abs(entry.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {withdrawSuccess ? (
        <div className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-black text-bg-base shadow-2xl">
            ✓ {t("wallet_withdrawSuccess")}
          </div>
        </div>
      ) : null}

      {showWithdrawModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 p-4 backdrop-blur-sm">
          <div className="surface-card glass-panel w-full max-w-md space-y-5 p-6">
            <h2 className="type-h2">{t("wallet_withdraw")}</h2>
            <p className="text-sm text-text-subtle">
              {t("wallet_available")}: <span className="font-bold text-accent">฿{formatThaiBaht(wallet?.summary.availableBalance || 0)}</span>
            </p>
            <p className="text-sm leading-7 text-text-subtle">
              {getMockPayoutNotice(lang)}
            </p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-subtle">{t("wallet_withdrawAmount")}</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                  placeholder={lang === "th" ? "0" : "0"}
                  className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <CTAButton type="button" variant="secondary" onClick={() => setShowWithdrawModal(false)} fullWidth>
                  {t("common_back")}
                </CTAButton>
                <CTAButton type="submit" fullWidth>{t("wallet_withdraw")}</CTAButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
