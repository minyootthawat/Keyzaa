"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Bot, CreditCard, Gamepad2, Gift, Sparkles, Store } from "lucide-react";
import CTAButton from "@/app/components/CTAButton";
import ProductCard from "@/app/components/ProductCard";
import CategoryCard from "@/app/components/home/category-card";
import HeroSection from "@/app/components/home/hero-section";
import ProductSection from "@/app/components/home/product-section";
import TrustSection, { defaultTrustIcons } from "@/app/components/home/trust-section";
import { useLanguage } from "@/app/context/LanguageContext";
import type { Product, SellerVerificationStatus } from "@/app/types";

const categoryGradients: Record<string, string> = {
  เติมเกม: "from-brand-primary/25 via-brand-primary/5 to-transparent",
  "Gift Card": "from-warning/20 via-warning/5 to-transparent",
  Subscription: "from-brand-tertiary/20 via-brand-primary/5 to-transparent",
  "AI Tools": "from-accent/20 via-accent/5 to-transparent",
  โปร: "from-danger/20 via-danger/5 to-transparent",
};

const CATEGORY_MAP: Record<string, string> = {
  "Mobile Top-up": "เติมเกม",
  "Genshin Impact": "เติมเกม",
  "Honkai Star Rail": "เติมเกม",
  "Mobile Legends": "เติมเกม",
  "Gift Card": "Gift Card",
  Subscription: "Subscription",
  โปร: "โปร",
  "AI Tools": "AI Tools",
};

const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  เติมเกม: "เติมเกม",
  "Gift Card": "บัตรของขวัญ",
  Subscription: "สมัครสมาชิก",
  "AI Tools": "เครื่องมือ AI",
  โปร: "โปร",
};

const categoryIcons: Record<string, LucideIcon> = {
  เติมเกม: Gamepad2,
  "Gift Card": Gift,
  Subscription: Sparkles,
  "AI Tools": Bot,
  โปร: CreditCard,
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

interface HomeResponse {
  categories: Record<string, number>;
  products: HomeProduct[];
  totalProducts: number;
  totalSellers: number;
}

function mapHomeProductToProduct(product: HomeProduct): Product {
  const normalizedCategory = CATEGORY_MAP[product.category] ?? product.category;
  const mappedCategory = CATEGORY_DISPLAY_MAP[normalizedCategory] ?? normalizedCategory;
  const sellerVerificationStatus: SellerVerificationStatus = product.seller.verified
    ? "verified"
    : "new";

  return {
    id: product.id,
    title: product.title,
    nameTh: product.title,
    nameEn: product.title,
    image: product.image,
    price: product.price,
    originalPrice: product.originalPrice,
    discount: product.discount,
    category: mappedCategory,
    platform: mappedCategory,
    sellerId: product.seller.id,
    sellerName: product.seller.storeName,
    sellerVerificationStatus,
    stock: product.stock,
    soldCount: Math.max(product.sellerCount * 18, 24),
    isActive: product.isActive,
    sellerCount: product.sellerCount,
    regionCode: "TH",
    regionLabelTh: "รองรับประเทศไทย",
    regionLabelEn: "Works in Thailand",
    deliverySlaMinutes: 5,
    deliveryLabelTh: "รับโค้ดทันทีภายใน 5 นาที",
    deliveryLabelEn: "Get your code within 5 minutes",
    activationMethodTh: "รับโค้ดแล้วนำไปใช้งานทันที",
    activationMethodEn: "Receive your code and redeem instantly",
    trustLabelTh: product.seller.verified ? "ร้านค้ายืนยันตัวตนแล้ว" : "ร้านค้ากำลังเติบโต",
    trustLabelEn: product.seller.verified ? "Verified seller" : "Growing seller",
  };
}

export default function HomeClient() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalSellers, setTotalSellers] = useState(0);

  async function fetchHome(signal?: AbortSignal) {
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await fetch("/api/home", { signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as HomeResponse;
      setProducts((data.products || []).map(mapHomeProductToProduct));
      setCategoryCounts(data.categories || {});
      setTotalProducts(data.totalProducts || 0);
      setTotalSellers(data.totalSellers || 0);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setHasError(true);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetchHome(controller.signal);
    return () => controller.abort();
  }, []);

  const bestDeals = products.slice(0, 4);
  const hotProducts = products.slice(4, 8).length > 0 ? products.slice(4, 8) : [];
  const featuredProducts = products.slice(0, 3);

  const displayCategories = [
    {
      key: "เติมเกม",
      label: t("home_categoryTopup"),
      description: "สินค้าเกมยอดนิยม ราคาชัด ส่งไว เหมาะกับการซื้อใช้ทันที",
    },
    {
      key: "Gift Card",
      label: t("home_categoryGiftCard"),
      description: "รวมบัตรเติมเงินและโค้ดดิจิทัลจากร้านค้าที่ตรวจสอบแล้ว",
    },
    {
      key: "Subscription",
      label: t("home_categorySubscription"),
      description: "แพ็กเกจรายเดือนสำหรับบริการที่ใช้งานบ่อยในราคาคุ้มกว่า",
    },
    {
      key: "AI Tools",
      label: t("home_categoryAITools"),
      description: "เครื่องมือดิจิทัลและบัญชีใช้งานพร้อมส่งสำหรับสายทำงาน",
    },
    {
      key: "โปร",
      label: t("home_categoryPromo"),
      description: "ดีลลดราคาและสินค้าขายเร็วที่กำลังถูกจับตาในตลาด",
    },
  ];

  const categories = displayCategories.map((category) => ({
    ...category,
    accent:
      categoryGradients[category.key] ??
      "from-brand-primary/25 via-brand-primary/5 to-transparent",
    Icon: categoryIcons[category.key] ?? Gamepad2,
    count: Object.entries(categoryCounts)
      .filter(([apiCategory]) => CATEGORY_MAP[apiCategory] === category.key)
      .reduce((sum, [, count]) => sum + count, 0),
  }));

  return (
    <div className="relative overflow-hidden pb-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-8%] top-0 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(45,91,255,0.18),transparent_68%)]" />
        <div className="absolute right-[-12%] top-[14rem] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(141,181,255,0.12),transparent_72%)]" />
        <div className="absolute left-[30%] top-[40rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(63,207,142,0.06),transparent_72%)]" />
      </div>

      <HeroSection
        title={t("home_marketplaceTitle")}
        description={t("home_marketplaceDesc")}
        badge={t("home_marketplaceBadge")}
        proof={t("home_proofCompact")}
        totalProducts={Math.max(totalProducts, products.length)}
        totalSellers={Math.max(totalSellers, 12)}
        primaryCta={t("home_heroPrimaryCta")}
        secondaryCta={t("home_heroSecondaryCta")}
        trustTitle={t("home_heroTrustTitle")}
        trustPoints={[
          t("home_trustPillarEscrowDesc"),
          t("home_trustPillarVerifiedDesc"),
          t("home_trustPillarDisputeDesc"),
        ]}
        searchPlaceholder={t("home_heroSearchPlaceholder")}
        browseLabel={t("home_heroBrowseLabel")}
        statusLabel={t("home_heroStatusLabel")}
        inventoryLabel={t("home_heroInventoryLabel")}
        sellerCountLabel={t("home_heroSellerCountLabel")}
      />

      <section className="section-container py-12 lg:py-16" aria-labelledby="categories-heading">
        <div className="mb-8 flex items-end justify-between gap-4 lg:mb-10">
          <div className="space-y-3">
            <h2 id="categories-heading" className="type-h2 text-text-main">
              {t("home_popularCategories")}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-text-muted">
              {t("home_categoriesCaption")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {categories.map((category) => (
            <CategoryCard
              key={category.key}
              href={`/products?category=${encodeURIComponent(category.key)}`}
              title={category.label}
              description={category.description}
              count={category.count}
              accent={category.accent}
              Icon={category.Icon}
            />
          ))}
        </div>
      </section>

      {/* Featured Deals interstitial — after categories, before trust */}
      {featuredProducts.length > 0 && (
        <section className="section-container py-10 lg:py-14" aria-labelledby="featured-deals-heading">
          <div className="mb-7 flex items-end justify-between gap-4 lg:mb-9">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-accent" aria-hidden="true">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>
              </span>
              <h2 id="featured-deals-heading" className="type-h2 text-text-main">{t("home_heroSpotlightLabel")}</h2>
            </div>
            <Link href="/products" className="hidden text-sm font-semibold text-brand-tertiary transition-colors hover:text-text-main sm:inline-flex">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>
      )}

      <TrustSection
        eyebrow={t("home_trustEyebrow")}
        title={t("home_trustSectionTitle")}
        description={t("home_trustSectionDesc")}
        pillars={[
          {
            eyebrow: t("home_trustPillarEscrowEyebrow"),
            title: t("home_trustPillarEscrowTitle"),
            description: t("home_trustPillarEscrowDesc"),
            Icon: defaultTrustIcons.escrow,
            iconClass: "text-brand-tertiary",
          },
          {
            eyebrow: t("home_trustPillarVerifiedEyebrow"),
            title: t("home_trustPillarVerifiedTitle"),
            description: t("home_trustPillarVerifiedDesc"),
            Icon: defaultTrustIcons.verified,
            iconClass: "text-accent",
          },
          {
            eyebrow: t("home_trustPillarDisputeEyebrow"),
            title: t("home_trustPillarDisputeTitle"),
            description: t("home_trustPillarDisputeDesc"),
            Icon: defaultTrustIcons.dispute,
            iconClass: "text-warning",
          },
        ]}
        flowEyebrow={t("home_trustFlowEyebrow")}
        flowTitle={t("home_trustFlowTitle")}
        flowDescription={t("home_trustFlowDesc")}
        journeySteps={[t("home_trustStep1"), t("home_trustStep2"), t("home_trustStep3")]}
        flowFooter={t("home_trustFlowFooter")}
      />

      <ProductSection
        id="best-deals-heading"
        title={t("home_bestDeals")}
        description={t("home_dealsProof")}
        products={bestDeals}
        isLoading={isLoading}
        hasError={hasError}
        onRetry={() => void fetchHome()}
      />

      {hotProducts.length > 0 && (
        <ProductSection
          id="hot-deals-heading"
          title={t("home_recommended")}
          description={t("home_recommendedDesc")}
          products={hotProducts}
          isLoading={isLoading}
          variant="hot"
        />
      )}

      <section className="section-container py-16 lg:py-24">
        <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(25,43,71,0.96)_0%,rgba(18,32,54,0.98)_55%,rgba(9,19,34,1)_100%)] p-6 shadow-[0_24px_70px_rgba(3,9,22,0.4)] transition-all duration-500 hover:border-brand-primary/30 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(45,91,255,0.15),transparent_50%)] opacity-70 pointer-events-none transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative z-10 flex-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1.5 text-xs font-bold text-brand-tertiary">
              <Store className="h-3.5 w-3.5" />
              {t("home_sellerBadge")}
            </div>
            <h2 className="type-h1 text-text-main text-3xl tracking-tight md:text-5xl">
              {t("home_sellerTitle")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-subtle sm:text-base">
              {t("home_sellerDesc")}
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: Store, text: t("home_sellerPointReach"), color: "text-brand-tertiary" },
                { icon: CreditCard, text: t("home_sellerPointTrust"), color: "text-accent" },
                { icon: Sparkles, text: t("home_sellerPointMobile"), color: "text-warning" },
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-4 text-base font-medium text-text-subtle">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-surface shadow-sm">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative z-10 mt-8 w-full shrink-0 lg:mt-0 lg:w-auto">
            <CTAButton href="/seller/register" className="h-14 w-full px-8 text-base font-bold shadow-xl shadow-brand-primary/20 lg:h-16 lg:w-auto lg:px-10 lg:text-lg">
              {t("home_sellerCta")}
            </CTAButton>
          </div>
        </div>
      </section>

      {/* Social proof: testimonials replacing hardcoded stats */}
      <section className="section-container py-12 lg:py-16" aria-labelledby="testimonials-heading">
        <div className="mb-8 text-center lg:mb-10">
          <h2 id="testimonials-heading" className="type-h2 text-text-main">{t("home_testimonialsTitle")}</h2>
          <p className="mt-3 text-sm text-text-muted">{t("home_testimonialsDesc")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              quote: t("home_testimonial1Quote"),
              author: t("home_testimonial1Author"),
              role: t("home_testimonial1Role"),
            },
            {
              quote: t("home_testimonial2Quote"),
              author: t("home_testimonial2Author"),
              role: t("home_testimonial2Role"),
            },
            {
              quote: t("home_testimonial3Quote"),
              author: t("home_testimonial3Author"),
              role: t("home_testimonial3Role"),
            },
          ].map((t_, index) => (
            <figure
              key={index}
              className="rounded-[1.75rem] border border-border-subtle bg-bg-surface p-6 text-left"
            >
              <div className="mb-4 flex items-center gap-1" aria-label="5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="h-4 w-4 fill-warning text-warning" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-sm leading-6 text-text-subtle">&ldquo;{t_.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-brand-tertiary text-sm font-bold">
                  {t_.author.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-main">{t_.author}</p>
                  <p className="text-xs text-text-muted">{t_.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="section-container py-12 text-center lg:py-20" aria-labelledby="trust-cta-heading">

        <div className="rounded-[2rem] border border-border-main/50 bg-bg-subtle px-6 py-12 text-center shadow-[0_24px_70px_rgba(3,9,22,0.32)] sm:px-8 sm:py-16 lg:py-20">
          <div className="relative mx-auto max-w-3xl">
            <h2 id="trust-cta-heading" className="type-h1 text-text-main">
              {t("home_finalCtaTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-text-subtle">
              {t("home_finalCtaDesc")}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <CTAButton href="/products" className="h-14 px-8 text-base">
                {t("home_finalCtaPrimary")}
              </CTAButton>
              <CTAButton href="/seller/register" variant="secondary" className="h-14 px-8 text-base">
                {t("home_finalCtaSecondary")}
              </CTAButton>
            </div>
            <div className="mt-6 flex flex-col items-center gap-3 text-sm text-text-muted sm:flex-row sm:justify-center">
              {[t("home_finalTrustChipEscrow"), t("home_finalTrustChipVerified"), t("home_finalTrustChipMobile")].map((chip) => (
                <div key={chip} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                  {chip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
