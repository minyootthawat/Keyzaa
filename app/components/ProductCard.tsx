"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useLanguage } from "@/app/context/LanguageContext";
import Badge from "./Badge";
import PriceTag from "./PriceTag";
import CTAButton from "./CTAButton";
import sellersData from "@/data/sellers.json";

export interface Product {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice: number;
  discount: number;
  badge?: string;
  category: string;
  sellerCount?: number;
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
  platform?: string;
  sellerId?: string;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const { t } = useLanguage();

  const rating = product.rating || 4.8;
  const reviewCount = product.reviewCount || 1200;

  const defaultSeller = sellersData.find((s) => s.id === product.sellerId) || sellersData[0];

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
      sellerId: product.sellerId || defaultSeller.id,
      sellerName: defaultSeller.shopName,
      platform: product.platform,
    });
  };

  const animationDelay = Math.min(index * 60, 400);

  return (
    <Link
      href={`/products/${product.id}`}
      id={`product-${product.id}`}
      className="group/cinema group/card relative flex h-full flex-col overflow-hidden rounded-3xl"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="absolute inset-0 rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover/cinema:opacity-100 pointer-events-none" />
      
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-bg-subtle/60 sm:aspect-[4/5]">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.06]"
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base/95 via-bg-base/30 to-transparent" />
        
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/0 via-transparent to-brand-secondary/10 opacity-0 transition-opacity duration-500 group-hover/cinema:opacity-100" />
        
        <div className="absolute left-3.5 top-3.5 z-20 flex flex-col gap-2">
          {product.discount > 0 && (
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-brand-primary/30 rounded-full" />
              <Badge label={`-${product.discount}%`} tone="promo" />
            </div>
          )}
          {product.badge && <Badge label={product.badge} tone="default" />}
        </div>
        
        {product.platform && (
          <div className="absolute right-3.5 top-3.5 z-20">
            <span className="rounded-full bg-bg-base/60 backdrop-blur-md border border-white/10 px-2.5 py-1 text-xs font-medium text-text-subtle">
              {product.platform}
            </span>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-base/90 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <span className="type-meta truncate text-text-muted">{product.category}</span>
          <div className="flex items-center gap-1 shrink-0">
            <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="type-num text-xs font-semibold text-text-subtle">
              {rating}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-text-main transition-colors duration-300 group-hover/cinema:text-brand-primary">
            {product.title}
          </h3>
          {reviewCount > 0 && (
            <p className="type-num text-xs text-text-muted">
              {reviewCount.toLocaleString()} {t("common_reviewsLabel")}
            </p>
          )}
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex items-end justify-between">
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
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] transition-transform duration-500 group-hover/cinema:translate-x-[100%]" />
            </CTAButton>
          </div>
        </div>
      </div>
    </Link>
  );
}