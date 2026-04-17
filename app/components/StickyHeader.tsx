"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useLanguage } from "@/app/context/LanguageContext";
import ModeToggle from "@/app/components/ModeToggle";

export default function StickyHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { totalItems } = useCart();
  const { lang, toggleLang, t } = useLanguage();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 flex flex-col ${
        scrolled
          ? "bg-bg-base/70 backdrop-blur-xl border-b border-border-subtle"
          : "bg-bg-subtle border-transparent"
      }`}
    >
      <div className="section-container flex items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-brand-primary to-brand-secondary text-white font-bold text-lg shadow-lg shadow-brand-primary/20 group-hover:shadow-brand-primary/40 transition-shadow">
            KZ
          </div>
          <span className="hidden sm:block text-xl font-black tracking-tight text-gradient-brand">
            Keyzaa
          </span>
        </Link>

        <div className="relative flex-1 max-w-2xl hidden sm:block mx-4">
          <div
            className={`flex items-center gap-2.5 rounded-xl border transition-all duration-200 px-4 py-2.5 ${
              searchFocused
                ? "border-border-main bg-bg-surface"
                : "border-border-subtle bg-bg-surface/90 hover:border-border-main"
            }`}
          >
            <svg className="h-4 w-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder={t("common_searchLong")}
              aria-label={t("common_searchAria")}
              className="w-full bg-transparent text-sm font-medium text-text-main outline-none placeholder:text-text-muted"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleLang}
            aria-label={t("common_toggleLanguage")}
            className="h-11 rounded-xl px-3 text-sm font-bold text-text-subtle hover:bg-bg-surface hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
          >
            {lang === "th" ? "TH" : "EN"}
          </button>
          <Link
            href="/checkout"
            aria-label={t("common_openCart")}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl hover:bg-bg-surface transition-colors text-text-subtle hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
          >
            <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {isClient && totalItems > 0 && (
              <span className="type-num absolute -right-0.5 -top-0.5 flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-accent text-xs font-bold text-bg-base border-2 border-bg-base leading-none">
                {totalItems}
              </span>
            )}
          </Link>

          <ModeToggle />
          <button aria-label={t("common_profile")} className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl hover:bg-bg-surface transition-colors text-text-subtle hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45">
            <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="sm:hidden px-4 pb-3 w-full">
        <div
          className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${
            searchFocused ? "border-border-main bg-bg-surface" : "border-border-subtle bg-bg-surface"
          }`}
        >
          <svg className="h-[18px] w-[18px] shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder={t("common_searchShort")}
            aria-label={t("common_searchAria")}
            className="w-full bg-transparent text-sm font-medium text-text-main outline-none placeholder:text-text-muted"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>
    </header>
  );
}
