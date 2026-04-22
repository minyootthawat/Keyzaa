"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useLanguage } from "@/app/context/LanguageContext";
import sellersData from "@/data/sellers.json";
import type { Product, Seller } from "@/app/types";
import { getActivationMethod, getDeliveryLabel, getProductTitle, getRegionLabel, getSellerTrustLabel, getSellerTrustTone } from "@/app/lib/marketplace";
import Badge from "./Badge";
import PriceTag from "./PriceTag";
import CTAButton from "./CTAButton";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const { t, lang } = useLanguage();

  const rating = 4.8;
  const reviewCount = Math.max(120, Math.round(product.soldCount / 10));
  const defaultSeller = ((sellersData as Seller[]).find((seller) => seller.id === product.sellerId) || (sellersData as Seller[])[0]);
  const sellerTrustLabel = getSellerTrustLabel(defaultSeller.verificationStatus, lang);

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: product.id,
      title: product.title,
      titleTh: product.nameTh,
      titleEn: product.nameEn,
      price: product.price,
      image: product.image,
      quantity: 1,
      sellerId: product.sellerId || defaultSeller.id,
      sellerName: defaultSeller.shopName,
      platform: product.platform,
      regionCode: product.regionCode,
      deliveryLabelTh: product.deliveryLabelTh,
      deliveryLabelEn: product.deliveryLabelEn,
      activationMethodTh: product.activationMethodTh,
      activationMethodEn: product.activationMethodEn,
    });
  };

  const animationDelay = Math.min(index * 60, 400);

  return (
    <Link
      href={`/products/${product.id}`}
      id={`product-${product.id}`}
      className="group/cinema group/card relative flex h-full flex-col overflow-hidden rounded-3xl border border-border-subtle bg-[linear-gradient(180deg,rgba(19,33,54,0.94)_0%,rgba(10,19,33,0.98)_100%)] shadow-[0_14px_30px_rgba(4,11,23,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-border-main hover:shadow-[0_18px_38px_rgba(4,11,23,0.24)]"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover/cinema:opacity-100" />

      <div className="relative aspect-[4/5] w-full overflow-hidden bg-bg-subtle/60 sm:aspect-[4/5]">
        <Image
          src={product.image}
          alt={getProductTitle(product, lang)}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.06]"
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-bg-base/95 via-bg-base/30 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {product.badge ? <Badge label={product.badge} tone="promo" /> : null}
          <Badge label={getDeliveryLabel(product, lang)} tone="default" />
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
          <Badge label={getRegionLabel(product, lang)} tone="default" />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <span className="type-meta truncate text-text-muted">{product.category}</span>
          <Badge label={sellerTrustLabel} tone={getSellerTrustTone(defaultSeller.verificationStatus)} />
        </div>

        <div className="flex-1 space-y-2">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-text-main transition-colors duration-300 group-hover/cinema:text-brand-tertiary">
            {getProductTitle(product, lang)}
          </h3>
          <p className="line-clamp-2 text-sm leading-6 text-text-muted">
            {lang === "th" ? product.shortDescriptionTh : product.shortDescriptionEn}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
            <p className="type-num">
              {reviewCount.toLocaleString()} {t("common_reviewsLabel")}
            </p>
            <span className="type-num text-text-subtle">★ {rating}</span>
            <span>{getActivationMethod(product, lang)}</span>
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex items-end justify-between gap-3">
            <PriceTag price={product.price} originalPrice={product.originalPrice} />
            {product.sellerCount && product.sellerCount > 0 ? (
              <span className="type-num rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                {product.sellerCount} {t("common_sellers")}
              </span>
            ) : (
              <span className="type-num rounded-full bg-bg-subtle/80 px-2.5 py-1 text-xs text-text-muted">
                {t("common_instantDelivery")}
              </span>
            )}
          </div>

          <div className="relative">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-brand-primary/0 via-brand-primary/50 to-brand-secondary/50 opacity-0 blur-sm transition-opacity duration-300 group-hover/cinema:opacity-100" />
            <CTAButton onClick={handleQuickBuy} className="relative h-11 w-full overflow-hidden">
              <span className="relative z-10">{t("common_buyNow")}</span>
              <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-500 group-hover/cinema:translate-x-[100%]" />
            </CTAButton>
          </div>
        </div>
      </div>
    </Link>
  );
}
