"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { getStoredToken } from "@/app/lib/auth-client";
import { formatThaiBaht } from "@/app/lib/marketplace";
import CTAButton from "@/app/components/CTAButton";
import SellerPageShell from "@/app/components/seller/seller-page-shell";
import SellerStatusBadge from "@/app/components/seller/seller-status-badge";
import type { GameAccount } from "@/types/database";

interface AddModalProps {
  onClose: () => void;
  onAdd: (acc: GameAccount) => void;
}

const GAMES = ["Mobile Legends", "Genshin Impact", "Free Fire", "PUBG Mobile", "Valorant", "League of Legends", "Apex Legends", "Honkai: Star Rail"];
const PLATFORMS = ["Mobile", "PC", "PS4", "PS5", "Xbox", "Switch"];
const REGIONS = ["Global", "Thai", "SEA", "CN", "JP", "KR", "EU", "US"];

function AddGameAccountModal({ onClose, onAdd }: AddModalProps) {
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
          <h2 className="type-h2">🎮 เพิ่มบัญชีเกม</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold text-text-subtle">ชื่อเกม *</label>
              <select required value={form.game_name} onChange={set("game_name")}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none">
                <option value="">-- เลือกเกม --</option>
                {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">Account Username *</label>
              <input required value={form.account_username} onChange={set("account_username")} placeholder="my_account_01"
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">Account Password *</label>
              <input required type="password" value={form.account_password} onChange={set("account_password")} placeholder="••••••••"
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">ราคา (THB) *</label>
              <input required type="number" min="1" value={form.price} onChange={set("price")} placeholder="299"
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">Stock</label>
              <input type="number" min="1" value={form.stock} onChange={set("stock")}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">Platform</label>
              <select value={form.platform} onChange={set("platform")} className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none">
                <option value="">-- เลือก --</option>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">Region</label>
              <select value={form.region} onChange={set("region")} className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none">
                <option value="">-- เลือก --</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold text-text-subtle">รายละเอียดเพิ่มเติม</label>
              <textarea value={form.description} onChange={set("description")} rows={3} placeholder="เช่น Rank, ของในเกม, อายุบัญชี..."
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none resize-none" />
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3">
            <CTAButton type="button" variant="secondary" onClick={onClose} fullWidth>ยกเลิก</CTAButton>
            <CTAButton type="submit" fullWidth disabled={submitting}>{submitting ? "กำลังบันทึก..." : "เพิ่มบัญชี"}</CTAButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GameAccountsPage() {
  const { lang } = useLanguage();
  const [accounts, setAccounts] = useState<GameAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <SellerPageShell
      eyebrow={lang === "th" ? "Account Inventory" : "Account Inventory"}
      title={lang === "th" ? "ระบบจัดการบัญชีเกม" : "Game account inventory"}
      description={
        lang === "th"
          ? "ติดตามบัญชีเกมที่เปิดขาย จำนวน stock และมูลค่าสินค้าคงเหลือจากพื้นที่เดียว"
          : "Manage resellable game accounts, stock counts, and inventory value from one workspace."
      }
      action={<CTAButton onClick={() => setShowAdd(true)}>+ เพิ่มบัญชี</CTAButton>}
    >

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/10 bg-bg-surface/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">จำนวนบัญชี</p>
          <p className="type-num mt-2 text-3xl font-extrabold text-text-main">{accounts.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-bg-surface/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">บัญชีที่ขายได้</p>
          <p className="type-num mt-2 text-3xl font-extrabold text-accent">{activeAccounts.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-bg-surface/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">มูลค่ารวม</p>
          <p className="type-num mt-2 text-3xl font-extrabold text-text-main">฿{formatThaiBaht(totalValue)}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-bg-surface/80 py-16 text-center">
          <span className="text-5xl">🎮</span>
          <p className="mt-4 text-text-muted">ยังไม่มีบัญชีเกม</p>
          <CTAButton onClick={() => setShowAdd(true)} className="mt-4">+ เพิ่มบัญชีแรก</CTAButton>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div key={acc.id} className={`rounded-[1.5rem] border border-white/10 bg-bg-surface/80 p-5 ${!acc.is_active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-primary/20 text-2xl">
                    🎮
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-text-main">{acc.game_name}</p>
                      {acc.game_name_th && <span className="text-sm text-text-muted">({acc.game_name_th})</span>}
                      <SellerStatusBadge label={acc.is_active ? "active" : "paused"} />
                    </div>
                    <p className="mt-1 text-sm text-text-subtle">
                      👤 {acc.account_username}
                      {acc.platform && <> · {acc.platform}</>}
                      {acc.region && <> · {acc.region}</>}
                    </p>
                    {acc.description && <p className="mt-1 text-sm text-text-muted line-clamp-2">{acc.description}</p>}
                    <p className="mt-1 text-xs text-text-muted">Stock: {acc.stock}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="type-num text-xl font-bold text-accent">฿{formatThaiBaht(acc.price)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggle(acc)} className="text-xs rounded-lg px-3 py-1.5 bg-bg-surface hover:bg-brand-primary/20 transition-colors">
                      {acc.is_active ? "ปิด" : "เปิด"}
                    </button>
                    <button onClick={() => setDeletingId(acc.id)} className="text-xs rounded-lg px-3 py-1.5 bg-danger/20 text-danger hover:bg-danger/30 transition-colors">
                      ลบ
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
            <h3 className="type-h2">ลบบัญชีเกม?</h3>
            <p className="text-sm text-text-subtle">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            <div className="flex gap-3">
              <CTAButton variant="secondary" onClick={() => setDeletingId(null)} fullWidth>ยกเลิก</CTAButton>
              <CTAButton onClick={() => handleDelete(deletingId)} fullWidth className="!bg-danger !text-white">ลบ</CTAButton>
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddGameAccountModal onClose={() => setShowAdd(false)} onAdd={(acc) => setAccounts((a) => [acc, ...a])} />}
    </SellerPageShell>
  );
}
