"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Bot, CreditCard, Gamepad2, Gift, Sparkles, Store } from "lucide-react";
import CTAButton from "@/app/components/CTAButton";
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
  const hotDeals = products.slice(4, 8).length > 0 ? products.slice(4, 8) : products.slice(0, 4);
  const spotlightProducts = products.slice(0, 3);

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
        spotlightProducts={spotlightProducts.map((product) => ({
          id: product.id,
          title: product.nameTh,
          category: product.category,
          price: product.price,
          image: product.image,
          discount: product.discount,
          sellerName: product.sellerName || "ร้านแนะนำ",
        }))}
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
        spotlightLabel={t("home_heroSpotlightLabel")}
        featuredLabel={t("home_heroFeaturedLabel")}
        featuredStatus={t("home_heroFeaturedStatus")}
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

      <ProductSection
        id="hot-deals-heading"
        title={t("home_recommended")}
        description={t("home_recommendedDesc")}
        products={hotDeals}
        isLoading={isLoading}
      />

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

      <section className="section-container py-12 text-center lg:py-20" aria-labelledby="trust-cta-heading">
        <div className="mb-12 grid gap-4 md:grid-cols-3 lg:gap-6">
          {[
            { num: "50,000+", label: t("home_marketStatUsers"), color: "text-brand-tertiary" },
            { num: "120,000+", label: t("home_marketStatOrders"), color: "text-accent" },
            { num: "4.9/5", label: t("home_marketStatRating"), color: "text-warning" },
          ].map((stat, index) => (
            <div key={index} className="rounded-[1.65rem] border border-white/10 bg-white/[0.025] p-7 text-center shadow-[0_18px_50px_rgba(3,9,22,0.2)]">
              <div className={`mb-3 text-4xl font-black md:text-5xl ${stat.color}`}>{stat.num}</div>
              <div className="text-sm font-bold uppercase tracking-[0.15em] text-text-muted">{stat.label}</div>
            </div>
          ))}
        </div>

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
