"use client";

import type React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Flame, ShieldCheck, Star, Store, Timer, Zap } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { getDeliveryLabel, getProductTitle, getTrustLabel } from "@/app/lib/marketplace";
import type { Product } from "@/app/types";
import CTAButton from "./CTAButton";
import PriceTag from "./PriceTag";

interface ProductCardProps {
  product: Product;
  index?: number;
}

interface BadgeItem {
  label: string;
  tone: "danger" | "accent" | "brand";
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { lang, t } = useLanguage();

  const rating = 4.9;
  const reviewCount = Math.max(12, Math.round((product.soldCount || 0) / 5));
  const sellerName = product.sellerName || "ร้านแนะนำ";
  const sellerVerificationStatus = product.sellerVerificationStatus;

  const isHot = (product.discount || 0) >= 15 || (product.soldCount || 0) >= 100;
  const isInstant =
    (product.deliverySlaMinutes ?? 999) <= 15 ||
    Boolean(product.deliveryLabelTh?.includes("ทันที")) ||
    Boolean(product.deliveryLabelEn?.toLowerCase().includes("instant"));
  const isVerified =
    sellerVerificationStatus === "verified" || sellerVerificationStatus === "top_rated";

  const stockLeft = Math.max(product.stock || 0, 1);
  const title = getProductTitle(product, lang) || product.title;
  const deliveryLabel = getDeliveryLabel(product, lang);
  const trustLabel = getTrustLabel(product, lang);
  const badgeItems = [
    isHot ? { label: t("home_badgeHot"), tone: "danger" } : null,
    isInstant ? { label: t("home_badgeInstant"), tone: "accent" } : null,
    isVerified ? { label: t("home_badgeVerified"), tone: "brand" } : null,
  ].filter(Boolean) as BadgeItem[];

  const animationDelay = Math.min(index * 50, 500);

  const handleQuickBuy = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    addItem({
      id: product.id,
      title: product.title,
      titleTh: product.nameTh,
      titleEn: product.nameEn,
      price: product.price,
      image: product.image,
      quantity: 1,
      sellerId: product.sellerId,
      sellerName,
      platform: product.platform,
      regionCode: product.regionCode,
      deliveryLabelTh: product.deliveryLabelTh,
      deliveryLabelEn: product.deliveryLabelEn,
      activationMethodTh: product.activationMethodTh,
      activationMethodEn: product.activationMethodEn,
    });
  };

  const handleOpenProduct = () => {
    router.push(`/products/${product.id}`);
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenProduct();
    }
  };

  return (
    <article
      id={`product-${product.id}`}
      role="link"
      tabIndex={0}
      aria-label={title}
      onClick={handleOpenProduct}
      onKeyDown={handleCardKeyDown}
      className="group surface-card relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.7rem] border border-border-subtle transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-border-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45 motion-fade-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-subtle">
        <Image
          src={product.image}
          alt={title}
          fill
          priority={index < 4}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/20 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-bg-base/75 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {badgeItems.slice(0, 3).map((badge) => (
            <span
              key={badge.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] uppercase shadow-sm ${
                badge.tone === "danger"
                  ? "bg-danger text-bg-base"
                  : badge.tone === "accent"
                    ? "bg-accent text-bg-base"
                    : "bg-brand-primary text-white"
              }`}
            >
              {badge.tone === "danger" ? <Flame className="h-3 w-3" /> : null}
              {badge.tone === "accent" ? <Zap className="h-3 w-3" /> : null}
              {badge.tone === "brand" ? <ShieldCheck className="h-3 w-3" /> : null}
              {badge.label}
            </span>
          ))}
        </div>

        <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-bg-base/70 px-2.5 py-1 text-[11px] font-semibold text-text-subtle backdrop-blur">
          {product.category}
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
              {t("home_marketItemLabel")}
            </p>
            <h3 className="mt-2 line-clamp-2 min-h-[3.2rem] text-[15px] font-bold leading-6 text-text-main transition-colors duration-300 group-hover:text-brand-tertiary">
              {title}
            </h3>
          </div>
          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-text-main" />
        </div>

        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-end justify-between gap-3">
            <PriceTag price={product.price} originalPrice={product.originalPrice} />
            {product.discount > 0 ? (
              <div className="rounded-2xl border border-danger/20 bg-danger/10 px-2.5 py-1.5 text-right">
                <p className="text-[10px] uppercase tracking-[0.16em] text-danger">{t("home_priceDiscount")}</p>
                <p className="mt-1 text-sm font-bold text-white">-{product.discount}%</p>
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
            <Timer className="h-3.5 w-3.5 text-accent" />
            <span>{deliveryLabel}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <p className="text-text-muted">{t("home_salesLabel")}</p>
            <p className="mt-1 font-semibold text-text-main">
              {(product.soldCount || 0).toLocaleString()} {t("home_salesCountSuffix")}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <p className="text-text-muted">{t("home_stockLabel")}</p>
            <p className="mt-1 font-semibold text-text-main">
              {stockLeft.toLocaleString()} {t("common_itemSuffix")}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-bg-elevated">
                <Store className="h-4 w-4 text-text-subtle" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-main">{sellerName}</p>
                <p className="truncate text-xs text-text-muted">{trustLabel}</p>
              </div>
            </div>
            {isVerified ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("home_badgeVerified")}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <span className="font-semibold text-text-main">{rating}</span>
              <span>({reviewCount})</span>
            </div>
            <span>{product.sellerCount ?? 1} {t("home_sellerOffers")}</span>
          </div>
        </div>

        <div className="mt-5">
          <CTAButton
            onClick={handleQuickBuy}
            className="h-11 w-full rounded-[1.05rem] text-sm font-bold transition-[transform,box-shadow] hover:-translate-y-0.5"
          >
            {t("home_buyInstantly")}
          </CTAButton>
        </div>
      </div>
    </article>
  );
}
