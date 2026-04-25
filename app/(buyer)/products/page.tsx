"use client";

import { useEffect, useMemo, useState, useCallback, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/app/components/SearchBar";
import FilterBar from "@/app/components/FilterBar";
import SortingDropdown from "@/app/components/SortingDropdown";
import ProductCard from "@/app/components/ProductCard";
import SkeletonCard from "@/app/components/SkeletonCard";
import SectionContainer from "@/app/components/SectionContainer";
import CTAButton from "@/app/components/CTAButton";
import { useLanguage } from "@/app/context/LanguageContext";
import { matchesProductQuery } from "@/app/lib/marketplace";
import type { Product } from "@/app/types";

const PAGE_SIZE = 10;
const SKELETON_COUNT = 10;

const SKELETON_ARRAY = Array.from({ length: SKELETON_COUNT });

type SortOption = "cheap" | "expensive" | "popular" | "discount";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();
  const [isPending, startTransition] = useTransition();

  // Initialize from URL params (set by header search)
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [platform, setPlatform] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sort, setSort] = useState<SortOption>("cheap");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Fetch products
  useEffect(function fetchProducts() {
    let cancelled = false;
    setLoading(true);

    fetch("/api/products")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setAllProducts((data.products ?? []) as Product[]);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setAllProducts([]);
        setLoading(false);
      });

    return function cancelFetch() {
      cancelled = true;
    };
  }, []);

  // Reset pagination when filters change
  useEffect(
    function resetPagination() {
      setVisibleCount(PAGE_SIZE);
    },
    [category, platform, priceRange, sort, search]
  );

  // Sync state setters to avoid stale closures
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setCategory(value);
  }, []);

  const handlePlatformChange = useCallback((value: string) => {
    setPlatform(value);
  }, []);

  const handlePriceRangeChange = useCallback((value: string) => {
    setPriceRange(value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSort(value as SortOption);
  }, []);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  const handleClearFilters = useCallback(() => {
    startTransition(() => {
      setSearch("");
      setCategory("all");
      setPlatform("all");
      setPriceRange("all");
      setSort("cheap");
      setVisibleCount(PAGE_SIZE);
    });
  }, []);

  // Suggestions for SearchBar
  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    return allProducts
      .map((product) => (lang === "th" ? product.nameTh : product.nameEn))
      .filter((title) => title.toLowerCase().includes(search.toLowerCase()));
  }, [allProducts, lang, search]);

  // Derive filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...allProducts];

    if (search) {
      list = list.filter((product) => matchesProductQuery(product, search));
    }

    if (category !== "all") {
      list = list.filter((product) => product.category === category);
    }

    if (platform !== "all") {
      list = list.filter((product) => product.platform === platform);
    }

    if (priceRange !== "all") {
      if (priceRange === "<100") {
        list = list.filter((product) => product.price < 100);
      } else if (priceRange === ">500") {
        list = list.filter((product) => product.price > 500);
      } else {
        const [minStr, maxStr] = priceRange.split("-");
        const min = parseInt(minStr, 10);
        const max = parseInt(maxStr, 10);
        list = list.filter((product) => product.price >= min && product.price <= max);
      }
    }

    return list.sort((a, b) => {
      if (sort === "cheap") return a.price - b.price;
      if (sort === "expensive") return b.price - a.price;
      if (sort === "popular") return b.soldCount - a.soldCount;
      return b.discount - a.discount;
    });
  }, [allProducts, category, platform, priceRange, search, sort]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const isFiltered = search || category !== "all" || platform !== "all" || priceRange !== "all";

  return (
    <SectionContainer>
      <div className="space-y-8 py-10 md:py-14">
        {/* Search */}
        <div className="space-y-5">
          <SearchBar suggestions={suggestions} onSelect={handleSearchChange} />
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <FilterBar
              category={category}
              setCategory={handleCategoryChange}
              platform={platform}
              setPlatform={handlePlatformChange}
              priceRange={priceRange}
              setPriceRange={handlePriceRangeChange}
            />
            <SortingDropdown sort={sort} setSort={handleSortChange} />
          </div>
        </div>

        {/* Result count */}
        {!loading ? (
          <p className="type-num text-sm font-semibold text-text-subtle motion-fade-in" style={{ animationDelay: "300ms" }}>
            <span className="text-brand-primary">{filtered.length}</span> {t("products_items")}
          </p>
        ) : null}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-4">
            {SKELETON_ARRAY.map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface-card motion-fade-up flex flex-col items-center justify-center space-y-5 py-24">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-brand-primary/10 blur-3xl" />
              <svg className="relative h-16 w-16 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-main">{t("products_notFound")}</p>
              <p className="mt-1 text-sm text-text-muted">{t("products_notFoundHint")}</p>
            </div>
            <CTAButton onClick={handleClearFilters}>{t("common_clearFilters")}</CTAButton>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-4">
              {visibleProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
            {hasMore ? (
              <div className="flex justify-center pt-6">
                <CTAButton variant="secondary" onClick={handleLoadMore} className="px-8">
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
