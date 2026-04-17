"use client";

import { useEffect, useState, useMemo } from "react";
import SearchBar from "@/app/components/SearchBar";
import FilterBar from "@/app/components/FilterBar";
import SortingDropdown from "@/app/components/SortingDropdown";
import ProductCard, { type Product } from "@/app/components/ProductCard";
import SkeletonCard from "@/app/components/SkeletonCard";
import SectionContainer from "@/app/components/SectionContainer";
import CTAButton from "@/app/components/CTAButton";
import { useLanguage } from "@/app/context/LanguageContext";

// Extended product type for the listing page
interface ListingProduct extends Product {
  sellerCount: number;
  platform: string;
}

const MOCK_FETCH_DELAY = 600;
const PAGE_SIZE = 10;

export default function ProductsPage() {
  const { t } = useLanguage();
  const [allProducts, setAllProducts] = useState<ListingProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter / sort / search state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sort, setSort] = useState("cheap");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Load mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      import("@/data/products.json").then((mod) => {
        setAllProducts(mod.default as ListingProduct[]);
        setLoading(false);
      });
    }, MOCK_FETCH_DELAY);
    return () => clearTimeout(timer);
  }, []);

  // Suggestions for search autocomplete
  const suggestions = useMemo(() => {
    if (!search) return [];
    const lower = search.toLowerCase();
    return allProducts
      .map((p) => p.title)
      .filter((t) => t.toLowerCase().includes(lower));
  }, [allProducts, search]);

  // Filtered + sorted products
  const filtered = useMemo(() => {
    let list = [...allProducts];

    // Search
    if (search) {
      const lower = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(lower));
    }

    // Category
    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }

    // Platform
    if (platform !== "all") {
      list = list.filter((p) => p.platform === platform);
    }

    // Price range
    if (priceRange !== "all") {
      if (priceRange === "<100") {
        list = list.filter((p) => p.price < 100);
      } else if (priceRange === ">500") {
        list = list.filter((p) => p.price > 500);
      } else {
        const [minStr, maxStr] = priceRange.split("-");
        const min = parseInt(minStr);
        const max = parseInt(maxStr);
        list = list.filter((p) => p.price >= min && p.price <= max);
      }
    }

    // Sorting
    if (sort === "cheap") {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === "best") {
      list.sort((a, b) => b.sellerCount - a.sellerCount);
    } else if (sort === "discount") {
      list.sort((a, b) => b.discount - a.discount);
    }

    return list;
  }, [allProducts, search, category, platform, priceRange, sort]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, category, platform, priceRange, sort]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <SectionContainer className="min-h-screen py-10 md:py-14">
      <div className="space-y-9 md:space-y-12">
        <div className="space-y-5 max-w-3xl md:space-y-6">
          <h1 className="type-display text-gradient-brand motion-fade-up" style={{ animationDelay: "0ms" }}>
            {t("products_title")}
          </h1>
          <p className="type-body max-w-[58ch] text-text-subtle motion-fade-up" style={{ animationDelay: "80ms" }}>
            {t("products_desc")}
          </p>
        </div>

        <div className="motion-fade-up max-w-2xl" style={{ animationDelay: "240ms" }}>
          <SearchBar suggestions={suggestions} onSelect={setSearch} />
        </div>

        <div className="glass-panel sticky top-[100px] z-30 overflow-visible rounded-2xl px-4 py-4 sm:px-5 md:rounded-3xl md:px-6 md:py-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <FilterBar
              category={category}
              setCategory={setCategory}
              platform={platform}
              setPlatform={setPlatform}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
            />
            <SortingDropdown sort={sort} setSort={setSort} />
          </div>
        </div>

        {!loading ? (
          <p className="type-num text-sm font-semibold text-text-subtle motion-fade-in" style={{ animationDelay: "300ms" }}>
            <span className="text-brand-primary">{filtered.length}</span> {t("products_items")}
          </p>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface-card motion-fade-up flex flex-col items-center justify-center space-y-5 py-24">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-brand-primary/10 rounded-full" />
              <svg className="relative h-16 w-16 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-main">{t("products_notFound")}</p>
              <p className="mt-1 text-sm text-text-muted">Try adjusting your filters</p>
            </div>
            <CTAButton
              onClick={() => {
                setSearch("");
                setCategory("all");
                setPlatform("all");
                setPriceRange("all");
              }}
            >
              {t("common_clearFilters")}
            </CTAButton>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-4 xl:grid-cols-5">
              {visibleProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
            {hasMore ? (
              <div className="flex justify-center pt-6">
                <CTAButton variant="secondary" onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)} className="px-8">
                  {t("common_loadMore")}
                </CTAButton>
              </div>
            ) : null}
          </>
        )}
      </div>
    </SectionContainer>
  );
}
