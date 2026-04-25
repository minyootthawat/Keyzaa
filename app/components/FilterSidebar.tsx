"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import CTAButton from "./CTAButton";

interface FilterState {
  games: string[];
  minPrice: string;
  maxPrice: string;
  categories: string[];
  ranks: string[];
  specials: string[];
  delivery: string[];
  trust: string[];
  status: string[];
}

interface FilterSidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onClose?: () => void;
  isMobile?: boolean;
}

export const defaultFilters: FilterState = {
  games: [],
  minPrice: "",
  maxPrice: "",
  categories: [],
  ranks: [],
  specials: [],
  delivery: [],
  trust: [],
  status: [],
};

const FILTER_OPTIONS = {
  games: ["ROV", "PUBG Mobile", "Valorant", "Genshin Impact", "Free Fire", "Roblox"],
  categories: ["ไอดีเกม", "ไอเทม/สกิน", "บริการปั๊มแรงค์", "บัตรเติมเงิน"],
  ranks: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Conqueror/Radiant"],
  specials: ["มีสกินหายาก", "มีของ Limited", "ไอดีสะอาด (ไม่เคยโดนแบน)"],
  delivery: ["ส่งอัตโนมัติ (Instant)", "ส่งโดยผู้ขาย"],
  trust: ["Verified Seller", "4 ดาวขึ้นไป"],
  status: ["พร้อมขาย", "ใกล้หมด"],
};

export default function FilterSidebar({ filters, setFilters, onClose, isMobile }: FilterSidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    games: true,
    price: true,
    categories: true,
    ranks: false,
    specials: false,
    delivery: true,
    trust: true,
    status: false,
  });

  const toggleExpand = (section: string) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCheckbox = (category: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[category] as string[];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter((v) => v !== value) };
      } else {
        return { ...prev, [category]: [...current, value] };
      }
    });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const renderCheckboxGroup = (id: string, title: string, options: string[], filterKey: keyof FilterState) => (
    <div className="py-5 relative">
      <button
        onClick={() => toggleExpand(id)}
        aria-expanded={expanded[id]}
        className="flex w-full items-center justify-between font-semibold text-text-main group"
      >
        {title}
        <span className="bg-bg-subtle p-1.5 rounded-full text-text-muted group-hover:text-text-main transition-colors">
          {expanded[id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>
      {expanded[id] && (
        <div className="mt-5 flex flex-col gap-3.5">
          {options.map((opt) => (
            <label key={opt} className="flex cursor-pointer items-start gap-3 group">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-border-main bg-transparent checked:border-brand-primary checked:bg-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all duration-200 hover:border-brand-primary/50"
                  checked={(filters[filterKey] as string[]).includes(opt)}
                  onChange={() => handleCheckbox(filterKey, opt)}
                />
                <svg
                  className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white scale-0 peer-checked:scale-100 transition-transform duration-200 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-text-muted group-hover:text-text-main transition-colors leading-relaxed">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex h-full flex-col bg-bg-surface ${isMobile ? 'p-6' : 'rounded-[2rem] p-6 shadow-xl border border-border-subtle'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5 text-text-main font-bold text-lg">
          <div className="bg-brand-primary/10 p-2 rounded-xl">
            <SlidersHorizontal className="h-5 w-5 text-brand-primary" />
          </div>
          ตัวกรองสินค้า
        </div>
        {isMobile && onClose && (
          <button onClick={onClose} aria-label="ปิดหน้าต่างตัวกรอง" className="rounded-full p-2 hover:bg-bg-subtle text-text-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 divide-y divide-border-subtle/50">
        {/* Price Range */}
        <div className="pb-5 relative">
          <button
            onClick={() => toggleExpand("price")}
            aria-expanded={expanded.price}
            className="flex w-full items-center justify-between font-semibold text-text-main group"
          >
            ช่วงราคา (THB)
            <span className="bg-bg-subtle p-1.5 rounded-full text-text-muted group-hover:text-text-main transition-colors">
              {expanded.price ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </span>
          </button>
          {expanded.price && (
            <div className="mt-5 flex items-center gap-3">
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">฿</span>
                <input
                  type="number"
                  placeholder="ต่ำสุด"
                  className="w-full rounded-xl border border-border-main bg-bg-base pl-7 pr-3 py-2.5 text-sm font-medium text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                  value={filters.minPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                />
              </div>
              <span className="text-text-muted font-black">-</span>
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">฿</span>
                <input
                  type="number"
                  placeholder="สูงสุด"
                  className="w-full rounded-xl border border-border-main bg-bg-base pl-7 pr-3 py-2.5 text-sm font-medium text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>

        {renderCheckboxGroup("games", "เกม", FILTER_OPTIONS.games, "games")}
        {renderCheckboxGroup("categories", "ประเภทสินค้า", FILTER_OPTIONS.categories, "categories")}
        {renderCheckboxGroup("ranks", "Rank / Level", FILTER_OPTIONS.ranks, "ranks")}
        {renderCheckboxGroup("specials", "สกิน / ของพิเศษ", FILTER_OPTIONS.specials, "specials")}
        {renderCheckboxGroup("delivery", "ประเภทการส่ง", FILTER_OPTIONS.delivery, "delivery")}
        {renderCheckboxGroup("trust", "ความน่าเชื่อถือ", FILTER_OPTIONS.trust, "trust")}
        {renderCheckboxGroup("status", "สถานะสินค้า", FILTER_OPTIONS.status, "status")}
      </div>

      <div className="pt-6 mt-auto">
        <CTAButton variant="secondary" className="w-full h-12" onClick={clearFilters}>
          ล้างตัวกรองทั้งหมด
        </CTAButton>
      </div>
    </div>
  );
}
