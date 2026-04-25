"use client";

import { useEffect, useState } from "react";
import CTAButton from "@/app/components/CTAButton";
import { useLanguage } from "@/app/context/LanguageContext";
import { getStoredToken } from "@/app/lib/auth-client";


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

export default function SellerSettingsPage() {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patchAvailable, setPatchAvailable] = useState(true);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState<SellerStats>({
    rating: 0,
    salesCount: 0,
    balance: 0,
    verificationStatus: "",
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

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch("/api/seller/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as SellerMeResponse;
        setForm((prev) => ({
          ...prev,
          shopName: data.seller.shopName ?? prev.shopName,
          shopDescription: data.seller.shopDescription ?? prev.shopDescription,
          avatarUrl: data.seller.avatarUrl ?? prev.avatarUrl,
          phone: data.seller.phone ?? prev.phone,
        }));
        setStats({
          rating: data.seller.rating ?? 0,
          salesCount: data.seller.salesCount ?? 0,
          balance: data.seller.balance ?? 0,
          verificationStatus: data.seller.verificationStatus ?? "",
        });
      })
      .catch(() => {
        // error — form/stats stay as initial values
      })
      .finally(() => {
        setLoading(false);
      });

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
        if (res.status === 404 || res.status === 405) {
          setPatchAvailable(false);
        }
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

  const updateField = (field: keyof SellerProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <div>
        <h1 className="type-h1">{t("settings_title")}</h1>
        <p className="type-body mt-1 max-w-[58ch] text-text-subtle">
          {lang === "th"
            ? "จัดการข้อมูลร้านค้า บัญชีธนาคาร และโปรไฟล์ของคุณบนแพลตฟอร์มกลาง"
            : "Manage your shop info, bank account, and seller profile on the central platform."}
        </p>
      </div>

      {!patchAvailable && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 px-5 py-4 text-sm text-warning">
          {lang === "th"
            ? "Settings API กำลังจะมาเร็วๆ นี้ — ข้อมูลจะถูกบันทึกเมื่อเปิดใช้งาน"
            : "Settings API coming soon — changes will be saved when available."}
        </div>
      )}

      <div className="surface-card glass-panel p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold text-text-subtle">{t("settings_shopName")}</label>
              <input
                type="text"
                value={form.shopName}
                onChange={updateField("shopName")}
                required
                className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold text-text-subtle">
                {lang === "th" ? "คำอธิบายร้านค้า" : "Shop Description"}
              </label>
              <textarea
                value={form.shopDescription}
                onChange={updateField("shopDescription")}
                rows={3}
                className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold text-text-subtle">
                {lang === "th" ? "URL รูปโปรไฟล์" : "Avatar URL"}
              </label>
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

            <div className="space-y-2 sm:col-span-2">
              <div className="rounded-xl border border-border-subtle bg-bg-surface/50 p-4">
                <h3 className="text-sm font-semibold text-text-subtle mb-3">
                  {lang === "th" ? "สถิติผู้ขาย" : "Seller Stats"}
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-xs text-text-muted">{lang === "th" ? "เรตติ้ง" : "Rating"}</p>
                    <p className="text-lg font-semibold text-text-main">{stats.rating.toFixed(1)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-text-muted">{lang === "th" ? "ยอดขาย" : "Sales"}</p>
                    <p className="text-lg font-semibold text-text-main">{stats.salesCount.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-text-muted">{lang === "th" ? "ยอดคงเหลือ" : "Balance"}</p>
                    <p className="text-lg font-semibold text-text-main">฿{stats.balance.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-text-muted">{lang === "th" ? "สถานะ" : "Status"}</p>
                    <p className="text-lg font-semibold text-text-main capitalize">{stats.verificationStatus}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-text-subtle">
                  {lang === "th" ? "ข้อมูลธนาคาร (รอเปิดใช้งาน)" : "Bank Details (Coming Soon)"}
                </label>
                <span className="rounded-full bg-text-muted/20 px-2 py-0.5 text-[10px] font-medium text-text-muted uppercase">
                  {lang === "th" ? "cosmetic" : "cosmetic"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-subtle">
                    {lang === "th" ? "ชื่อธนาคาร" : "Bank Name"}
                  </label>
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={updateField("bankName")}
                    className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-subtle">
                    {lang === "th" ? "เลขบัญชีธนาคาร" : "Bank Account Number"}
                  </label>
                  <input
                    type="text"
                    value={form.bankAccountNumber}
                    onChange={updateField("bankAccountNumber")}
                    className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-text-subtle">
                    {lang === "th" ? "ชื่อบัญชีผู้ถือ" : "Account Holder Name"}
                  </label>
                  <input
                    type="text"
                    value={form.accountHolderName}
                    onChange={updateField("accountHolderName")}
                    className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <CTAButton type="submit" disabled={!patchAvailable || saving} className="h-12">
            {saving
              ? lang === "th"
                ? "กำลังบันทึก..."
                : "Saving..."
              : t("settings_save")}
          </CTAButton>
        </form>
      </div>

      {saved && (
        <div className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-black text-bg-base shadow-2xl">
            ✓ {t("settings_saved")}
          </div>
        </div>
      )}
    </div>
  );
}
