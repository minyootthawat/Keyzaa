"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import sellersData from "@/data/sellers.json";
import { useCart } from "@/app/context/CartContext";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  buildSellerSummary,
  getActivationMethod,
  getActivationSteps,
  getDeliveryLabel,
  getProductDescription,
  getProductTitle,
  getRegionLabel,
  getSellerTrustLabel,
  getSellerTrustTone,
  getTrustLabel,
} from "@/app/lib/marketplace";
import { getMockPaymentNotice } from "@/app/lib/payment-mock";
import type { Product, Seller, SellerOption } from "@/app/types";
import CTAButton from "@/app/components/CTAButton";
import Badge from "@/app/components/Badge";
import PriceTag from "@/app/components/PriceTag";

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

interface ProductDetail extends Product {
  sellers: SellerOption[];
  reviews: Review[];
}

const MOCK_FETCH_DELAY = 300;
const SKELETON_ARRAY = Array.from({ length: 1 });

function SkeletonLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const { lang, t } = useLanguage();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<SellerOption | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");

  useEffect(function fetchProductData() {
    const timer = setTimeout(() => {
      import("@/data/products.json").then((mod) => {
        const products = mod.default as Product[];
        const baseProduct = products.find((item) => item.id === params.id);

        if (!baseProduct) {
          router.push("/products");
          return;
        }

        const sellers = (sellersData as Seller[])
          .filter((seller) => seller.id === baseProduct.sellerId || seller.verificationStatus !== "new")
          .slice(0, 3)
          .map((seller, index) => ({
            id: seller.id,
            name: seller.shopName,
            price: Math.max(baseProduct.price - (index === 0 ? 0 : 0), baseProduct.price),
            rating: seller.rating,
            salesCount: seller.salesCount,
            deliverySpeed: baseProduct.deliveryLabelTh || t("common_instantDelivery"),
            isOfficial: seller.id === baseProduct.sellerId,
            verificationStatus: seller.verificationStatus,
            fulfillmentRate: seller.fulfillmentRate,
          }));

        const reviews: Review[] = [
          {
            id: "r1",
            user: "Nok",
            rating: 5,
            comment: t("pdp_reviewMockCheckout"),
            date: "2026-04-14",
          },
          {
            id: "r2",
            user: "Mint",
            rating: 5,
            comment: t("pdp_reviewThailandCompat"),
            date: "2026-04-09",
          },
        ];

        const detail: ProductDetail = {
          ...baseProduct,
          sellers,
          reviews,
        };

        setProduct(detail);
        setSelectedSeller(sellers[0] || null);
        setLoading(false);
      });
    }, MOCK_FETCH_DELAY);

    return function cleanupFetch() {
      clearTimeout(timer);
    };
  }, [lang, params.id, router, t]);

  const sellerSummary = useMemo(() => {
    if (!selectedSeller) return null;
    const seller = (sellersData as Seller[]).find((item) => item.id === selectedSeller.id);
    return seller ? buildSellerSummary(seller) : null;
  }, [selectedSeller]);

  const buildCartItem = useCallback(
    (seller: SellerOption) => ({
      id: product!.id,
      title: product!.title,
      titleTh: product!.nameTh,
      titleEn: product!.nameEn,
      price: seller.price,
      image: product!.image,
      quantity: 1,
      sellerId: seller.id,
      sellerName: seller.name,
      platform: product!.platform,
      regionCode: product!.regionCode,
      deliveryLabelTh: product!.deliveryLabelTh,
      deliveryLabelEn: product!.deliveryLabelEn,
      activationMethodTh: product!.activationMethodTh,
      activationMethodEn: product!.activationMethodEn,
    }),
    [product],
  );

  const handleAddToCart = useCallback(() => {
    if (!product || !selectedSeller) return;
    addItem(buildCartItem(selectedSeller));
  }, [product, selectedSeller, addItem, buildCartItem]);

  const handleAddToCartAndCheckout = useCallback(() => {
    if (!product || !selectedSeller) return;
    addItem(buildCartItem(selectedSeller));
    router.push("/checkout");
  }, [product, selectedSeller, addItem, buildCartItem, router]);

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!product || !selectedSeller) {
    return null;
  }

  const infoCards = [
    { label: t("pdp_activation"), value: getActivationMethod(product, lang) },
    { label: t("pdp_region"), value: getRegionLabel(product, lang) },
    { label: t("pdp_delivery"), value: getDeliveryLabel(product, lang) },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-12">
      <div className="section-container grid gap-8 py-8 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:py-12">
        {/* Left column */}
        <div className="space-y-6">
          {/* Image */}
          <div className="surface-card overflow-hidden">
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={product.image}
                alt={getProductTitle(product, lang)}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <Badge label={getRegionLabel(product, lang)} />
                <Badge label={getDeliveryLabel(product, lang)} tone="success" />
              </div>
            </div>
          </div>

          {/* Product info card */}
          <div className="surface-card space-y-5 p-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge label={product.category} />
                <Badge label={product.platform} />
                <Badge label={getTrustLabel(product, lang)} tone="success" />
              </div>
              <h1 className="type-h1 text-text-main">{getProductTitle(product, lang)}</h1>
              <p className="text-base leading-7 text-text-subtle">{getProductDescription(product, lang)}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {infoCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{card.label}</p>
                  <p className="mt-2 text-sm font-semibold text-text-main">{card.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs: Description / Reviews */}
          <div className="surface-card p-6">
            <div className="flex gap-2">
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === "description" ? "bg-brand-primary text-white" : "bg-bg-surface text-text-subtle"}`}
                onClick={() => setActiveTab("description")}
              >
                {t("pdp_details")}
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === "reviews" ? "bg-brand-primary text-white" : "bg-bg-surface text-text-subtle"}`}
                onClick={() => setActiveTab("reviews")}
              >
                {t("pdp_reviews")}
              </button>
            </div>

            {activeTab === "description" ? (
              <div className="mt-5 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-text-main">{t("pdp_howItWorks")}</h2>
                  <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-7 text-text-subtle">
                    {getActivationSteps(product, lang).map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div className="rounded-2xl border border-accent/15 bg-accent/5 p-4 text-sm leading-7 text-text-subtle">
                  {t("pdp_mockInfo")}
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {product.reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-text-main">{review.user}</p>
                      <p className="text-sm text-warning">★ {review.rating.toFixed(1)}</p>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-text-subtle">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: sticky aside */}
        <aside className="lg:sticky lg:top-[96px] lg:self-start">
          <div className="surface-card space-y-5 p-6">
            {/* Price */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-text-muted">{t("pdp_finalPrice")}</p>
                <PriceTag price={selectedSeller.price} originalPrice={product.originalPrice} large />
              </div>
              <Badge label={`-${product.discount}%`} tone="promo" />
            </div>

            {/* Seller selector */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-text-main">{t("pdp_chooseSeller")}</p>
              {product.sellers.map((seller) => (
                <button
                  key={seller.id}
                  onClick={() => setSelectedSeller(seller)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${selectedSeller.id === seller.id ? "border-brand-primary bg-brand-primary/10" : "border-white/8 bg-bg-surface/70 hover:border-white/15"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text-main">{seller.name}</p>
                      <p className="mt-1 text-sm text-text-muted">
                        ★ {seller.rating} • {seller.salesCount.toLocaleString()} {t("pdp_orderCountSuffix")}
                      </p>
                    </div>
                    <Badge
                      label={getSellerTrustLabel(seller.verificationStatus, lang)}
                      tone={getSellerTrustTone(seller.verificationStatus)}
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* Seller stats */}
            {sellerSummary ? (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("pdp_fulfillment")}</p>
                  <p className="mt-2 text-lg font-semibold text-text-main">{sellerSummary.fulfillmentRate}%</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("pdp_response")}</p>
                  <p className="mt-2 text-lg font-semibold text-text-main">
                    {sellerSummary.responseTimeMinutes} {t("pdp_minutes")}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("pdp_disputeRate")}</p>
                  <p className="mt-2 text-lg font-semibold text-text-main">{sellerSummary.disputeRate}%</p>
                </div>
              </div>
            ) : null}

            {/* CTA buttons */}
            <div className="space-y-3">
              <CTAButton fullWidth onClick={handleAddToCartAndCheckout}>
                {t("pdp_startMockCheckout")}
              </CTAButton>
              <CTAButton fullWidth variant="secondary" onClick={handleAddToCart}>
                {t("pdp_addToCart")}
              </CTAButton>
            </div>

            {/* Notice */}
            <div className="rounded-2xl border border-accent/12 bg-accent/5 p-4 text-sm leading-7 text-text-subtle">
              <p className="font-semibold text-text-main">{t("pdp_afterDemo")}</p>
              <p className="mt-1">{getMockPaymentNotice(lang)}</p>
            </div>

            <Link href="/products" className="text-sm font-semibold text-brand-tertiary">
              {t("pdp_backToProducts")}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
