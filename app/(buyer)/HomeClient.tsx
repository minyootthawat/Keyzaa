"use client";

import Image from "next/image";
import Link from "next/link";
import { LucideIcon, ShieldCheck, Zap, Headphones, Store, Clock, CreditCard, ThumbsUp } from "lucide-react";
import Badge from "@/app/components/Badge";
import CTAButton from "@/app/components/CTAButton";
import PriceTag from "@/app/components/PriceTag";
import products from "@/data/products.json";
import { useLanguage } from "@/app/context/LanguageContext";

const categoryGradients: Record<string, string> = {
  "เติมเกม": "from-game-start to-game-end",
  "Gift Card": "from-gift-start to-gift-end",
  "Subscription": "from-sub-start to-sub-end",
  "AI Tools": "from-ai-start to-ai-end",
  "โปร": "from-pro-start to-pro-end",
};

const categoryProductCounts: Record<string, number> = {
  "เติมเกม": 8,
  "Gift Card": 5,
  "Subscription": 4,
  "AI Tools": 3,
  "โปร": 2,
};

const categoryIcons: Record<string, LucideIcon> = {
  "เติมเกม": Zap,
  "Gift Card": CreditCard,
  "Subscription": Zap,
  "AI Tools": Zap,
  "โปร": Zap,
};

const trustIcons: LucideIcon[] = [ShieldCheck, Zap, Headphones, Store];

export default function HomeClient() {
  const { t, lang } = useLanguage();
  const bestDeals = products.slice(0, 4);
  const hotDeals = products.slice(4, 8);
  const spotlightProducts = products.slice(0, 3);

  const categories = [
    { key: "เติมเกม", gradient: categoryGradients["เติมเกม"], Icon: categoryIcons["เติมเกม"] },
    { key: "Gift Card", gradient: categoryGradients["Gift Card"], Icon: categoryIcons["Gift Card"] },
    { key: "Subscription", gradient: categoryGradients["Subscription"], Icon: categoryIcons["Subscription"] },
    { key: "AI Tools", gradient: categoryGradients["AI Tools"], Icon: categoryIcons["AI Tools"] },
    { key: "โปร", gradient: categoryGradients["โปร"], Icon: categoryIcons["โปร"] },
  ];

  const trustItems = [
    { icon: Clock, text: t("home_trustVerified") },
    { icon: ShieldCheck, text: t("home_trustProtected") },
    { icon: CreditCard, text: t("home_trustPayments") },
    { icon: ThumbsUp, text: t("home_trustSla") },
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

      {/* Hero Banner */}
      <section className="section-container pt-8 lg:pt-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-tertiary p-8 md:p-12 mb-8">
          {/* Hero background image */}
          <Image
            src="/hero-banner.png"
            alt="KeyZaa Hero"
            fill
            className="object-cover opacity-30 mix-blend-soft-light"
            priority
            sizes="100vw"
          />
          <div className="relative z-10 max-w-xl">
            <h1 className="type-h1 text-white">{t("home_heroH1")}</h1>
            <p className="mt-2 text-white/80 max-w-[40ch]">
              {t("home_heroSubtitle")}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link href="/products">
                <CTAButton className="bg-white text-brand-primary hover:bg-white/90 h-12 px-8">
                  {t("home_ctaViewAll")}
                </CTAButton>
              </Link>
              <Link href="/seller/register">
                <CTAButton variant="secondary" className="border-white/30 text-white hover:bg-white/10 h-12 px-6">
                  {t("home_ctaRegisterSeller")}
                </CTAButton>
              </Link>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-4 h-24 w-24 rounded-full bg-white/5" />
        </div>
      </section>

      {/* Categories */}
      <section className="section-container py-16 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="type-h2 text-text-main">{t("home_popularCategories")}</h2>
            <p className="max-w-2xl text-sm leading-6 text-text-muted">{t("home_categoriesCaption")}</p>
          </div>
        </div>
        {/* Category showcase banner */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-bg-subtle/80 to-bg-base/60 border border-border-subtle">
          <Image
            src="/category-icons.png"
            alt={t("home_popularCategories")}
            width={1200}
            height={200}
            className="w-full h-48 object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-base/90 via-bg-base/40 to-transparent flex items-end">
            <div className="p-6">
              <p className="type-h2 text-white">{t("home_popularCategories")}</p>
              <p className="mt-1 text-white/70">{t("home_categoryList")}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category, index) => (
            <Link
              key={category.key}
              href={`/products?category=${encodeURIComponent(category.key)}`}
              className="surface-card group relative overflow-hidden p-5 transition-transform duration-300 hover:scale-[1.03]"
              style={{ animation: `fade-up 520ms ${index * 60}ms cubic-bezier(0.22,1,0.36,1) both` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-20 transition-opacity duration-300 group-hover:opacity-30`} />
              <div className="relative flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <category.Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-main">{category.key}</p>
                  <p className="mt-1 text-xs text-text-muted">{categoryProductCounts[category.key]} {t("products_items")}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Deals */}
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
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-subtle/60">
                {product.discount > 50 && (
                  <div className="absolute top-3 right-3 z-10 rounded-full bg-danger px-2 py-1 text-xs font-bold text-white">
                    HOT DEAL
                  </div>
                )}
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-base/80 via-transparent to-transparent" />
                <div className="absolute left-3 top-3">
                  <Badge label={`-${product.discount}%`} tone="promo" />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="type-meta text-text-muted">{product.category}</p>
                    <p className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-text-main">{product.title}</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.025] px-3 py-2.5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{t("common_verifiedSellers")}</p>
                      <p className="mt-1 text-sm font-semibold text-text-subtle">{product.sellerCount} {t("common_sellers")}</p>
                    </div>
                    <div className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
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
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Hot Deals */}
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
              className="surface-card group flex h-full flex-col overflow-hidden"
              style={{ animation: `fade-up 520ms ${index * 70}ms cubic-bezier(0.22,1,0.36,1) both` }}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-subtle/60">
                {product.discount > 50 && (
                  <div className="absolute top-3 right-3 z-10 rounded-full bg-danger px-2 py-1 text-xs font-bold text-white">
                    HOT DEAL
                  </div>
                )}
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-base/80 via-transparent to-transparent" />
                <div className="absolute left-3 top-3">
                  <span className="rounded-full border border-brand-tertiary/16 bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-tertiary">
                    {t("common_verifiedSellers")}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <p className="type-meta text-text-muted">{product.category}</p>
                </div>
                <p className="line-clamp-2 text-base font-semibold leading-snug text-text-main">{product.title}</p>
                <div className="mt-auto flex items-end justify-between gap-3">
                  <PriceTag price={product.price} originalPrice={product.originalPrice} />
                  <div className="text-right">
                    <p className="text-xs text-text-muted">{t("common_instantDelivery")}</p>
                      <p className="mt-1 text-sm font-semibold text-accent">{t("home_stockReady")}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
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
