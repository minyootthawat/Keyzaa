"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  Zap,
  ShieldCheck,
  CreditCard,
  Store,
  TrendingUp,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface Step {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  labelKey: "register_step1" | "register_step1Desc" | "register_step2" | "register_step2Desc" | "register_step3" | "register_step3Desc";
  descKey: "register_step1" | "register_step1Desc" | "register_step2" | "register_step2Desc" | "register_step3" | "register_step3Desc";
}

const STEPS: Step[] = [
  {
    icon: Store,
    labelKey: "register_step1",
    descKey: "register_step1Desc",
  },
  {
    icon: TrendingUp,
    labelKey: "register_step2",
    descKey: "register_step2Desc",
  },
  {
    icon: CreditCard,
    labelKey: "register_step3",
    descKey: "register_step3Desc",
  },
];

const TRUST_STATS: { value: string; labelKey: "register_statSellers" | "register_statEarnings" | "register_statRating" }[] = [
  { value: "12,000+", labelKey: "register_statSellers" },
  { value: "฿8.4M", labelKey: "register_statEarnings" },
  { value: "4.9", labelKey: "register_statRating" },
];

function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          // Simple display since we're using static target values
          setDisplay(target);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="font-black tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

function LeftPanel() {
  const { t } = useLanguage();

  return (
    <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] min-h-full flex-col justify-between overflow-hidden py-16 pl-16 pr-12">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-[#2d5bff]/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-[#3fcf8e]/12 blur-[90px]" />
        <div className="absolute left-1/3 top-1/2 h-[240px] w-[240px] rounded-full bg-[#1537b8]/30 blur-[80px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(141,181,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(141,181,255,0.8) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 space-y-16">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#8db5ff]/20 bg-gradient-to-br from-[#2d5bff] to-[#1537b8] text-white font-black text-lg shadow-lg shadow-[#2d5bff]/20">
              KZ
            </div>
            <div>
              <p className="text-base font-black tracking-tight text-[#f7f9ff]">Keyzaa Seller</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8ea3c7]">
                {t("register_brandTagline")}
              </p>
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="space-y-5 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#8db5ff]/20 bg-[#122036]/80 px-3 py-1.5 text-xs font-semibold text-[#8ea3c7]">
            <Zap size={12} className="text-[#3fcf8e]" />
            {t("register_badge")}
          </div>
          <h2 className="type-display text-[#f7f9ff] leading-[1.08]">
            {t("register_headline")}
          </h2>
          <p className="type-body text-[#8ea3c7] leading-relaxed">
            {t("register_subheadline")}
          </p>
        </div>

        {/* Trust stats */}
        <div className="grid grid-cols-3 gap-4">
          {TRUST_STATS.map((stat) => (
            <div
              key={stat.labelKey}
              className="space-y-1.5 rounded-2xl border border-[#8db5ff]/12 bg-[#122036]/60 p-4 backdrop-blur-sm"
            >
              <p className="text-2xl text-[#f7f9ff]">
                <AnimatedCounter target={stat.value} />
              </p>
              <p className="text-xs font-medium text-[#8ea3c7] leading-snug">
                {t(stat.labelKey)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works steps */}
      <div className="relative z-10 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8ea3c7]">
          {t("register_howItWorks")}
        </p>
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.labelKey} className="flex items-center gap-4">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#8db5ff]/16 bg-[#192b47]">
                  <Icon size={18} className="text-[#8db5ff]" />
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#2d5bff] text-[10px] font-black text-white">
                    {i + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#f7f9ff]">{t(step.labelKey)}</p>
                  <p className="text-xs text-[#8ea3c7] truncate">{t(step.descKey)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Testimonial snippet */}
      <div className="relative z-10 rounded-2xl border border-[#8db5ff]/12 bg-[#122036]/70 p-5 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2d5bff]/40 to-[#3fcf8e]/20 text-sm font-black text-[#f7f9ff]">
            S
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#d6e2ff] leading-snug">
              &ldquo;{t("register_testimonial")}&rdquo;
            </p>
            <p className="mt-1 text-xs text-[#8ea3c7]">— {t("register_testimonialAuthor")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSection() {
  const router = useRouter();
  const { registerSeller } = useAuth();
  const { t } = useLanguage();
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ shopName?: string; phone?: string }>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validate = useCallback(() => {
    const errs: { shopName?: string; phone?: string } = {};
    if (!shopName.trim()) {
      errs.shopName = t("register_errShopName");
    } else if (shopName.trim().length < 2) {
      errs.shopName = t("register_errShopNameLen");
    }
    if (!phone.trim()) {
      errs.phone = t("register_errPhone");
    } else if (!/^0\d{9}$/.test(phone.trim())) {
      errs.phone = t("register_errPhoneFormat");
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [shopName, phone, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError("");

    try {
      await registerSeller({ shopName: shopName.trim(), phone: phone.trim() });
      router.push("/seller/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("register_required");
      // Already registered as seller (409) → redirect to dashboard
      if (msg.includes("Already registered") || (err as { status?: number }).status === 409) {
        await router.push("/seller/dashboard");
        return;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full w-full items-center justify-center px-6 py-12 lg:w-1/2 xl:w-[45%] lg:px-16">
      <div className={`w-full max-w-[440px] space-y-8 ${mounted ? "animate-[fadeUp_0.5s_cubic-bezier(0.22,1,0.36,1)_both]" : "opacity-0"}`}>
        {/* Mobile brand */}
        <div className="lg:hidden space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#8db5ff]/20 bg-gradient-to-br from-[#2d5bff] to-[#1537b8] text-white font-black text-sm shadow-md shadow-[#2d5bff]/20">
              KZ
            </div>
            <p className="text-base font-black tracking-tight text-[#f7f9ff]">Keyzaa Seller</p>
          </div>
          <h1 className="type-h2 text-[#f7f9ff]">{t("register_title")}</h1>
          <p className="text-sm text-[#8ea3c7] leading-relaxed">{t("register_subtitle")}</p>
        </div>

        {/* Form card */}
        <div className="glass-panel surface-card p-8 space-y-6">
          {/* Form header */}
          <div className="space-y-1.5">
            <h2 className="type-h2 text-[#f7f9ff] hidden lg:block">{t("register_formTitle")}</h2>
            <p className="text-sm text-[#8ea3c7] hidden lg:block">{t("register_formSubtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Shop name field */}
            <div className="space-y-2">
              <label
                htmlFor="shopName"
                className="flex items-center gap-2 text-sm font-semibold text-[#d6e2ff]"
              >
                <Store size={15} className="text-[#8db5ff]" />
                {t("register_shopName")}
              </label>
              <div className="relative">
                <input
                  id="shopName"
                  type="text"
                  value={shopName}
                  onChange={(e) => {
                    setShopName(e.target.value);
                    if (fieldErrors.shopName) validate();
                  }}
                  placeholder={t("register_shopNamePlaceholder")}
                  className={`w-full rounded-xl bg-[#0d1728]/70 border px-4 py-3.5 pl-11 text-sm text-[#f7f9ff] placeholder:text-[#8ea3c7]/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2d5bff]/30 ${
                    fieldErrors.shopName
                      ? "border-[#ff6b6b]/50 focus:border-[#ff6b6b]/60"
                      : "border-[rgba(169,193,231,0.16)] focus:border-[#2d5bff]/60 focus:bg-[#0d1728]/90"
                  }`}
                  autoComplete="off"
                />
                <Store
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8ea3c7]/40"
                />
              </div>
              {fieldErrors.shopName && (
                <p className="flex items-center gap-1.5 text-xs text-[#ff6b6b]">
                  <span className="h-1 w-1 rounded-full bg-[#ff6b6b]" />
                  {fieldErrors.shopName}
                </p>
              )}
            </div>

            {/* Phone field */}
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="flex items-center gap-2 text-sm font-semibold text-[#d6e2ff]"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#8db5ff]"
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                {t("register_phone")}
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) validate();
                  }}
                  placeholder="0812345678"
                  className={`w-full rounded-xl bg-[#0d1728]/70 border px-4 py-3.5 pl-11 text-sm text-[#f7f9ff] placeholder:text-[#8ea3c7]/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2d5bff]/30 ${
                    fieldErrors.phone
                      ? "border-[#ff6b6b]/50 focus:border-[#ff6b6b]/60"
                      : "border-[rgba(169,193,231,0.16)] focus:border-[#2d5bff]/60 focus:bg-[#0d1728]/90"
                  }`}
                  inputMode="tel"
                  autoComplete="tel"
                />
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8ea3c7]/40"
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              {fieldErrors.phone && (
                <p className="flex items-center gap-1.5 text-xs text-[#ff6b6b]">
                  <span className="h-1 w-1 rounded-full bg-[#ff6b6b]" />
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* API error */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-[#ff6b6b]/20 bg-[#ff6b6b]/8 px-4 py-3 text-sm text-[#ff6b6b]">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-4 text-sm font-bold text-white shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t("register_loading")}</span>
                </>
              ) : (
                <>
                  <span>{t("register_submit")}</span>
                  <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 rounded-xl border border-[rgba(169,193,231,0.1)] bg-[#0d1728]/40 p-4">
            <div className="flex items-center gap-2 text-xs text-[#8ea3c7]">
              <ShieldCheck size={13} className="text-[#3fcf8e]" />
              <span>{t("register_trustSecure")}</span>
            </div>
            <div className="h-3 w-px bg-[rgba(169,193,231,0.15)]" />
            <div className="flex items-center gap-2 text-xs text-[#8ea3c7]">
              <Zap size={13} className="text-[#3fcf8e]" />
              <span>{t("register_trustFast")}</span>
            </div>
            <div className="h-3 w-px bg-[rgba(169,193,231,0.15)]" />
            <div className="flex items-center gap-2 text-xs text-[#8ea3c7]">
              <CreditCard size={13} className="text-[#3fcf8e]" />
              <span>{t("register_trustFree")}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#8ea3c7]">
          {t("register_alreadyHaveAccount")}{" "}
          <Link
            href="/seller/dashboard"
            className="font-semibold text-[#2d5bff] hover:text-[#3f6fff] transition-colors"
          >
            {t("register_loginCta")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SellerRegisterPage() {
  return (
    <div className="flex min-h-screen">
      <LeftPanel />
      <FormSection />
    </div>
  );
}
