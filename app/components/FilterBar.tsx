"use client";

import { useLanguage } from "@/app/context/LanguageContext";

interface FilterBarProps {
  category: string;
  setCategory: (v: string) => void;
  platform: string;
  setPlatform: (v: string) => void;
  priceRange: string;
  setPriceRange: (v: string) => void;
}

function SelectPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-text-muted font-bold uppercase tracking-[0.12em]">
        {label}
      </span>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="cursor-pointer appearance-none rounded-xl border border-border-subtle bg-bg-surface px-8 py-2.5 text-sm text-text-main transition-all hover:border-border-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:border-brand-primary/30"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-bg-surface text-text-main">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function FilterBar({
  category,
  setCategory,
  platform,
  setPlatform,
  priceRange,
  setPriceRange,
}: FilterBarProps) {
  const { t } = useLanguage();
  const categories = [
    { value: "all", label: t("common_all") },
    { value: "เติมเกม", label: t("home_ctaTopup") },
    { value: "Gift Card", label: "Gift Card" },
    { value: "Subscription", label: "Subscription" },
    { value: "AI Tools", label: "AI Tools" },
    { value: "โปรวันนี้", label: t("home_ctaDeals") },
  ];

  const platforms = [
    { value: "all", label: t("common_all") },
    { value: "PC", label: "PC" },
    { value: "Mobile", label: "Mobile" },
    { value: "Web", label: "Web" },
    { value: "Console", label: "Console" },
  ];

  const priceRanges = [
    { value: "all", label: t("common_all") },
    { value: "<100", label: "< 100" },
    { value: "100-300", label: "100-300" },
    { value: "300-500", label: "300-500" },
    { value: ">500", label: "> 500" },
  ];

  return (
    <div
      id="filter-bar"
      className="no-scrollbar flex gap-5 overflow-x-auto py-1 md:gap-6"
    >
      <SelectPill label={t("common_category")} value={category} onChange={setCategory} options={categories} />
      <SelectPill label={t("common_platform")} value={platform} onChange={setPlatform} options={platforms} />
      <SelectPill label={t("common_priceRange")} value={priceRange} onChange={setPriceRange} options={priceRanges} />
    </div>
  );
}