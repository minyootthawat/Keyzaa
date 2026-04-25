"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Store, Timer } from "lucide-react";
import CTAButton from "@/app/components/CTAButton";

interface HeroSectionProps {
  title: string;
  description: string;
  badge: string;
  proof: string;
  totalProducts: number;
  totalSellers: number;
  primaryCta: string;
  secondaryCta: string;
  trustTitle: string;
  trustPoints: string[];
  searchPlaceholder: string;
  browseLabel: string;
  statusLabel: string;
  inventoryLabel: string;
  sellerCountLabel: string;
}

const trustIcons = [ShieldCheck, Store, Timer] as const;

export default function HeroSection({
  title,
  description,
  badge,
  proof,
  totalProducts,
  totalSellers,
  primaryCta,
  secondaryCta,
  trustTitle,
  trustPoints,
  searchPlaceholder,
  browseLabel,
  statusLabel,
  inventoryLabel,
  sellerCountLabel,
}: HeroSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/products?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/products");
    }
  };

  return (
    <section className="section-container pt-5 pb-10 lg:pt-8 lg:pb-16">
      <div className="relative overflow-hidden rounded-[2rem] border border-border-main/50 bg-bg-subtle px-5 py-6 shadow-[0_30px_90px_rgba(3,9,22,0.42)] sm:px-7 sm:py-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-y-0 left-0 w-[44%] bg-[radial-gradient(circle_at_top_left,rgba(80,104,255,0.28),transparent_72%)]" />
          <div className="absolute right-[-8%] top-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(63,207,142,0.12),transparent_70%)] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,transparent_30%,transparent_70%,rgba(255,255,255,0.03)_100%)]" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-center">
          {/* Left: Value prop + search */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-text-main">
              <span>{badge}</span>
            </div>

            <h1 className="mt-5 max-w-[13ch] text-[2.3rem] font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-[3rem] lg:text-[4.2rem]">
              {title}
            </h1>

            <p className="mt-5 max-w-[60ch] text-base leading-7 text-text-subtle sm:text-lg">
              {description}
            </p>

            {/* Search form */}
            <form onSubmit={handleSearch} className="mt-7" role="search">
              <label htmlFor="hero-search" className="sr-only">
                {searchPlaceholder}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <input
                  ref={inputRef}
                  id="hero-search"
                  type="search"
                  name="q"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  autoComplete="off"
                  className="w-full rounded-2xl border border-border-subtle bg-bg-surface/80 py-4 pl-12 pr-36 text-base font-medium text-text-main placeholder:text-text-muted/60 transition-all focus:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 lg:py-5"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-brand-primary/30 bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(45,91,255,0.3)] transition-all hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
                >
                  {browseLabel}
                </button>
              </div>
            </form>

            {/* Stats row */}
            <div className="mt-6 flex items-center gap-6 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-main">{totalProducts.toLocaleString()}+</span>
                <span>{inventoryLabel}</span>
              </div>
              <div className="h-4 w-px bg-border-subtle" aria-hidden="true" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-main">{totalSellers.toLocaleString()}+</span>
                <span>{sellerCountLabel}</span>
              </div>
            </div>

            <p className="mt-4 text-sm font-medium text-text-muted">{proof}</p>
          </div>

          {/* Right: Trust points */}
          <div className="rounded-[1.75rem] border border-white/10 bg-bg-base/40 p-5">
            <div className="mb-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-tertiary">
                {statusLabel}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-text-main">{trustTitle}</h2>
            </div>

            <div className="mt-4 space-y-3">
              {trustPoints.map((point, index) => {
                const Icon = trustIcons[index] ?? ShieldCheck;
                return (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/14 text-brand-tertiary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-6 text-text-subtle">{point}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
