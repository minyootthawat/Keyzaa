"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  LucideIcon,
  Zap,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import Badge from "@/app/components/Badge";
import CTAButton from "@/app/components/CTAButton";
import PriceTag from "@/app/components/PriceTag";
import { useLanguage } from "@/app/context/LanguageContext";

const categoryGradients: Record<string, string> = {
  เติมเกม: "from-game-start to-game-end",
  "Gift Card": "from-gift-start to-gift-end",
  Subscription: "from-sub-start to-sub-end",
  "AI Tools": "from-ai-start to-game-end",
  โปร: "from-pro-start to-pro-end",
};

// Maps API category names to display categories
const CATEGORY_MAP: Record<string, string> = {
  // เติมเกม variants
  "Mobile Top-up": "เติมเกม",
  "Mobile Game Top-up": "เติมเกม",
  "Genshin Impact": "เติมเกม",
  "Honkai Star Rail": "เติมเกม",
  "Mobile Legends": "เติมเกม",
  "topup": "เติมเกม",
  "เติมเกม": "เติมเกม",
  // Gift Card variants
  "Gift Card": "Gift Card",
  "giftcard": "Gift Card",
  "Gift Card ": "Gift Card",
  // Subscription
  Subscription: "Subscription",
  // AI Tools
  "AI Tools": "AI Tools",
  // โปร
  โปร: "โปร",
};

const categoryIcons: Record<string, LucideIcon> = {
  เติมเกม: Zap,
  "Gift Card": CreditCard,
  Subscription: Zap,
  "AI Tools": Zap,
  โปร: Zap,
};

interface HomeProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  isActive: boolean;
  discount: number;
  originalPrice: number;
  sellerCount: number;
  seller: {
    id: string;
    storeName: string;
    verified: boolean;
  };
}

export default function HomeClient() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  function fetchHome() {
    setIsLoading(true);
    setHasError(false);
    fetch("/api/home")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setProducts(data.products || []);
        setCategoryCounts(data.categories || {});
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    const doFetch = async () => {
      fetchHome();
    };
    doFetch();
  }, []);

  const bestDeals = products.slice(0, 4);
  const hotDeals = products.slice(4, 8);

  // Build categories from dynamic API counts — all labels in Thai
  const displayCategories = [
    { key: "เติมเกม", labelTh: t("home_categoryTopup") },
    { key: "Gift Card", labelTh: t("home_categoryGiftCard") },
    { key: "Subscription", labelTh: t("home_categorySubscription") },
    { key: "AI Tools", labelTh: t("home_categoryAITools") },
    { key: "โปร", labelTh: t("home_categoryPromo") },
  ];

  const categories = displayCategories.map((cat) => ({
    ...cat,
    gradient: categoryGradients[cat.key] ?? "from-game-start to-game-end",
    Icon: categoryIcons[cat.key] ?? Zap,
    count: Object.entries(categoryCounts)
      .filter(([apiCat]) => CATEGORY_MAP[apiCat] === cat.key)
      .reduce((sum, [, n]) => sum + n, 0),
  }));

  return (
    <div className="relative overflow-hidden pb-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-8%] top-0 h-[44rem] w-[44rem] rounded-full bg-[radial-gradient(circle,rgba(45,91,255,0.18),transparent_68%)]" />
        <div className="absolute right-[-12%] top-[18rem] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(141,181,255,0.14),transparent_72%)]" />
      </div>

      {/* Hero Banner */}
      <section className="section-container pt-6 lg:pt-8 pb-12 lg:pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-tertiary p-8 md:p-14 lg:p-20">
          {/* Hero background image */}
          <Image
            src="/hero-banner.png"
            alt=""
            aria-hidden="true"
            fill
            className="object-cover opacity-30 mix-blend-soft-light"
            priority
            sizes="100vw"
          />
          <div className="relative z-10 max-w-xl">
            <h1 className="type-h1 text-white lg:text-5xl lg:leading-[1.1]">{t("home_heroH1")}</h1>
            <p className="mt-4 text-lg text-white/85 max-w-[42ch]">
              {t("home_heroSubtitle")}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <CTAButton href="/products" className="bg-white text-brand-primary hover:bg-white/90 h-12 px-8">
                {t("home_ctaViewAll")}
              </CTAButton>
              <CTAButton
                href="/seller/register"
                variant="secondary"
                className="border-white/30 text-white hover:bg-white/10 h-12 px-6"
              >
                {t("home_ctaRegisterSeller")}
              </CTAButton>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-4 h-24 w-24 rounded-full bg-white/5" />
        </div>
      </section>

      {/* Categories */}
      <section className="section-container py-12 lg:py-16" aria-labelledby="categories-heading">
        <div className="mb-8 lg:mb-10 flex items-end justify-between gap-4">
          <div className="space-y-3">
            <h2 id="categories-heading" className="type-h2 text-text-main">
              {t("home_popularCategories")}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-text-muted">
              {t("home_categoriesCaption")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category, index) => (
            <Link
              key={category.key}
              href={`/products?category=${encodeURIComponent(category.key)}`}
              className="surface-card group relative overflow-hidden p-5 transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
              style={{
                animation: `fade-up 520ms ${index * 60}ms cubic-bezier(0.22,1,0.36,1) both`,
              }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-20 transition-opacity duration-300 group-hover:opacity-30`}
              />
              <div className="relative flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <category.Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-main">
                    {category.labelTh}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {category.count} {t("products_items")}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Deals */}
      <section className="section-container py-12 lg:py-16" aria-labelledby="best-deals-heading">
        <div className="mb-8 lg:mb-10 flex items-end justify-between gap-4">
          <div className="space-y-3">
            <h2 id="best-deals-heading" className="type-h2 text-text-main">{t("home_bestDeals")}</h2>
            <p className="text-sm leading-6 text-text-muted">
              {t("home_dealsProof")}
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-brand-primary transition-colors hover:text-brand-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45 rounded-md px-1"
          >
            {t("common_viewAll")} →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="surface-card flex h-full flex-col overflow-hidden"
              >
                <div className="aspect-[4/3] w-full animate-pulse bg-bg-subtle/40" />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="space-y-2">
                    <div className="h-3 w-16 animate-pulse rounded bg-bg-subtle/40" />
                    <div className="h-4 w-full animate-pulse rounded bg-bg-subtle/40" />
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-3">
                    <div className="h-8 w-24 animate-pulse rounded bg-bg-subtle/40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-bg-subtle/20 py-16 text-center">
            <p className="text-text-muted">ไม่สามารถโหลดสินค้าได้</p>
            <button
              onClick={fetchHome}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45 rounded-lg p-1"
            >
              <RefreshCw className="w-4 h-4" />
              ลองอีกครั้ง
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {bestDeals.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="surface-card group flex h-full flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
                style={{
                  animation: `fade-up 520ms ${index * 70}ms cubic-bezier(0.22,1,0.36,1) both`,
                }}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-subtle/60">
                  {product.discount > 20 && (
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
                      <p className="type-meta text-text-muted">
                        {product.category}
                      </p>
                      <p className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-text-main">
                        {product.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-3">
                    <div className="flex items-center justify-between rounded-2xl border border-border-subtle bg-bg-surface px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                          {t("common_verifiedSellers")}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-text-subtle">
                          {product.sellerCount} {t("common_sellers")}
                        </p>
                      </div>
                      <div className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
                        {t("common_instantDelivery")}
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <PriceTag
                        price={product.price}
                        originalPrice={product.originalPrice}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Hot Deals */}
      <section className="section-container py-12 lg:py-16" aria-labelledby="hot-deals-heading">
        <div className="mb-8 lg:mb-10 flex items-end justify-between gap-4">
          <div className="space-y-3">
            <h2 id="hot-deals-heading" className="type-h2 text-text-main">{t("home_recommended")}</h2>
            <p className="max-w-2xl text-sm leading-6 text-text-muted">
              {t("home_recommendedDesc")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="surface-card flex h-full flex-col overflow-hidden"
              >
                <div className="aspect-[4/3] w-full animate-pulse bg-bg-subtle/40" />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="h-3 w-16 animate-pulse rounded bg-bg-subtle/40" />
                  <div className="h-4 w-full animate-pulse rounded bg-bg-subtle/40" />
                  <div className="mt-auto h-6 w-20 animate-pulse rounded bg-bg-subtle/40" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {hotDeals.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="surface-card group flex h-full flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
                style={{
                  animation: `fade-up 520ms ${index * 70}ms cubic-bezier(0.22,1,0.36,1) both`,
                }}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-subtle/60">
                  {product.discount > 20 && (
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
                    <span className="rounded-full border border-brand-tertiary/16 bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary dark:text-brand-tertiary">
                      {t("common_verifiedSellers")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-center justify-between">
                    <p className="type-meta text-text-muted">
                      {product.category}
                    </p>
                  </div>
                  <p className="line-clamp-2 text-base font-semibold leading-snug text-text-main">
                    {product.title}
                  </p>
                  <div className="mt-auto flex items-end justify-between gap-3">
                    <PriceTag
                      price={product.price}
                      originalPrice={product.originalPrice}
                    />
                    <div className="text-right">
                      <p className="text-xs text-text-muted">
                        {t("common_instantDelivery")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-accent">
                        {t("home_stockReady")}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="section-container py-12 lg:py-20" aria-labelledby="trust-cta-heading">
        <div className="trust-panel px-6 py-12 text-center sm:px-8 sm:py-16 lg:py-20">
          <div className="relative mx-auto max-w-3xl">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
              Keyzaa
              <span className="h-1.5 w-1.5 rounded-full bg-brand-tertiary" />
              {t("home_trustFirstMarketplace")}
            </div>
            <h2 id="trust-cta-heading" className="type-h1 text-text-main">
              {t("home_ctaTrustTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-text-subtle">
              {t("home_ctaTrustDesc")}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <CTAButton href="/products" className="h-14 px-8 text-base">
                {t("home_ctaTrustPrimary")}
              </CTAButton>
              <CTAButton href="/orders" variant="secondary" className="h-14 px-8 text-base">
                {t("home_ctaTrustSecondary")}
              </CTAButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}