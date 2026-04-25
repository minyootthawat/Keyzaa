"use client";

import { useLanguage } from "@/app/context/LanguageContext";

interface SortingDropdownProps {
  sort: string;
  setSort: (v: string) => void;
}

export default function SortingDropdown({ sort, setSort }: SortingDropdownProps) {
  const { t } = useLanguage();
  const sortOptions = [
    { value: "cheap", label: t("products_sortCheap") },
    { value: "best", label: t("products_sortBest") },
    { value: "discount", label: t("products_sortDiscount") },
  ];
  
  return (
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-[11px] text-text-muted font-bold uppercase tracking-[0.12em] whitespace-nowrap">
        {t("common_sort")}
      </span>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
          <svg className="h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
        </div>
        <select
          aria-label={t("common_sort")}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="cursor-pointer appearance-none rounded-xl border border-border-subtle bg-bg-surface pl-9 pr-8 py-2.5 text-sm font-medium text-text-main transition-all hover:border-border-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:border-brand-primary/30"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-bg-surface text-text-main">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}