import Link from "next/link";
import ProductCard from "@/app/components/ProductCard";
import type { Product } from "@/app/types";

interface ProductSectionProps {
  id: string;
  title: string;
  description: string;
  products: Product[];
  isLoading: boolean;
  hasError?: boolean;
  onRetry?: () => void;
}

const skeletonArray = Array.from({ length: 4 });

export default function ProductSection({
  id,
  title,
  description,
  products,
  isLoading,
  hasError = false,
  onRetry,
}: ProductSectionProps) {
  return (
    <section className="section-container py-12 lg:py-16" aria-labelledby={id}>
      <div className="mb-7 flex items-end justify-between gap-4 lg:mb-9">
        <div className="max-w-2xl space-y-3">
          <h2 id={id} className="type-h2 text-text-main">
            {title}
          </h2>
          <p className="text-sm leading-6 text-text-muted">{description}</p>
        </div>
        <Link
          href="/products"
          className="hidden text-sm font-semibold text-brand-tertiary transition-colors hover:text-text-main sm:inline-flex"
        >
          ดูทั้งหมด →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {skeletonArray.map((_, index) => (
            <div key={index} className="surface-card overflow-hidden rounded-[1.6rem]">
              <div className="aspect-[4/3] animate-pulse bg-bg-subtle/60" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-16 animate-pulse rounded bg-bg-subtle/60" />
                <div className="h-5 w-full animate-pulse rounded bg-bg-subtle/60" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-bg-subtle/60" />
                <div className="h-10 animate-pulse rounded-2xl bg-bg-subtle/60" />
              </div>
            </div>
          ))}
        </div>
      ) : hasError ? (
        <div className="surface-card flex flex-col items-center justify-center rounded-[1.75rem] px-6 py-14 text-center">
          <p className="text-base font-medium text-text-subtle">ไม่สามารถโหลดรายการสินค้าได้ในขณะนี้</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center justify-center rounded-2xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-tertiary transition-colors hover:bg-brand-primary/15"
            >
              ลองอีกครั้ง
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
