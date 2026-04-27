"use client";

import { useEffect, useState } from "react";
import { getStoredToken } from "@/app/lib/auth-client";
import { formatThaiBaht } from "@/app/lib/marketplace";
import SectionHeader from "@/app/components/SectionHeader";
import StatCard from "@/app/components/StatCard";
import CTAButton from "@/app/components/CTAButton";
import type { GameAccount } from "@/types/database";
import { useLanguage } from "@/app/context/LanguageContext";

interface AddModalProps {
  onClose: () => void;
  onAdd: (acc: GameAccount) => void;
}

const GAMES = ["Mobile Legends", "Genshin Impact", "Free Fire", "PUBG Mobile", "Valorant", "League of Legends", "Apex Legends", "Honkai: Star Rail"];
const PLATFORMS = ["Mobile", "PC", "PS4", "PS5", "Xbox", "Switch"];
const REGIONS = ["Global", "Thai", "SEA", "CN", "JP", "KR", "EU", "US"];

// Sparkline patterns
const SPARKLINE_TOTAL = [55, 70, 60, 85, 75, 90, 95];
const SPARKLINE_ACTIVE = [70, 80, 75, 90, 85, 95, 100];
const SPARKLINE_VALUE = [80, 65, 90, 70, 85, 95, 100];
const SPARKLINE_SOLD = [45, 60, 80, 50, 95, 70, 88];

function AddGameAccountModal({ onClose, onAdd }: AddModalProps) {
  const { lang } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    game_name: "",
    game_name_th: "",
    account_username: "",
    account_password: "",
    description: "",
    price: "",
    stock: "1",
    platform: "",
    region: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const token = getStoredToken();
      const res = await fetch("/api/seller/game-accounts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      onAdd(data.account);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 p-4 backdrop-blur-sm">
      <div className="surface-card glass-panel w-full max-w-lg space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="type-h2">{lang === "th" ? "🎮 เพิ่มบัญชีเกม" : "🎮 Add Game Account"}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold text-text-subtle">{lang === "th" ? "ชื่อเกม *" : "Game Name *"}</label>
              <select required value={form.game_name} onChange={set("game_name")}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none">
                <option value="">-- {lang === "th" ? "เลือกเกม" : "Select game"} --</option>
                {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">{lang === "th" ? "Account Username *" : "Account Username *"}</label>
              <input required value={form.account_username} onChange={set("account_username")} placeholder="my_account_01"
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">{lang === "th" ? "Account Password *" : "Account Password *"}</label>
              <input required type="password" value={form.account_password} onChange={set("account_password")} placeholder="••••••••"
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">{lang === "th" ? "ราคา (THB) *" : "Price (THB) *"}</label>
              <input required type="number" min="1" value={form.price} onChange={set("price")} placeholder="299"
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">{lang === "th" ? "Stock" : "Stock"}</label>
              <input type="number" min="1" value={form.stock} onChange={set("stock")}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">{lang === "th" ? "Platform" : "Platform"}</label>
              <select value={form.platform} onChange={set("platform")} className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none">
                <option value="">-- {lang === "th" ? "เลือก" : "Select"} --</option>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">{lang === "th" ? "Region" : "Region"}</label>
              <select value={form.region} onChange={set("region")} className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none">
                <option value="">-- {lang === "th" ? "เลือก" : "Select"} --</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold text-text-subtle">{lang === "th" ? "รายละเอียดเพิ่มเติม" : "Additional Details"}</label>
              <textarea value={form.description} onChange={set("description")} rows={3} placeholder={lang === "th" ? "เช่น Rank, ของในเกม, อายุบัญชี..." : "e.g. Rank, in-game items, account age..."}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none resize-none" />
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3">
            <CTAButton type="button" variant="secondary" onClick={onClose} fullWidth>{lang === "th" ? "ยกเลิก" : "Cancel"}</CTAButton>
            <CTAButton type="submit" fullWidth disabled={submitting}>{submitting ? (lang === "th" ? "กำลังบันทึก..." : "Saving...") : (lang === "th" ? "เพิ่มบัญชี" : "Add Account")}</CTAButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GameAccountsPage() {
  const [accounts, setAccounts] = useState<GameAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { lang } = useLanguage();

  useEffect(() => {
    const token = getStoredToken();
    fetch("/api/seller/game-accounts", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setAccounts(d.accounts ?? []); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  const handleDelete = async (id: string) => {
    const token = getStoredToken();
    const res = await fetch(`/api/seller/game-accounts/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setAccounts((a) => a.filter((x) => x.id !== id));
    setDeletingId(null);
  };

  const handleToggle = async (acc: GameAccount) => {
    const token = getStoredToken();
    const res = await fetch(`/api/seller/game-accounts/${acc.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !acc.is_active }),
    });
    if (res.ok) {
      const data = await res.json();
      setAccounts((a) => a.map((x) => (x.id === acc.id ? data.account : x)));
    }
  };

  const activeAccounts = accounts.filter((a) => a.is_active);
  const totalValue = activeAccounts.reduce((sum, a) => sum + a.price * a.stock, 0);
  const totalSold = accounts.length;

  const statCards = [
    {
      label: lang === "th" ? "บัญชีทั้งหมด" : "Total Accounts",
      value: String(accounts.length),
      delta: "↑ 3",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_TOTAL,
    },
    {
      label: lang === "th" ? "บัญชีที่ขายได้" : "Active Accounts",
      value: String(activeAccounts.length),
      delta: lang === "th" ? "เปิดขาย" : "Listed",
      deltaColor: activeAccounts.length > 0 ? ("text-accent" as const) : ("text-text-muted" as const),
      sparklineData: SPARKLINE_ACTIVE,
    },
    {
      label: lang === "th" ? "มูลค่ารวม" : "Total Value",
      value: `฿${formatThaiBaht(totalValue)}`,
      delta: "↑ 12%",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_VALUE,
    },
    {
      label: lang === "th" ? "บัญชีที่ขายแล้ว" : "Accounts Sold",
      value: String(totalSold),
      delta: totalSold > 0 ? (lang === "th" ? `${totalSold} บัญชี` : `${totalSold} sold`) : "—",
      deltaColor: totalSold > 0 ? ("text-accent" as const) : ("text-text-muted" as const),
      sparklineData: SPARKLINE_SOLD,
    },
  ];

  return (
    <div className="space-y-6 md:space-y-7">
      {/* Page header */}
      <SectionHeader
        title={lang === "th" ? "🎮 บัญชีเกม" : "🎮 Game Accounts"}
        subtitle={
          lang === "th"
            ? "จัดการและขายบัญชีเกมของคุณบนแพลตฟอร์มกลาง"
            : "Manage and sell game accounts on the central platform"
        }
        cta={{
          label: lang === "th" ? "+ เพิ่มบัญชี" : "+ Add Account",
          onClick: () => setShowAdd(true),
        }}
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="surface-card p-5"><div className="h-24 rounded-2xl bg-bg-surface animate-pulse" /></div>)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="surface-card flex flex-col items-center justify-center py-16 text-center">
          <svg width="48" height="48" fill="none" viewBox="0 0 48 48" className="text-text-muted">
            <rect x="8" y="14" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
            <path d="M16 22h16M16 28h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="mt-4 text-text-muted">{lang === "th" ? "ยังไม่มีบัญชีเกม" : "No game accounts yet"}</p>
          <CTAButton onClick={() => setShowAdd(true)} className="mt-4">{lang === "th" ? "+ เพิ่มบัญชีแรก" : "+ Add first account"}</CTAButton>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div key={acc.id} className={`surface-card p-5 ${!acc.is_active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-primary/20 text-2xl">
                    🎮
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-text-main">{acc.game_name}</p>
                      {acc.game_name_th && <span className="text-sm text-text-muted">({acc.game_name_th})</span>}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        acc.is_active ? "bg-accent/20 text-accent" : "bg-text-muted/20 text-text-muted"
                      }`}>
                        {acc.is_active ? (lang === "th" ? "เปิดขาย" : "Active") : (lang === "th" ? "ปิด" : "Inactive")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-subtle">
                      {lang === "th" ? "👤 ผู้ใช้" : "👤 User"} {acc.account_username}
                      {acc.platform && <> · {acc.platform}</>}
                      {acc.region && <> · {acc.region}</>}
                    </p>
                    {acc.description && <p className="mt-1 text-sm text-text-muted line-clamp-2">{acc.description}</p>}
                    <p className="mt-1 text-xs text-text-muted">{lang === "th" ? "สต็อก" : "Stock"}: {acc.stock}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="type-num text-xl font-bold text-accent">฿{formatThaiBaht(acc.price)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggle(acc)} className="text-xs rounded-lg px-3 py-1.5 bg-bg-surface hover:bg-brand-primary/20 transition-colors text-text-subtle">
                      {acc.is_active ? (lang === "th" ? "ปิด" : "Deactivate") : (lang === "th" ? "เปิด" : "Activate")}
                    </button>
                    <button onClick={() => setDeletingId(acc.id)} className="text-xs rounded-lg px-3 py-1.5 bg-danger/20 text-danger hover:bg-danger/30 transition-colors">
                      {lang === "th" ? "ลบ" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 p-4">
          <div className="surface-card glass-panel w-full max-w-sm space-y-4 p-6">
            <h3 className="type-h2">{lang === "th" ? "ลบบัญชีเกม?" : "Delete Game Account?"}</h3>
            <p className="text-sm text-text-subtle">{lang === "th" ? "การดำเนินการนี้ไม่สามารถย้อนกลับได้" : "This action cannot be undone"}</p>
            <div className="flex gap-3">
              <CTAButton variant="secondary" onClick={() => setDeletingId(null)} fullWidth>{lang === "th" ? "ยกเลิก" : "Cancel"}</CTAButton>
              <CTAButton onClick={() => handleDelete(deletingId)} fullWidth className="!bg-danger !text-white">{lang === "th" ? "ลบ" : "Delete"}</CTAButton>
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddGameAccountModal onClose={() => setShowAdd(false)} onAdd={(acc) => setAccounts((a) => [acc, ...a])} />}
    </div>
  );
}
