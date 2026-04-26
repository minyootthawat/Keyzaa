"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { getStoredToken } from "@/app/lib/auth-client";
import { formatThaiBaht } from "@/app/lib/marketplace";
import { getMockPayoutNotice } from "@/app/lib/payment-mock";
import SectionHeader from "@/app/components/SectionHeader";
import StatCard from "@/app/components/StatCard";
import CTAButton from "@/app/components/CTAButton";
import type { SellerLedgerEntry, SellerWalletSummary } from "@/app/types";

interface SellerWalletResponse {
  summary: SellerWalletSummary;
  entries: SellerLedgerEntry[];
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
}

const MOCK_BANKS: BankAccount[] = [
  { id: "b1", bankName: "Kasikorn Bank", accountNumber: "***1234", accountHolder: "บริษัท คีซาจำกัด", isDefault: true },
  { id: "b2", bankName: "SCB", accountNumber: "***5678", accountHolder: "บริษัท คีซาจำกัด", isDefault: false },
];

// Sparkline patterns for StatCards
const SPARKLINE_AVAILABLE = [65, 80, 55, 90, 70, 95, 85];
const SPARKLINE_PENDING = [45, 60, 80, 50, 95, 70, 88];
const SPARKLINE_EARNED = [90, 70, 60, 85, 55, 75, 80];
const SPARKLINE_PAYOUTS = [55, 75, 90, 65, 80, 70, 95];

function formatDate(iso: string, lang: "th" | "en") {
  return new Date(iso).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SellerWalletPage() {
  const { t, lang } = useLanguage();
  const [wallet, setWallet] = useState<SellerWalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(MOCK_BANKS[0]);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const token = getStoredToken();
    if (!token) {
      setTimeout(() => {
        if (!cancelled) setLoading(false);
      }, 0);
      return () => { cancelled = true; };
    }

    fetch("/api/seller/wallet", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load seller wallet");
        const data = (await res.json()) as SellerWalletResponse;
        if (!cancelled) setWallet(data);
      })
      .catch(() => {
        // wallet stays null on error — show empty state
      })
      .finally(() => { if (!cancelled) setLoading(false); });
  }, []);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError("");

    const amount = parseFloat(withdrawAmount);
    const available = wallet?.summary.availableBalance ?? 0;

    if (isNaN(amount) || amount <= 0) {
      setWithdrawError(lang === "th" ? "กรุณากรอกจำนวนที่ถูกต้อง" : "Please enter a valid amount");
      return;
    }
    if (amount > available) {
      setWithdrawError(lang === "th" ? "จำนวนเงินเกินยอดที่ถอนได้" : "Amount exceeds available balance");
      return;
    }

    // Mock success
    setWithdrawAmount("");
    setShowWithdrawModal(false);
    setWithdrawSuccess(true);
    setTimeout(() => setWithdrawSuccess(false), 4000);
  };

  // Filter out commission_fee entries for display
  const visibleEntries = wallet?.entries.filter((e) => e.type !== "commission_fee") ?? [];

  const available = wallet?.summary.availableBalance ?? 0;
  const pending = wallet?.summary.pendingBalance ?? 0;
  const totalEarned = wallet?.summary.netEarnings ?? 0;

  const statCards = [
    {
      label: lang === "th" ? "ถอนได้" : "Available",
      value: `฿${formatThaiBaht(available)}`,
      delta: available > 0 ? (lang === "th" ? "พร้อมถอน" : "Ready") : "—",
      deltaColor: available > 0 ? ("text-accent" as const) : ("text-text-muted" as const),
      sparklineData: SPARKLINE_AVAILABLE,
    },
    {
      label: lang === "th" ? "รอตัดยอด" : "Pending",
      value: `฿${formatThaiBaht(pending)}`,
      delta: lang === "th" ? "อยู่ระหว่างตรวจ" : "Under review",
      deltaColor: pending > 0 ? ("text-warning" as const) : ("text-text-muted" as const),
      sparklineData: SPARKLINE_PENDING,
    },
    {
      label: lang === "th" ? "รายได้รวม" : "Total Earned",
      value: `฿${formatThaiBaht(totalEarned)}`,
      delta: lang === "th" ? "ตลอดกาล" : "All time",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_EARNED,
    },
    {
      label: lang === "th" ? "ประวัติถอน" : "Payouts",
      value: `฿${formatThaiBaht(visibleEntries.filter((e) => e.type === "withdrawal").reduce((s, e) => s + Math.abs(e.amount), 0))}`,
      delta: lang === "th" ? `${visibleEntries.filter((e) => e.type === "withdrawal").length} รายการ` : `${visibleEntries.filter((e) => e.type === "withdrawal").length} txns`,
      deltaColor: "text-text-muted" as const,
      sparklineData: SPARKLINE_PAYOUTS,
    },
  ];

  return (
    <div className="space-y-6 md:space-y-7">
      {/* Page header */}
      <SectionHeader
        title={t("wallet_title")}
        subtitle={
          lang === "th"
            ? "ติดตามรายได้ ยอดคงเหลือ และการถอนเงินของคุณ"
            : "Track your earnings, balance, and payout history"
        }
        cta={
          available > 0
            ? {
                label: t("wallet_withdraw"),
                onClick: () => setShowWithdrawModal(true),
              }
            : undefined
        }
      />

      {/* Payout schedule banner */}
      <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary/10 px-5 py-4 text-sm leading-7 text-text-subtle">
        {getMockPayoutNotice(lang)}
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Balance cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Available for Withdrawal */}
        <div className="surface-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 6v8M7 8.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              {lang === "th" ? "ถอนได้" : "Available"}
            </p>
          </div>
          <p className="type-num text-3xl font-extrabold text-accent">
            ฿{formatThaiBaht(available)}
          </p>
          {available > 0 && (
            <p className="mt-2 text-xs text-text-muted">
              {lang === "th" ? "พร้อมถอน" : "Ready to withdraw"}
            </p>
          )}
        </div>

        {/* Pending Clearance */}
        <div className="surface-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20 text-warning">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              {lang === "th" ? "รอตัดยอด" : "Pending"}
            </p>
          </div>
          <p className="type-num text-3xl font-extrabold text-text-main">
            ฿{formatThaiBaht(pending)}
          </p>
          <p className="mt-2 text-xs text-text-muted">
            {lang === "th" ? "อยู่ระหว่างตรวจสอบ" : "Under review"}
          </p>
        </div>

        {/* Total Earned */}
        <div className="surface-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/20 text-brand-primary">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <path d="M3 10a7 7 0 1114 0 7 7 0 01-14 0z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              {lang === "th" ? "รายได้รวม" : "Total Earned"}
            </p>
          </div>
          <p className="type-num text-3xl font-extrabold text-text-main">
            ฿{formatThaiBaht(totalEarned)}
          </p>
          <p className="mt-2 text-xs text-text-muted">
            {lang === "th" ? "ตลอดกาล" : "All time"}
          </p>
        </div>
      </div>

      {/* Payout action panel */}
      {available > 0 && (
        <div className="surface-card p-5 sm:p-6">
          <h2 className="type-h2 mb-4">{t("wallet_withdraw") ?? (lang === "th" ? "ถอนเงิน" : "Withdraw")}</h2>
          <div className="flex flex-wrap items-center gap-4">
            {/* Bank selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1.5 block text-xs font-semibold text-text-muted uppercase tracking-wide">
                {lang === "th" ? "บัญชีปลายทาง" : "Destination"}
              </label>
              <select
                value={selectedBank?.id ?? ""}
                onChange={(e) => {
                  const b = MOCK_BANKS.find((x) => x.id === e.target.value);
                  if (b) setSelectedBank(b);
                }}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
              >
                {MOCK_BANKS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} {b.accountNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount preview */}
            <div className="flex-1 min-w-[160px]">
              <label className="mb-1.5 block text-xs font-semibold text-text-muted uppercase tracking-wide">
                {lang === "th" ? "จำนวน" : "Amount"}
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-4 py-3">
                <span className="text-lg font-bold text-text-main">฿</span>
                <span className="type-num text-xl font-extrabold text-accent">
                  {formatThaiBaht(available)}
                </span>
              </div>
            </div>

            <CTAButton
              onClick={() => setShowWithdrawModal(true)}
              className="h-12 px-6 self-end"
            >
              {t("wallet_withdraw") ?? (lang === "th" ? "ถอนเงิน" : "Withdraw")}
            </CTAButton>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            {lang === "th"
              ? "฿0.00 ค่าธรรมเนียม · เข้าภายใน 1-2 วันทำการ"
              : "฿0.00 fee · Arrives in 1-2 business days"}
          </p>
        </div>
      )}

      {/* Transaction history */}
      <div className="surface-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle">
          <h2 className="type-h2">{t("wallet_history")}</h2>
        </div>

        {!wallet || loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-bg-surface animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-bg-surface animate-pulse" />
                  <div className="h-3 w-24 rounded bg-bg-surface animate-pulse" />
                </div>
                <div className="h-5 w-20 rounded bg-bg-surface animate-pulse" />
              </div>
            ))}
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <svg width="48" height="48" fill="none" viewBox="0 0 48 48" className="text-text-muted">
              <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M16 22h16M16 28h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="font-semibold text-text-main">{t("wallet_noHistory")}</p>
            <p className="text-sm text-text-muted">
              {lang === "th" ? "ยังไม่มีรายการธุรกรรม" : "No transactions yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle/50">
            {visibleEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-5 py-4 hover:bg-bg-surface/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    entry.amount >= 0 ? "bg-success/20 text-accent" : "bg-warning/20 text-warning"
                  }`}>
                    {entry.amount >= 0 ? (
                      <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                        <path d="M9 4v10M5 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                        <path d="M9 14V4M5 11l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-main">{entry.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {entry.orderId && (
                        <span className="font-mono text-xs text-text-muted">#{entry.orderId.slice(-6).toUpperCase()}</span>
                      )}
                      <span className="text-xs text-text-muted">{formatDate(entry.createdAt, lang)}</span>
                    </div>
                  </div>
                </div>
                <p className={`type-num shrink-0 ml-4 text-lg font-bold ${
                  entry.amount >= 0 ? "text-accent" : "text-danger"
                }`}>
                  {entry.amount >= 0 ? "+" : "-"}฿{formatThaiBaht(Math.abs(entry.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 p-4 backdrop-blur-sm">
          <div className="surface-card glass-panel w-full max-w-md space-y-5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="type-h2">{t("wallet_withdraw")}</h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-xl text-text-muted hover:text-text-main transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border-subtle bg-bg-surface/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">{lang === "th" ? "บัญชีปลายทาง" : "Destination"}</span>
                </div>
                <p className="font-semibold text-text-main">
                  {selectedBank?.bankName} {selectedBank?.accountNumber}
                </p>
                <p className="text-sm text-text-muted mt-0.5">{selectedBank?.accountHolder}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-subtle">
                  {t("wallet_withdrawAmount") ?? (lang === "th" ? "จำนวนที่ถอน" : "Withdrawal amount")}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted">฿</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={String(available)}
                    className="w-full rounded-xl border border-border-subtle bg-bg-surface pl-9 pr-4 py-3 text-lg text-text-main focus:border-brand-primary focus:outline-none"
                  />
                </div>
              </div>

              <p className="text-xs text-text-muted">
                {lang === "th"
                  ? "฿0.00 ค่าธรรมเนียม · เข้าภายใน 1-2 วันทำการ"
                  : "฿0.00 fee · Arrives in 1-2 business days"}
              </p>

              {withdrawError && (
                <p className="text-sm text-danger">{withdrawError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <CTAButton
                type="button"
                variant="secondary"
                onClick={() => setShowWithdrawModal(false)}
                fullWidth
              >
                {t("common_back") ?? (lang === "th" ? "ยกเลิก" : "Cancel")}
              </CTAButton>
              <CTAButton type="submit" onClick={handleWithdraw} fullWidth>
                {t("wallet_withdraw")}
              </CTAButton>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw success toast */}
      {withdrawSuccess && (
        <div className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 motion-fade-up">
          <div className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-black text-bg-base shadow-2xl">
            <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
              <path d="M4 9l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("wallet_withdrawSuccess")}
          </div>
        </div>
      )}
    </div>
  );
}
