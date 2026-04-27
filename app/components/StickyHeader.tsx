"use client";

import { useEffect, useState, useSyncExternalStore, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingBag, LogOut } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import AuthDialog from "@/app/components/AuthDialog";

// Stable icon components — extracted outside render to avoid re-creation
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const CATEGORIES = [
  { key: "เติมเกม", label: "เติมเกม", gradient: "from-game-start to-game-end" },
  { key: "Gift Card", label: "Gift Card", gradient: "from-gift-start to-gift-end" },
  { key: "Subscription", label: "Subscription", gradient: "from-sub-start to-sub-end" },
  { key: "AI Tools", label: "AI Tools", gradient: "from-ai-start to-ai-end" },
  { key: "โปร", label: "โปร", gradient: "from-pro-start to-pro-end" },
];

const RECENT_SEARCHES_KEY = "keyzaa:recent-searches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === "undefined" || !query.trim()) return;
  const prev = getRecentSearches().filter((s) => s !== query);
  const next = [query, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

function removeRecentSearch(query: string) {
  const next = getRecentSearches().filter((s) => s !== query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

export default function StickyHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { totalItems } = useCart();

  // Check if we were redirected here because auth was required on /seller/register
  useEffect(function openAuthDialogIfRequired() {
    const doCheck = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("auth_required") === "1") {
        // Remove the param from URL without a full navigation
        const url = new URL(window.location.href);
        url.searchParams.delete("auth_required");
        window.history.replaceState({}, "", url.pathname);
        setShowAuthDialog(true);
      }
    };
    doCheck();
  }, []);

  const { user, isAdmin, isRegisteredSeller, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Scroll listener — passive for better scroll performance
  useEffect(function handleScroll() {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return function removeScrollListener() {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Load recent searches on mount
  useEffect(function loadRecentSearches() {
    const doLoad = () => {
      setRecentSearches(getRecentSearches());
    };
    doLoad();
  }, []);

  // Close panel on click outside
  useEffect(function handleClickOutside() {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSubmit = useCallback(
    (q: string) => {
      if (!q.trim()) return;
      saveRecentSearch(q.trim());
      setRecentSearches(getRecentSearches());
      setSearchFocused(false);
      router.push(`/products?search=${encodeURIComponent(q.trim())}`);
    },
    [router]
  );

  const handleCategoryClick = useCallback(
    (categoryKey: string) => {
      setSearchFocused(false);
      router.push(`/products?category=${encodeURIComponent(categoryKey)}`);
    },
    [router]
  );

  const handleRecentRemove = useCallback((q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentSearch(q);
    setRecentSearches(getRecentSearches());
  }, []);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearchSubmit(searchQuery);
      }
    },
    [searchQuery, handleSearchSubmit]
  );

  const openAuthDialog = useCallback(() => setShowAuthDialog(true), []);
  const closeAuthDialog = useCallback(() => setShowAuthDialog(false), []);

  const isRegistered = isRegisteredSeller;
  const isOnSellerRoute = pathname.startsWith("/seller");
  const showSwitchToBuyer = isRegistered && isOnSellerRoute;
  const showSwitchToSeller = isRegistered && !isOnSellerRoute;
  const showSearchPanel = searchFocused;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 flex flex-col transition-all duration-300 ${
          scrolled
            ? "bg-bg-base/72 backdrop-blur-2xl border-b border-border-subtle elevation-2"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="section-container flex items-center justify-between gap-4 py-3">
          {/* Logo */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-tertiary/20 bg-linear-to-br from-brand-primary to-brand-secondary text-white font-bold text-lg shadow-lg shadow-brand-primary/20 transition-shadow group-hover:shadow-brand-primary/35">
              KZ
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xl font-black tracking-tight text-gradient-brand">Keyzaa</span>
              <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-text-muted">
                {t("common_trustedDelivery")}
              </span>
            </div>
          </Link>

          {/* Desktop search */}
          <div className="relative mx-4 hidden max-w-2xl flex-1 sm:block" ref={searchRef}>
            {/* Search input */}
            <div
              className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 transition-all duration-200 ${
                searchFocused
                  ? "border-border-main bg-bg-surface elevation-2"
                  : "border-border-subtle bg-bg-surface/88 hover:border-border-main"
              }`}
            >
              <SearchIcon className="h-4 w-4 shrink-0 text-text-muted" />
              <input
                ref={inputRef}
                type="search"
                placeholder={t("common_searchLong")}
                aria-label={t("common_searchAria")}
                aria-autocomplete="list"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                onKeyDown={handleInputKeyDown}
                className="w-full bg-transparent text-sm font-medium text-text-main outline-none placeholder:text-text-muted"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    inputRef.current?.focus();
                  }}
                  className="shrink-0 rounded-lg p-0.5 text-text-muted hover:text-text-main transition-colors"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Search panel */}
            {showSearchPanel && (
              <div
                className="glass-panel absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-white/[0.08] p-4"
                role="listbox"
                aria-label="Search suggestions"
              >
                {/* Category quick links */}
                <div className="mb-4">
                  <p className="type-meta text-text-muted mb-3">{t("common_category")}</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => handleCategoryClick(cat.key)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface/60 px-3 py-1.5 text-xs font-semibold text-text-subtle transition-all hover:border-border-main hover:text-text-main hover:bg-bg-surface-hover"
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <p className="type-meta text-text-muted mb-3">{t("common_recentSearches") ?? "Recent Searches"}</p>
                    <ul className="space-y-1">
                      {recentSearches.map((q) => (
                        <li key={q}>
                          <button
                            onClick={() => handleSearchSubmit(q)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-text-subtle transition-colors hover:bg-bg-surface-hover hover:text-text-main"
                          >
                            <span className="flex items-center gap-3">
                              <ClockIcon className="h-4 w-4 shrink-0 text-text-muted" />
                              {q}
                            </span>
                            <button
                              onClick={(e) => handleRecentRemove(q, e)}
                              className="shrink-0 rounded-lg p-1 text-text-muted hover:text-text-main transition-colors"
                              aria-label={`Remove ${q}`}
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Empty state when no query */}
                {!searchQuery && recentSearches.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-4">{t("common_searchHint") ?? "Type to search products..."}</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">

            {/* Seller mode: switch to buyer */}
            {showSwitchToBuyer && (
              <Link
                href="/"
                className="hidden lg:flex items-center gap-2 rounded-full border border-accent/18 bg-accent/8 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-accent hover:bg-accent/15 transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-accent" />
                {t("common_switchToBuyerMode")}
              </Link>
            )}

            {/* Buyer mode: switch to seller */}
            {showSwitchToSeller && (
              <Link
                href="/seller/dashboard"
                className="hidden lg:flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/8 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-brand-primary hover:bg-brand-primary/15 transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-brand-primary" />
                {t("common_sellerMode")}
              </Link>
            )}

            {/* Admin dashboard link */}
            {isAdmin && (
              <Link
                href="/backoffice/dashboard"
                className="hidden lg:flex items-center gap-2 rounded-full border border-warning/18 bg-warning/8 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-warning hover:bg-warning/15 transition-colors"
              >
                {t("common_goAdminDashboard")}
              </Link>
            )}

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              aria-label={t("common_toggleLanguage")}
              className="h-11 rounded-xl px-3 text-sm font-bold text-text-subtle hover:bg-bg-surface-hover hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
            >
              {lang === "th" ? "TH" : "EN"}
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={`Theme: ${!isClient || theme === "dark" ? "Dark" : "Light"}`}
              title={`Theme: ${!isClient || theme === "dark" ? "Dark" : "Light"}`}
              className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl text-text-subtle hover:bg-bg-surface-hover hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
            >
              {!isClient || theme === "dark" ? (
                <svg className="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : (
                <svg className="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => router.push("/checkout")}
              aria-label={t("common_openCart")}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl text-text-subtle hover:bg-bg-surface-hover hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
            >
              <CartIcon className="h-[22px] w-[22px]" />
              {isClient && totalItems > 0 && (
                <span className="type-num absolute -right-0.5 -top-0.5 flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-accent text-xs font-bold text-bg-base border-2 border-bg-base leading-none">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Profile / Auth */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  aria-label={t("common_profile")}
                  aria-expanded={profileMenuOpen}
                  className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl text-text-subtle hover:bg-bg-surface-hover hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
                >
                  <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>
                
                {profileMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-white/[0.08] bg-bg-surface elevation-3 p-2 shadow-xl glass-panel">
                    <div className="px-3 py-2.5 border-b border-border-subtle mb-1.5">
                      <p className="text-sm font-semibold text-text-main truncate">{user.name}</p>
                      <p className="mt-0.5 text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                    
                    <div className="flex flex-col gap-0.5">
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-subtle hover:bg-bg-surface-hover hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <UserIcon className="h-4 w-4 shrink-0 text-text-muted" />
                        {t("common_profile") || "Profile"}
                      </Link>
                      
                      <Link 
                        href="/orders" 
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-subtle hover:bg-bg-surface-hover hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <ShoppingBag className="h-4 w-4 shrink-0 text-text-muted" />
                        {t("profile_openOrders")}
                      </Link>

                      <div className="my-1 h-px bg-border-subtle" />

                      <button 
                        onClick={() => {
                          setProfileMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/45"
                      >
                        <LogOut className="h-4 w-4 shrink-0 text-danger/80" />
                        {t("auth_logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openAuthDialog}
                aria-label={t("common_profile")}
                className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl text-text-subtle hover:bg-bg-surface-hover hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
              >
                <UserIcon className="h-[22px] w-[22px]" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden px-4 pb-3 w-full">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${
              searchFocused
                ? "border-border-main bg-bg-surface elevation-1"
                : "border-border-subtle bg-bg-surface/94"
            }`}
          >
            <SearchIcon className="h-[18px] w-[18px] shrink-0 text-text-muted" />
            <input
              type="search"
              placeholder={t("common_searchShort")}
              aria-label={t("common_searchAria")}
              className="w-full bg-transparent text-sm font-medium text-text-main outline-none placeholder:text-text-muted"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>
      </header>

      {showAuthDialog && <AuthDialog onClose={closeAuthDialog} />}
    </>
  );
}
