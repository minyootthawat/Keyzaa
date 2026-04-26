"use client";

import { useEffect, useState } from "react";
import CTAButton from "@/app/components/CTAButton";
import SectionHeader from "@/app/components/SectionHeader";
import StatCard from "@/app/components/StatCard";
import { useLanguage } from "@/app/context/LanguageContext";
import { getStoredToken } from "@/app/lib/auth-client";
import { formatThaiBaht } from "@/app/lib/marketplace";

type SettingsTab = "profile" | "verification" | "payout" | "notifications" | "security";

interface SellerProfile {
  shopName: string;
  shopDescription: string;
  avatarUrl: string;
  phone: string;
  bankName: string;
  bankAccountNumber: string;
  accountHolderName: string;
}

interface SellerStats {
  rating: number;
  salesCount: number;
  balance: number;
  verificationStatus: string;
}

interface SellerMeResponse {
  seller: {
    id: string;
    shopName: string;
    phone: string;
    shopDescription: string;
    avatarUrl: string;
    rating: number;
    salesCount: number;
    balance: number;
    verificationStatus: string;
  };
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

const MOCK_BANKS: BankAccount[] = [
  { id: "b1", bankName: "Kasikorn Bank", accountNumber: "1234567890", accountHolder: "บริษัท คีซาจำกัด" },
  { id: "b2", bankName: "SCB", accountNumber: "9876543210", accountHolder: "บริษัท คีซาจำกัด" },
];

const TABS: { key: SettingsTab; labelTh: string; labelEn: string }[] = [
  { key: "profile", labelTh: "โปรไฟล์", labelEn: "Profile" },
  { key: "verification", labelTh: "การยืนยันตัวตน", labelEn: "Verification" },
  { key: "payout", labelTh: "วิธีรับเงิน", labelEn: "Payout" },
  { key: "notifications", labelTh: "การแจ้งเตือน", labelEn: "Notifications" },
  { key: "security", labelTh: "ความปลอดภัย", labelEn: "Security" },
];

// Sparkline patterns
const SPARKLINE_RATING = [70, 75, 80, 78, 82, 85, 88];
const SPARKLINE_SALES = [55, 70, 60, 85, 75, 90, 95];
const SPARKLINE_BALANCE = [80, 65, 90, 70, 85, 95, 100];
const SPARKLINE_VERIFIED = [90, 70, 60, 85, 55, 75, 80];

export default function SellerSettingsPage() {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [patchAvailable, setPatchAvailable] = useState(true);
  const [stats, setStats] = useState<SellerStats>({
    rating: 0, salesCount: 0, balance: 0, verificationStatus: "",
  });

  const [form, setForm] = useState<SellerProfile>({
    shopName: "",
    shopDescription: "",
    avatarUrl: "",
    phone: "",
    bankName: "",
    bankAccountNumber: "",
    accountHolderName: "",
  });

  // Notification toggles
  const [notifs, setNotifs] = useState({
    newOrder: true,
    lowStock: true,
    payoutProcessed: true,
    disputeRefund: true,
    marketing: false,
  });

  // Security state
  const [sessions] = useState([
    { id: "s1", device: "Chrome on MacOS", location: "Bangkok, TH", lastActive: "2 min ago", current: true },
    { id: "s2", device: "Safari on iPhone", location: "Bangkok, TH", lastActive: "1 hour ago", current: false },
  ]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch("/api/seller/me", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as SellerMeResponse;
        setForm({
          shopName: data.seller.shopName ?? "",
          shopDescription: data.seller.shopDescription ?? "",
          avatarUrl: data.seller.avatarUrl ?? "",
          phone: data.seller.phone ?? "",
          bankName: "",
          bankAccountNumber: "",
          accountHolderName: "",
        });
        setStats({
          rating: data.seller.rating ?? 0,
          salesCount: data.seller.salesCount ?? 0,
          balance: data.seller.balance ?? 0,
          verificationStatus: data.seller.verificationStatus ?? "",
        });
      })
      .catch(() => {
        // leave defaults on error
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patchAvailable) return;

    const token = getStoredToken();
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch("/api/seller/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopName: form.shopName.trim(),
          shopDescription: form.shopDescription.trim(),
          avatarUrl: form.avatarUrl.trim(),
          bankName: form.bankName.trim(),
          bankAccountNumber: form.bankAccountNumber.trim(),
          accountHolderName: form.accountHolderName.trim(),
        }),
      });

      if (!res.ok) {
        if (res.status === 404 || res.status === 405) setPatchAvailable(false);
        throw new Error("Save failed");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setPatchAvailable(false);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof SellerProfile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // KPI stat cards
  const statCards = [
    {
      label: lang === "th" ? "เรตติ้ง" : "Rating",
      value: stats.rating > 0 ? stats.rating.toFixed(1) : "—",
      delta: stats.rating > 0 ? "⭐" : "—",
      deltaColor: stats.rating > 0 ? ("text-accent" as const) : ("text-text-muted" as const),
      sparklineData: SPARKLINE_RATING,
    },
    {
      label: lang === "th" ? "ยอดขาย" : "Sales",
      value: stats.salesCount > 0 ? stats.salesCount.toLocaleString() : "0",
      delta: stats.salesCount > 0 ? (lang === "th" ? "รายการ" : "orders") : "—",
      deltaColor: stats.salesCount > 0 ? ("text-accent" as const) : ("text-text-muted" as const),
      sparklineData: SPARKLINE_SALES,
    },
    {
      label: lang === "th" ? "ยอดคงเหลือ" : "Balance",
      value: `฿${formatThaiBaht(stats.balance)}`,
      delta: lang === "th" ? "คงเหลือ" : "Available",
      deltaColor: stats.balance > 0 ? ("text-accent" as const) : ("text-text-muted" as const),
      sparklineData: SPARKLINE_BALANCE,
    },
    {
      label: lang === "th" ? "สถานะ" : "Status",
      value: stats.verificationStatus === "verified"
        ? (lang === "th" ? "ยืนยันแล้ว" : "Verified")
        : stats.verificationStatus === "top_rated"
        ? (lang === "th" ? "ระดับสูง" : "Top Rated")
        : (lang === "th" ? "รอตรวจ" : "Pending"),
      delta: stats.verificationStatus,
      deltaColor: stats.verificationStatus === "verified"
        ? ("text-accent" as const)
        : stats.verificationStatus === "top_rated"
        ? ("text-brand-primary" as const)
        : ("text-warning" as const),
      sparklineData: SPARKLINE_VERIFIED,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-7">
      {/* Page header */}
      <SectionHeader
        title={t("settings_title")}
        subtitle={
          lang === "th"
            ? "จัดการข้อมูลร้านค้า บัญชีธนาคาร และความปลอดภัยบนแพลตฟอร์มกลาง"
            : "Manage your shop info, bank accounts, and security on the central platform."
        }
      />

      {/* API not ready warning */}
      {!patchAvailable && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 px-5 py-4 text-sm text-warning">
          {lang === "th"
            ? "Settings API กำลังจะมาเร็วๆ นี้ — ข้อมูลจะถูกบันทึกเมื่อเปิดใช้งาน"
            : "Settings API coming soon — changes will be saved when available."}
        </div>
      )}

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Tab bar */}
      <div className="surface-card p-1.5">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-brand-primary text-white shadow-lg"
                    : "text-text-muted hover:bg-bg-surface hover:text-text-subtle"
                }`}
              >
                {lang === "th" ? tab.labelTh : tab.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "profile" && (
        <div className="surface-card glass-panel p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar + shop name row */}
            <div className="flex items-start gap-5">
              <div className="relative shrink-0">
                {form.avatarUrl ? (
                  <img
                    src={form.avatarUrl}
                    alt="avatar"
                    className="h-20 w-20 rounded-2xl object-cover border-2 border-border-subtle"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-primary/20 text-3xl border-2 border-border-subtle">
                    🏪
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-subtle">
                    {t("settings_shopName") ?? (lang === "th" ? "ชื่อร้าน" : "Shop Name")}
                  </label>
                  <input
                    type="text"
                    value={form.shopName}
                    onChange={updateField("shopName")}
                    required
                    className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-text-subtle">
                  {lang === "th" ? "คำอธิบายร้านค้า" : "Shop Description"}
                </label>
                <textarea
                  value={form.shopDescription}
                  onChange={updateField("shopDescription")}
                  rows={3}
                  maxLength={280}
                  placeholder={lang === "th" ? "อธิบายร้านค้าของคุณ..." : "Describe your shop..."}
                  className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none"
                />
                <p className="text-xs text-text-muted text-right">{form.shopDescription.length}/280</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-subtle">{lang === "th" ? "URL รูปโปรไฟล์" : "Avatar URL"}</label>
                <input
                  type="url"
                  value={form.avatarUrl}
                  onChange={updateField("avatarUrl")}
                  placeholder="https://..."
                  className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-subtle">
                  {lang === "th" ? "หมายเลขโทรศัพท์" : "Phone"}
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={updateField("phone")}
                  className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>

            <CTAButton type="submit" disabled={!patchAvailable || saving} className="h-12">
              {saving
                ? (lang === "th" ? "กำลังบันทึก..." : "Saving...")
                : t("settings_save")}
            </CTAButton>
          </form>
        </div>
      )}

      {activeTab === "verification" && (
        <div className="space-y-4">
          <div className="surface-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="type-h2">{lang === "th" ? "สถานะการยืนยันตัวตน" : "Verification Status"}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                stats.verificationStatus === "verified"
                  ? "bg-accent/20 text-accent"
                  : stats.verificationStatus === "top_rated"
                  ? "bg-brand-primary/20 text-brand-primary"
                  : "bg-warning/20 text-warning"
              }`}>
                {stats.verificationStatus === "verified"
                  ? (lang === "th" ? "ยืนยันแล้ว" : "Verified")
                  : stats.verificationStatus === "top_rated"
                  ? (lang === "th" ? "ระดับสูงสุด" : "Top Rated")
                  : (lang === "th" ? "รอตรวจสอบ" : "Pending")}
              </span>
            </div>

            <div className="space-y-3">
              {[
                { label: lang === "th" ? "บัตรประจำตัวประชาชน" : "ID Card", done: true },
                { label: lang === "th" ? "หลักฐานที่อยู่" : "Proof of Address", done: true },
                { label: lang === "th" ? "เอกสารธุรกิจ (ถ้ามี)" : "Business Docs (optional)", done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-surface/50 p-4">
                  <span className="text-sm font-semibold text-text-subtle">{item.label}</span>
                  <div className={`flex items-center gap-2 ${item.done ? "text-accent" : "text-text-muted"}`}>
                    {item.done ? (
                      <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M5.5 9l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
                        <path d="M9 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                    <span className="text-sm font-semibold">
                      {item.done ? (lang === "th" ? "ส่งแล้ว" : "Submitted") : (lang === "th" ? "รอดำเนินการ" : "Pending")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {stats.verificationStatus === "new" && (
            <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5 text-sm text-text-subtle">
              <p className="font-semibold text-warning mb-1">
                {lang === "th" ? "ร้านค้าของคุณกำลังรอการตรวจสอบ" : "Your store is under review"}
              </p>
              <p>
                {lang === "th"
                  ? "ทีมงานจะตรวจสอบเอกสารภายใน 24-48 ชั่วโมง คุณจะได้รับอีเมลแจ้งเตือนเมื่อเสร็จสิ้น"
                  : "Our team will review your documents within 24-48 hours. You'll receive an email notification when complete."}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "payout" && (
        <div className="space-y-4">
          <div className="surface-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="type-h2">{lang === "th" ? "บัญชีธนาคาร" : "Bank Accounts"}</h2>
              <button className="btn-secondary rounded-xl px-4 py-2 text-sm font-semibold">
                + {lang === "th" ? "เพิ่มบัญชี" : "Add Account"}
              </button>
            </div>

            <div className="space-y-3">
              {MOCK_BANKS.map((bank) => (
                <div
                  key={bank.id}
                  className="flex items-center justify-between rounded-2xl border border-border-subtle bg-bg-surface/60 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/20 text-brand-primary font-bold text-sm">
                      {bank.bankName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-text-main">{bank.bankName}</p>
                      <p className="text-sm text-text-muted">
                        {lang === "th" ? "บัญชี" : "Account"} ****{bank.accountNumber.slice(-4)} • {bank.accountHolder}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent">
                      {lang === "th" ? "ค่าพื้นฐาน" : "Default"}
                    </span>
                    <button className="text-xs text-text-muted hover:text-text-subtle transition-colors">
                      {lang === "th" ? "แก้ไข" : "Edit"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PromptPay */}
          <div className="surface-card p-5">
            <h3 className="type-h2 mb-3">{lang === "th" ? "QR PromptPay" : "PromptPay QR"}</h3>
            <div className="flex items-center gap-5 rounded-2xl border border-border-subtle bg-bg-surface/60 p-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-white">
                <div className="text-4xl">📱</div>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-subtle">
                  {lang === "th" ? "สแกนเพื่อรับเงิน" : "Scan to receive payment"}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {lang === "th"
                    ? "รองรับการโอนผ่าน Mobile Banking ทุกธนาคาร"
                    : "Accepted via all Thai mobile banking apps"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="surface-card p-5 space-y-4">
          <h2 className="type-h2 mb-4">{lang === "th" ? "การแจ้งเตือน" : "Notifications"}</h2>

          {[
            { key: "newOrder" as const, labelTh: "แจ้งเตือนคำสั่งซื้อใหม่", labelEn: "New order notifications", descTh: "อีเมล + SMS เมื่อมีคำสั่งซื้อใหม่", descEn: "Email + SMS when a new order comes in" },
            { key: "lowStock" as const, labelTh: "แจ้งเตือนสต็อกใกล้หมด", labelEn: "Low stock alerts", descTh: "แจ้งเตือนเมื่อสินค้าเหลือน้อยกว่า 10 ชิ้น", descEn: "Alert when stock drops below 10 units" },
            { key: "payoutProcessed" as const, labelTh: "แจ้งเตือนการจ่ายเงิน", labelEn: "Payout notifications", descTh: "แจ้งเตือนเมื่อมีการจ่ายเงินสำเร็จ", descEn: "Alert when a payout is processed" },
            { key: "disputeRefund" as const, labelTh: "การแจ้งข้อพิพาท/คืนเงิน", labelEn: "Dispute & refund notices", descTh: "แจ้งเตือนเมื่อมีข้อพิพาทหรือการคืนเงิน", descEn: "Alert when a dispute or refund occurs" },
            { key: "marketing" as const, labelTh: "ข้อเสนอและโปรโมชัน", labelEn: "Promotions & offers", descTh: "รับข้อเสนอพิเศษและโปรโมชัน", descEn: "Receive special offers and promotions" },
          ].map((notif) => (
            <div key={notif.key} className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-surface/50 p-4">
              <div>
                <p className="text-sm font-semibold text-text-main">
                  {lang === "th" ? notif.labelTh : notif.labelEn}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {lang === "th" ? notif.descTh : notif.descEn}
                </p>
              </div>
              <button
                onClick={() => setNotifs((prev) => ({ ...prev, [notif.key]: !prev[notif.key] }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  notifs[notif.key] ? "bg-brand-primary" : "bg-bg-surface-hover"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    notifs[notif.key] ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-4">
          {/* Change password */}
          <div className="surface-card p-5">
            <h2 className="type-h2 mb-4">{lang === "th" ? "เปลี่ยนรหัสผ่าน" : "Change Password"}</h2>
            <form
              onSubmit={(e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 3000); }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-subtle">
                  {lang === "th" ? "รหัสผ่านปัจจุบัน" : "Current Password"}
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-subtle">
                    {lang === "th" ? "รหัสผ่านใหม่" : "New Password"}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-subtle">
                    {lang === "th" ? "ยืนยันรหัสผ่านใหม่" : "Confirm New Password"}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
              </div>
              <CTAButton type="submit" className="h-11">
                {lang === "th" ? "อัปเดตรหัสผ่าน" : "Update Password"}
              </CTAButton>
            </form>
          </div>

          {/* 2FA */}
          <div className="surface-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-main">
                  {lang === "th" ? "การยืนยันสองขั้น (2FA)" : "Two-Factor Authentication (2FA)"}
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  {lang === "th"
                    ? "เพิ่มความปลอดภัยด้วยการยืนยันตัวตนสองขั้น"
                    : "Add an extra layer of security with 2FA"}
                </p>
              </div>
              <button
                className={`relative h-6 w-11 rounded-full transition-colors bg-bg-surface-hover`}
              >
                <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow" />
              </button>
            </div>
          </div>

          {/* Active sessions */}
          <div className="surface-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="type-h2">{lang === "th" ? "เซสชันที่กำลังใช้งาน" : "Active Sessions"}</h2>
              <button className="text-sm font-semibold text-danger hover:text-danger/80 transition-colors">
                {lang === "th" ? "ออกจากทุกอุปกรณ์" : "Sign out all"}
              </button>
            </div>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-surface/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/20 text-brand-primary text-sm">
                      💻
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-main">
                        {session.device}
                        {session.current && (
                          <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                            {lang === "th" ? "ปัจจุบัน" : "Current"}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-text-muted">
                        {session.location} · {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <button className="text-xs text-text-muted hover:text-danger transition-colors">
                      {lang === "th" ? "ออกจากอุปกรณ์" : "Sign out"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Saved toast */}
      {saved && (
        <div className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 motion-fade-up">
          <div className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-black text-bg-base shadow-2xl">
            <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
              <path d="M4 9l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("settings_saved")}
          </div>
        </div>
      )}
    </div>
  );
}
