"use client";

import { useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import CTAButton from "@/app/components/CTAButton";

export default function SellerSettingsPage() {
  const { seller, updateSeller } = useAuth();
  const { t } = useLanguage();
  const [shopName, setShopName] = useState(seller?.shopName || "");
  const [phone, setPhone] = useState(seller?.phone || "");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSeller({ shopName: shopName.trim(), phone: phone.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <h1 className="type-h1">{t("settings_title")}</h1>

      <div className="surface-card glass-panel p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-subtle">{t("settings_shopName")}</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
              className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-subtle">{t("settings_phone")}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
            />
          </div>

          <CTAButton type="submit" className="h-12">
            {t("settings_save")}
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
