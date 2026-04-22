"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import AuthDialog from "@/app/components/AuthDialog";
import CartDialog from "@/app/components/CartDialog";

export default function StickyHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showCartDialog, setShowCartDialog] = useState(false);
  const { totalItems } = useCart();
  const { user, isRegisteredSeller } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const isSellerRoute = pathname?.startsWith("/seller") ?? false;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 flex flex-col ${
          scrolled
            ? "bg-bg-base/72 backdrop-blur-2xl border-b border-border-subtle shadow-[0_18px_44px_rgba(4,11,23,0.22)]"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="section-container flex items-center justify-between gap-4 py-3">
          <Link
            href={isSellerRoute ? "/seller/dashboard" : "/"}
            className="flex items-center gap-2.5 shrink-0 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-tertiary/20 bg-linear-to-br from-brand-primary to-brand-secondary text-white font-bold text-lg shadow-lg shadow-brand-primary/20 group-hover:shadow-brand-primary/35 transition-shadow">
              KZ
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xl font-black tracking-tight text-gradient-brand">Keyzaa</span>
              <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-text-muted">
                {isSellerRoute ? t("seller_panel") : t("common_trustedDelivery")}
              </span>
            </div>
          </Link>

          {!isSellerRoute ? (
          <div className="relative mx-4 hidden max-w-2xl flex-1 sm:block">
            <div
              className={`flex items-center gap-2.5 rounded-2xl border transition-all duration-200 px-4 py-2.5 ${
                searchFocused
                  ? "border-border-main bg-bg-surface shadow-[0_12px_24px_rgba(4,11,23,0.18)]"
                  : "border-border-subtle bg-bg-surface/88 hover:border-border-main"
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
          ) : (
            <div className="hidden flex-1 items-center gap-3 sm:flex">
              <Link
                href="/"
                className="rounded-xl border border-border-subtle bg-bg-surface/70 px-4 py-2.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main"
              >
                {t("seller_switchToBuyer")}
              </Link>
              <div className="rounded-xl border border-accent/18 bg-accent/8 px-4 py-2.5 text-sm font-semibold text-accent">
                {t("seller_myShop")}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-accent/18 bg-accent/8 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-accent">
              <span className="h-2 w-2 rounded-full bg-accent" />
              {isSellerRoute ? t("seller_overview") : t("common_verifiedSellers")}
            </div>
            <button
              onClick={toggleLang}
              aria-label={t("common_toggleLanguage")}
              className="h-11 rounded-xl px-3 text-sm font-bold text-text-subtle hover:bg-bg-surface hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
            >
              {lang === "th" ? "TH" : "EN"}
            </button>
            {!isSellerRoute ? (
              <button
                onClick={() => setShowCartDialog(true)}
                aria-label={t("common_openCart")}
                className="relative flex h-11 w-11 items-center justify-center rounded-xl hover:bg-bg-surface transition-colors text-text-subtle hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
              >
                <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                {isClient && totalItems > 0 && (
                  <span className="type-num absolute -right-0.5 -top-0.5 flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-accent text-xs font-bold text-bg-base border-2 border-bg-base leading-none">
                    {totalItems}
                  </span>
                )}
              </button>
            ) : null}

            {isRegisteredSeller ? (
              <Link
                href="/seller/dashboard"
                className="hidden sm:flex h-11 items-center gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/10 px-3 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3h16.5v4.5H3.75zM3.75 9.75h7.5v10.5h-7.5zM13.5 9.75h6.75v4.5H13.5zM13.5 16.5h6.75v3.75H13.5z" />
                </svg>
                <span>{isSellerRoute ? t("seller_overview") : t("seller_myShop")}</span>
              </Link>
            ) : null}
            <button
              onClick={() => setShowAuthDialog(true)}
              aria-label={t("common_profile")}
              className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl hover:bg-bg-surface transition-colors text-text-subtle hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
            >
              {user ? (
                <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {!isSellerRoute ? (
        <div className="sm:hidden px-4 pb-3 w-full">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${
              searchFocused
                ? "border-border-main bg-bg-surface shadow-[0_10px_22px_rgba(4,11,23,0.18)]"
                : "border-border-subtle bg-bg-surface/94"
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
        ) : null}
      </header>

      {showAuthDialog && <AuthDialog onClose={() => setShowAuthDialog(false)} />}
      {showCartDialog && <CartDialog onClose={() => setShowCartDialog(false)} />}
    </>
  );
}
