"use client";

import { Suspense, useEffect, useMemo, useState, useCallback, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, ChevronDown, ShieldCheck, Zap } from "lucide-react";
import FilterSidebar, { defaultFilters } from "@/app/components/FilterSidebar";
import ProductCard from "@/app/components/ProductCard";
import SkeletonCard from "@/app/components/SkeletonCard";
import SectionContainer from "@/app/components/SectionContainer";
import CTAButton from "@/app/components/CTAButton";
import { useLanguage } from "@/app/context/LanguageContext";
import { matchesProductQuery } from "@/app/lib/marketplace";
import type { Product } from "@/app/types";

const PAGE_SIZE = 12;
const SKELETON_COUNT = 12;
const SKELETON_ARRAY = Array.from({ length: SKELETON_COUNT });

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageLoading />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageLoading() {
  return (
    <div className="bg-bg-base min-h-screen">
      {/* Trust Banner Skeleton */}
      <div className="bg-bg-elevated border-b border-border-subtle py-3 hidden md:block">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-64 bg-bg-subtle/40 rounded animate-pulse" />
        </div>
      </div>
      <SectionContainer>
        <div className="py-6 md:py-10 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-[280px] shrink-0 hidden md:block">
            <div className="h-[600px] rounded-[2rem] bg-bg-subtle/40 animate-pulse" />
          </div>
          <div className="flex-1 space-y-6">
            <div className="h-16 rounded-2xl bg-bg-subtle/40 animate-pulse" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {SKELETON_ARRAY.map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();
  const [isPending, startTransition] = useTransition();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [filters, setFilters] = useState(defaultFilters);
  const [sort, setSort] = useState("popular");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
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

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter and Sort Logic
  const filtered = useMemo(() => {
    let list = [...allProducts];

    if (search) {
      list = list.filter((product) => matchesProductQuery(product, search));
    }

    if (filters.games.length > 0) {
      // Mock category logic since real products might not have 'games' field perfectly matching
      // Assuming product.category maps to games for this demo
      list = list.filter((product) => filters.games.includes(product.category) || filters.games.some(g => product.nameTh?.includes(g) || product.nameEn?.includes(g)));
    }

    if (filters.minPrice) {
      list = list.filter(p => p.price >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      list = list.filter(p => p.price <= parseInt(filters.maxPrice));
    }

    if (filters.delivery.includes("ส่งอัตโนมัติ (Instant)")) {
      list = list.filter(p => p.sellerCount === 0 || p.soldCount > 100); // Mock instant logic
    }

    // Sort
    return list.sort((a, b) => {
      if (sort === "cheap") return a.price - b.price;
      if (sort === "expensive") return b.price - a.price;
      if (sort === "popular") return b.soldCount - a.soldCount;
      if (sort === "new") return b.id.localeCompare(a.id); // Mock new
      return 0; // Default or reviews
    });
  }, [allProducts, search, filters, sort]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + PAGE_SIZE);
  };

  return (
    <div className="bg-bg-base min-h-screen">
      {/* Trust Elements Banner */}
      <div className="bg-brand-primary/10 border-b border-brand-primary/20 py-2 hidden md:block">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center gap-6 text-sm font-semibold text-brand-primary">
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> ซื้อขายปลอดภัยด้วยระบบ Escrow</span>
          <span className="flex items-center gap-2 text-text-subtle"><Zap className="w-4 h-4 text-warning" /> รับประกันได้ของ 100%</span>
        </div>
      </div>

      <SectionContainer className="!max-w-[1400px]">
        <div className="py-6 md:py-10 flex flex-col md:flex-row gap-8 items-start">
          
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-[280px] shrink-0 sticky top-24 h-[calc(100vh-120px)]">
            <FilterSidebar filters={filters} setFilters={setFilters} />
          </aside>

          {/* Main Content */}
          <div className="flex-1 w-full min-w-0">
            
            {/* Top Bar */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-brand-primary transition-colors">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    aria-label="ค้นหาสินค้า"
                    placeholder="ค้นหาไอดีเกม หรือสินค้า..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-bg-surface border border-border-main text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-sm"
                  />
                </div>

                {/* Desktop Sort */}
                <div className="hidden md:flex relative">
                  <select
                    value={sort}
                    aria-label="เรียงลำดับสินค้า"
                    onChange={(e) => setSort(e.target.value)}
                    className="h-14 pl-4 pr-10 rounded-2xl bg-bg-surface border border-border-main text-text-main font-medium appearance-none focus:outline-none focus:border-brand-primary cursor-pointer shadow-sm"
                  >
                    <option value="popular">ยอดนิยม</option>
                    <option value="cheap">ราคาต่ำ → สูง</option>
                    <option value="expensive">ราคาสูง → ต่ำ</option>
                    <option value="reviews">รีวิวดีที่สุด</option>
                    <option value="new">ใหม่ล่าสุด</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Mobile Sort & Results count */}
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm font-semibold text-text-muted">
                  พบสินค้า <span className="text-brand-primary">{filtered.length.toLocaleString()}</span> รายการ
                </p>
                <div className="md:hidden relative">
                  <select
                    value={sort}
                    aria-label="เรียงลำดับสินค้า"
                    onChange={(e) => setSort(e.target.value)}
                    className="text-sm bg-transparent text-text-main font-semibold appearance-none pr-6 focus:outline-none"
                  >
                    <option value="popular">ยอดนิยม</option>
                    <option value="cheap">ราคาต่ำ → สูง</option>
                    <option value="expensive">ราคาสูง → ต่ำ</option>
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {SKELETON_ARRAY.map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="surface-card flex flex-col items-center justify-center space-y-5 py-32 rounded-[2rem]">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-brand-primary/10 blur-3xl" />
                  <Search className="relative h-16 w-16 text-text-muted" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-text-main">ไม่พบสินค้าที่ตรงกับเงื่อนไข</p>
                  <p className="mt-2 text-sm text-text-muted">ลองปรับตัวกรองหรือคำค้นหาของคุณอีกครั้ง</p>
                </div>
                <CTAButton onClick={() => setFilters(defaultFilters)} className="mt-4 px-8">ล้างตัวกรอง</CTAButton>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center pt-10 pb-8">
                    <CTAButton variant="secondary" onClick={handleLoadMore} className="px-10 h-14 rounded-2xl">
                      {t("common_loadMore")}
                    </CTAButton>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SectionContainer>

      {/* Sticky Mobile Filter Button */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-brand-primary text-white font-bold shadow-[0_8px_30px_rgb(99,91,255,0.4)] backdrop-blur-md transition-transform active:scale-95"
        >
          <SlidersHorizontal className="w-5 h-5" />
          ตัวกรองสินค้า
          {Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f !== "") && (
            <span className="flex items-center justify-center w-5 h-5 ml-1 text-[10px] font-black bg-white text-brand-primary rounded-full">
              !
            </span>
          )}
        </button>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden justify-end">
          <div className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="relative w-[85vw] sm:max-w-sm h-full bg-bg-surface overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300 ease-out border-l border-border-subtle">
            <FilterSidebar filters={filters} setFilters={setFilters} onClose={() => setIsMobileFilterOpen(false)} isMobile />
          </div>
        </div>
      )}
    </div>
  );
}
