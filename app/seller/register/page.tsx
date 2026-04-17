"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import CTAButton from "@/app/components/CTAButton";

export default function SellerRegisterPage() {
  const router = useRouter();
  const { registerSeller, isRegisteredSeller } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  if (isRegisteredSeller) {
    router.push("/seller/dashboard");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shopName.trim() || !phone.trim()) {
      setError(t("register_required"));
      return;
    }
    registerSeller({ name: name.trim(), shopName: shopName.trim(), phone: phone.trim() });
    router.push("/seller/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="surface-card glass-panel w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-primary/20 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="type-h1">{t("register_title")}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-subtle">{t("auth_login")} / Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อของคุณ"
              className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-subtle">{t("register_shopName")}</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="ชื่อร้านค้าของคุณ"
              className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-subtle">{t("register_phone")}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812345678"
              className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-sm text-danger font-semibold">{error}</p>
          )}

          <CTAButton type="submit" fullWidth className="h-12">
            {t("register_submit")}
          </CTAButton>
        </form>
      </div>
    </div>
  );
}
