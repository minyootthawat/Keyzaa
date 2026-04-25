"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import CTAButton from "@/app/components/CTAButton";

export default function SellerRegisterPage() {
  const router = useRouter();
  const { registerSeller, isRegisteredSeller, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!authLoading && isRegisteredSeller) {
      router.push("/seller/dashboard");
    }
  }, [authLoading, isRegisteredSeller, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !phone.trim()) {
      setError(t("register_required"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      await registerSeller({ shopName: shopName.trim(), phone: phone.trim() });
      router.push("/seller/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("register_required"));
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: "⚡", text: t("register_benefit_fast") || "รวดเร็ว" },
    { icon: "🔒", text: t("register_benefit_secure") || "ปลอดภัย" },
    { icon: "💚", text: t("register_benefit_free") || "ไม่มีค่าใช้จ่าย" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        {/* Gradient blobs */}
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-brand-primary/20 to-transparent blur-[100px]" />
        <div className="absolute -right-40 -bottom-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-accent/15 to-transparent blur-[100px]" />
        <div className="absolute left-1/3 top-1/2 h-[300px] w-[300px] rounded-full bg-brand-secondary/10 to-transparent blur-[80px]" />
        
        {/* Geometric shapes */}
        <svg className="absolute right-10 top-32 opacity-[0.07]" width="120" height="120" viewBox="0 0 120 120" fill="none">
          <rect x="10" y="10" width="100" height="100" rx="20" stroke="currentColor" strokeWidth="1" transform="rotate(15 60 60)" className="text-brand-primary"/>
        </svg>
        <svg className="absolute bottom-32 left-10 opacity-[0.06]" width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="1" className="text-accent"/>
        </svg>
        <svg className="absolute right-1/4 bottom-1/4 opacity-[0.05]" width="60" height="60" viewBox="0 0 60 60" fill="none">
          <polygon points="30,5 55,50 5,50" stroke="currentColor" strokeWidth="1" className="text-brand-primary"/>
        </svg>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-[480px]">
          {/* Hero section */}
          <div className={`text-center mb-10 motion-fade-up ${mounted ? "animate-[fadeUp_0.6s_ease-out]" : "opacity-0"}`}>
            {/* Animated icon */}
            <div className="relative mx-auto mb-6 inline-flex">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-primary/30 to-accent/20 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/10 border border-brand-primary/20 backdrop-blur-sm">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              {/* Floating sparkle */}
              <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-bg-elevated/80 text-xs animate-pulse">
                ✨
              </div>
            </div>
            
            <h1 className="type-h1 text-gradient-brand mb-3">
              {t("register_title")}
            </h1>
            <p className="type-body text-text-subtle max-w-sm mx-auto">
              {t("register_subtitle")}
            </p>
          </div>

          {/* Trust badges */}
          <div className={`mb-8 flex justify-center gap-6 motion-fade-up ${mounted ? "animate-[fadeUp_0.6s_ease-out_0.1s_both]" : "opacity-0"}`}>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-text-muted">
                <span className="text-base">{benefit.icon}</span>
                <span className="font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Form card */}
          <div className={`surface-card glass-panel p-8 motion-fade-up ${mounted ? "animate-[fadeUp_0.6s_ease-out_0.2s_both]" : "opacity-0"}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shop name field */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-text-subtle">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  {t("register_shopName")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder={t("register_shopName")}
                    className="w-full rounded-xl bg-bg-base/60 border border-border-subtle/50 px-4 py-3.5 pl-11 text-sm text-text-main placeholder:text-text-muted transition-all duration-200 focus:border-brand-primary/60 focus:bg-bg-base/80 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>

              {/* Phone field */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-text-subtle">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {t("register_phone")}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812345678"
                    className="w-full rounded-xl bg-bg-base/60 border border-border-subtle/50 px-4 py-3.5 pl-11 text-sm text-text-main placeholder:text-text-muted transition-all duration-200 focus:border-brand-primary/60 focus:bg-bg-base/80 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit button */}
              <CTAButton 
                type="submit" 
                fullWidth 
                className="h-13 mt-2 relative overflow-hidden" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{t("register_loading")}</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {t("register_submit")}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                )}
              </CTAButton>
            </form>

            {/* Marketplace note */}
            <div className="mt-6 rounded-xl border border-white/8 bg-bg-base/50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-text-main text-sm">{t("register_marketplaceNoteTitle")}</p>
                  <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-text-subtle">
                    <li className="flex items-center gap-2">
                      <span className="text-accent text-xs">✓</span>
                      {t("register_marketplaceNoteItem1")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent text-xs">✓</span>
                      {t("register_marketplaceNoteItem2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent text-xs">✓</span>
                      {t("register_marketplaceNoteItem3")}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer text */}
          <p className={`mt-6 text-center text-sm text-text-muted motion-fade-up ${mounted ? "animate-[fadeUp_0.6s_ease-out_0.3s_both]" : "opacity-0"}`}>
            {t("register_alreadyHaveAccount")}{" "}
            <a href="/seller/dashboard" className="font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors">
              {t("register_loginCta")}
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}