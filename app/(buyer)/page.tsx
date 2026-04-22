"use client";

import Link from "next/link";
import Badge from "@/app/components/Badge";
import CTAButton from "@/app/components/CTAButton";
import PriceTag from "@/app/components/PriceTag";
import products from "@/data/products.json";
import { useLanguage } from "@/app/context/LanguageContext";

const categoryIcons: Record<string, string> = {
  "เติมเกม": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="m12 12 4.5 3.5"/><path d="m7.5 9.5 3-3"/><circle cx="17" cy="10" r="1"/><circle cx="7" cy="10" r="1"/></svg>`,
  "Gift Card": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8v12"/><path d="M7 12h2"/><path d="M15 12h2"/></svg>`,
  Subscription: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m9 12 2 2 4-4"/></svg>`,
  "AI Tools": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14h.01"/><path d="M8 14h.01"/><path d="M11 17h2"/><path d="M3 12h18"/><path d="M4 22h16"/><path d="M12 18v4"/></svg>`,
  "โปร": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.8 5.68 6.27.92-4.54 4.42 1.07 6.23L12 17.31 6.4 20.25l1.07-6.23L2.93 9.6l6.27-.92L12 3z"/></svg>`,
};

export default function Home() {
  const { t, lang } = useLanguage();
  const bestDeals = products.slice(0, 4);
  const hotDeals = products.slice(4, 8);
  const spotlightProducts = products.slice(0, 3);

  const categories = [
    { key: "เติมเกม", icon: categoryIcons["เติมเกม"] },
    { key: "Gift Card", icon: categoryIcons["Gift Card"] },
    { key: "Subscription", icon: categoryIcons.Subscription },
    { key: "AI Tools", icon: categoryIcons["AI Tools"] },
    { key: "โปร", icon: categoryIcons["โปร"] },
  ];

  const trustItems = [
    t("home_trustVerified"),
    t("home_trustProtected"),
    t("home_trustPayments"),
    t("home_trustSla"),
  ];

  const trustStats = [
    { value: "12,000+", label: t("home_trustStatOrders") },
    { value: "230+", label: t("home_trustStatVendors") },
    { value: "09:00-24:00", label: t("home_trustStatSupport") },
  ];

  return (
    <div className="relative overflow-hidden pb-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-8%] top-0 h-[44rem] w-[44rem] rounded-full bg-[radial-gradient(circle,rgba(45,91,255,0.18),transparent_68%)]" />
        <div className="absolute right-[-12%] top-[18rem] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(141,181,255,0.14),transparent_72%)]" />
      </div>

      <section className="section-container pt-8 sm:pt-12 lg:pt-16">
        <div className="trust-panel">
          <div className="relative grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-14">
            <div className="space-y-7">
              <div className="flex flex-wrap items-center gap-3">
                <div className="trust-badge motion-fade-up">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_6px_rgba(63,207,142,0.12)]" />
                  <span className="text-sm font-semibold">{t("home_heroBadge")}</span>
                </div>
                <div className="rounded-full border border-brand-tertiary/18 bg-white/4 px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase text-text-muted">
                  {t("common_verifiedSellers")}
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="type-display max-w-[12ch] text-text-main">{t("home_heroTitle")}</h1>
                <p className="max-w-[60ch] text-base leading-7 text-text-subtle sm:text-lg">{t("home_heroDesc")}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/products?category=เติมเกม" className="sm:flex-1">
                  <CTAButton fullWidth className="h-14 text-base">
                    {t("home_ctaTopup")}
                  </CTAButton>
                </Link>
                <Link href="/products?category=Gift%20Card" className="sm:flex-1">
                  <CTAButton fullWidth variant="secondary" className="h-14 text-base">
                    {t("home_ctaBuyGift")}
                  </CTAButton>
                </Link>
              </div>

              <div className="rounded-[1.5rem] border border-border-subtle bg-bg-base/34 p-4 sm:p-5">
                <p className="text-sm leading-6 text-text-subtle">{t("home_proofCompact")}</p>
                <div className="mt-4 trust-grid">
                  {trustStats.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                      <p className="type-num text-2xl font-extrabold text-text-main">{item.value}</p>
                      <p className="mt-1 text-sm leading-6 text-text-muted">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-[1.75rem] border border-border-subtle bg-[linear-gradient(180deg,rgba(17,31,51,0.96)_0%,rgba(8,18,32,0.98)_100%)] p-5 shadow-[0_18px_38px_rgba(4,11,23,0.24)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="type-meta text-brand-tertiary">{t("home_trustStandardBadge")}</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-main">{t("home_trustCardTitle")}</h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/18 bg-accent/10 text-accent">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 4.5-2.9 7.8-7 9-4.1-1.2-7-4.5-7-9V7l7-4z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9.5 12 1.7 1.7L15 10" />
                    </svg>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-text-subtle">{t("home_trustCardDesc")}</p>
                <div className="mt-5 space-y-3">
                  {[t("home_trustCardItem1"), t("home_trustCardItem2"), t("home_trustCardItem3")].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-tertiary" />
                      <p className="text-sm leading-6 text-text-subtle">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border-subtle bg-bg-base/30 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="type-meta text-text-muted">{t("home_trustHeadline")}</p>
                    <p className="mt-2 text-sm leading-6 text-text-subtle">{t("home_trustDesc")}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {spotlightProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 transition-all duration-200 hover:border-border-main hover:bg-white/[0.05]"
                    >
                      <div className="min-w-0">
                        <p className="type-meta text-text-muted">{product.category}</p>
                        <p className="mt-1 truncate text-sm font-semibold text-text-main">{product.title}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="type-num text-sm font-bold text-text-main">฿{product.price.toLocaleString()}</p>
                        <p className="mt-1 text-xs font-semibold text-accent">{t("common_instantDelivery")}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container pt-8 lg:pt-10">
        <div className="rounded-[1.75rem] border border-border-subtle bg-bg-surface/50 px-4 py-4 backdrop-blur-sm sm:px-5">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {trustItems.concat(trustItems).map((item, index) => (
              <div key={`${item}-${index}`} className="shrink-0 rounded-full border border-white/6 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-text-subtle">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-container py-16 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="type-h2 text-text-main">{t("home_popularCategories")}</h2>
            <p className="max-w-2xl text-sm leading-6 text-text-muted">{t("home_categoriesCaption")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category, index) => (
            <Link
              key={category.key}
              href={`/products?category=${encodeURIComponent(category.key)}`}
              className="surface-card group relative overflow-hidden p-5"
              style={{ animation: `fade-up 520ms ${index * 60}ms cubic-bezier(0.22,1,0.36,1) both` }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(141,181,255,0.12),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex flex-col gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-tertiary/15 bg-brand-primary/10 text-brand-tertiary"
                  dangerouslySetInnerHTML={{ __html: category.icon }}
                />
                <div>
                  <p className="text-sm font-semibold text-text-main">{category.key}</p>
                  <p className="mt-1 text-xs text-text-muted">{t("common_instantDelivery")}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-container py-8 lg:py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="type-h2 text-text-main">{t("home_bestDeals")}</h2>
            <p className="text-sm leading-6 text-text-muted">{t("home_dealsProof")}</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-brand-tertiary transition-colors hover:text-text-main">
            {t("common_viewAll")} →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bestDeals.map((product, index) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="surface-card group flex h-full flex-col overflow-hidden"
              style={{ animation: `fade-up 520ms ${index * 70}ms cubic-bezier(0.22,1,0.36,1) both` }}
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
                <div>
                  <p className="type-meta text-text-muted">{product.category}</p>
                  <p className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-text-main">{product.title}</p>
                </div>
                <Badge label={`-${product.discount}%`} tone="promo" />
              </div>
              <div className="flex flex-1 flex-col justify-between gap-5 p-5">
                <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.025] px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{t("common_verifiedSellers")}</p>
                    <p className="mt-1 text-sm font-semibold text-text-subtle">{product.sellerCount} {t("common_sellers")}</p>
                  </div>
                  <div className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                    {t("common_instantDelivery")}
                  </div>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <PriceTag price={product.price} originalPrice={product.originalPrice} />
                  <div className="text-right">
                    <p className="type-num text-lg font-bold text-text-main">4.9</p>
                    <p className="text-xs text-text-muted">{t("common_reviewsLabel")}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-container py-16 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="type-h2 text-text-main">{t("home_recommended")}</h2>
            <p className="max-w-2xl text-sm leading-6 text-text-muted">{t("home_recommendedDesc")}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hotDeals.map((product, index) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group rounded-[1.75rem] border border-border-subtle bg-[linear-gradient(180deg,rgba(19,33,54,0.92)_0%,rgba(10,19,33,0.96)_100%)] p-5 shadow-[0_12px_28px_rgba(4,11,23,0.18)] transition-all duration-200 hover:-translate-y-1 hover:border-border-main"
              style={{ animation: `fade-up 520ms ${index * 70}ms cubic-bezier(0.22,1,0.36,1) both` }}
            >
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="type-meta text-text-muted">{product.category}</p>
                  <span className="rounded-full border border-brand-tertiary/16 bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-tertiary">
                    {t("common_verifiedSellers")}
                  </span>
                </div>
                <p className="line-clamp-2 text-base font-semibold leading-snug text-text-main">{product.title}</p>
                <div className="mt-auto flex items-end justify-between gap-3">
                  <PriceTag price={product.price} originalPrice={product.originalPrice} />
                  <div className="text-right">
                    <p className="text-xs text-text-muted">{t("common_instantDelivery")}</p>
                    <p className="mt-1 text-sm font-semibold text-accent">{lang === "th" ? "สต็อกพร้อม" : "Stock ready"}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-container pb-6 pt-2 lg:pb-10">
        <div className="trust-panel px-6 py-8 text-center sm:px-8 sm:py-10">
          <div className="relative mx-auto max-w-3xl">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-brand-tertiary/18 bg-brand-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-tertiary">
              Keyzaa
              <span className="h-1.5 w-1.5 rounded-full bg-brand-tertiary" />
              {t("home_trustFirstMarketplace")}
            </div>
            <h2 className="type-h1 text-text-main">{t("home_ctaTrustTitle")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-text-subtle">{t("home_ctaTrustDesc")}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/products">
                <CTAButton className="h-14 px-8 text-base">{t("home_ctaTrustPrimary")}</CTAButton>
              </Link>
              <Link href="/orders">
                <CTAButton variant="secondary" className="h-14 px-8 text-base">
                  {t("home_ctaTrustSecondary")}
                </CTAButton>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
