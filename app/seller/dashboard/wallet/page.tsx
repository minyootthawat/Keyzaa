"use client";

import { useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import CTAButton from "@/app/components/CTAButton";
import type { Transaction } from "@/app/types";

export default function SellerWalletPage() {
  const { seller, updateSeller } = useAuth();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(`keyzaa_transactions_${seller?.id}`);
    if (saved) {
      try { return JSON.parse(saved) as Transaction[]; } catch { /* fall through */ }
    }
    return [
      { id: "tx_1", type: "earning", amount: 950, description: "ROV 1000 เพชร", date: "2026-04-17T10:30:00Z" },
      { id: "tx_2", type: "earning", amount: 450, description: "PUBG Mobile 500 UC", date: "2026-04-15T14:20:00Z" },
      { id: "tx_3", type: "earning", amount: 180, description: "Steam Wallet ฿200", date: "2026-04-14T09:00:00Z" },
      { id: "tx_4", type: "withdrawal", amount: -5000, description: "ถอนเงินเข้าบัญชี", date: "2026-04-10T08:00:00Z" },
    ];
  });
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || amount > (seller?.balance || 0)) return;

    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      type: "withdrawal",
      amount: -amount,
      description: t("wallet_typeWithdraw"),
      date: new Date().toISOString(),
    };
    const updated = [tx, ...transactions];
    setTransactions(updated);
    localStorage.setItem(`keyzaa_transactions_${seller?.id}`, JSON.stringify(updated));
    updateSeller({ balance: (seller?.balance || 0) - amount });
    setWithdrawAmount("");
    setShowWithdrawModal(false);
    setWithdrawSuccess(true);
    setTimeout(() => setWithdrawSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <h1 className="type-h1">{t("wallet_title")}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface-card p-6">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">{t("wallet_available")}</p>
          <p className="type-num mt-2 text-3xl font-extrabold text-accent">
            ฿{(seller?.balance || 0).toLocaleString()}
          </p>
        </div>
        <div className="surface-card p-6">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">{t("wallet_pending")}</p>
          <p className="type-num mt-2 text-3xl font-extrabold text-warning">
            ฿{(seller?.pendingBalance || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="type-h2">{t("wallet_history")}</h2>
          <CTAButton onClick={() => setShowWithdrawModal(true)} className="h-10 px-5">
            {t("wallet_withdraw")}
          </CTAButton>
        </div>

        {transactions.length === 0 ? (
          <p className="text-center py-8 text-text-muted">{t("wallet_noHistory")}</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tx.type === "earning" ? "bg-success/20 text-accent" : "bg-warning/20 text-warning"}`}>
                    {tx.type === "earning" ? "+" : "-"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-main">{tx.description}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(tx.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <p className={`type-num text-lg font-bold ${tx.amount > 0 ? "text-accent" : "text-text-main"}`}>
                  {tx.amount > 0 ? "+" : ""}฿{tx.amount.toLocaleString().replace("-", "")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {withdrawSuccess && (
        <div className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-black text-bg-base shadow-2xl">
            ✓ {t("wallet_withdrawSuccess")}
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm p-4">
          <div className="surface-card glass-panel w-full max-w-md p-6 space-y-5">
            <h2 className="type-h2">{t("wallet_withdraw")}</h2>
            <p className="text-sm text-text-subtle">
              {t("wallet_available")}: <span className="font-bold text-accent">฿{(seller?.balance || 0).toLocaleString()}</span>
            </p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-subtle">{t("wallet_withdrawAmount")}</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  max={seller?.balance}
                  required
                  placeholder="0"
                  className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
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
      )}
    </div>
  );
}
