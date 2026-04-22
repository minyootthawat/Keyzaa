"use client";

import { useEffect, useMemo, useState } from "react";
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

const MOCK_FETCH_DELAY = 600;
const PAGE_SIZE = 10;

export default function ProductsPage() {
  const { t, lang } = useLanguage();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sort, setSort] = useState("cheap");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const timer = setTimeout(() => {
      import("@/data/products.json").then((mod) => {
        setAllProducts(mod.default as Product[]);
        setLoading(false);
      });
    }, MOCK_FETCH_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const suggestions = useMemo(() => {
    if (!search) return [];

    return allProducts
      .map((product) => (lang === "th" ? product.nameTh : product.nameEn))
      .filter((title) => title.toLowerCase().includes(search.toLowerCase()));
  }, [allProducts, lang, search]);

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

  return (
    <SectionContainer>
      <div className="section-container space-y-8 py-10 md:py-14">
        <div className="space-y-5">
          <SearchBar suggestions={suggestions} onSelect={setSearch} />
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
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface-card motion-fade-up flex flex-col items-center justify-center space-y-5 py-24">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-brand-primary/10 blur-3xl" />
              <svg className="relative h-16 w-16 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-main">{t("products_notFound")}</p>
              <p className="mt-1 text-sm text-text-muted">
                {lang === "th" ? "ลองค้นหาด้วยชื่อไทย อังกฤษ หรือชื่อแบรนด์" : "Try searching by Thai, English, or brand name"}
              </p>
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
