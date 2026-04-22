"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { t, lang } = useLanguage();
  const { isRegisteredSeller } = useAuth();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const isSellerRoute = pathname?.startsWith("/seller") ?? false;
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  const buyerNavItems: NavItem[] = [
    {
      id: "nav-home",
      label: t("common_home"),
      href: "/",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      id: "nav-products",
      label: t("common_products"),
      href: "/products",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      id: "nav-cart",
      label: t("common_cart"),
      href: "/checkout",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
      ),
      badge: totalItems,
    },
    {
      id: "nav-orders",
      label: t("buyerOrders_title"),
      href: "/orders",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
    },
    {
      id: "nav-seller",
      label: isRegisteredSeller ? t("seller_myShop") : t("common_seller"),
      href: "/seller/dashboard",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v3.75m0 0h3.75M3.75 6.75A8.25 8.25 0 0112 3a8.25 8.25 0 018.25 8.25v1.5M20.25 21v-3.75m0 0h-3.75m3.75 3.75A8.25 8.25 0 0112 21a8.25 8.25 0 01-8.25-8.25v-1.5" />
        </svg>
      ),
    },
  ];

  const sellerNavItems: NavItem[] = [
    {
      id: "seller-home",
      label: t("seller_overview"),
      href: "/seller/dashboard",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3h16.5v4.5H3.75zM3.75 9.75h7.5v10.5h-7.5zM13.5 9.75h6.75v4.5H13.5zM13.5 16.5h6.75v3.75H13.5z" />
        </svg>
      ),
    },
    {
      id: "seller-orders",
      label: t("sellerOrders_title"),
      href: "/seller/dashboard/orders",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M5.25 5.25h13.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5z" />
        </svg>
      ),
    },
    {
      id: "seller-products",
      label: t("sellerProducts_title"),
      href: "/seller/dashboard/products",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75 12 3l7.5 3.75M4.5 6.75V17.25L12 21l7.5-3.75V6.75M4.5 6.75 12 10.5m7.5-3.75L12 10.5m0 0v10.5" />
        </svg>
      ),
    },
    {
      id: "seller-wallet",
      label: t("wallet_title"),
      href: "/seller/dashboard/wallet",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5V6A2.25 2.25 0 0 0 18.75 3.75H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18v-1.5m0-9h-4.5a2.25 2.25 0 0 0 0 4.5H21m0-4.5v4.5" />
        </svg>
      ),
    },
    {
      id: "seller-store",
      label: t("common_home"),
      href: "/",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      id: "admin-overview",
      label: "Admin",
      href: "/admin/dashboard",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3h16.5v4.5H3.75zM3.75 9.75h7.5v10.5h-7.5zM13.5 9.75h6.75v4.5H13.5zM13.5 16.5h6.75v3.75H13.5z" />
        </svg>
      ),
    },
    {
      id: "admin-orders",
      label: lang === "th" ? "ออเดอร์" : "Orders",
      href: "/admin/dashboard",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M5.25 5.25h13.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5z" />
        </svg>
      ),
    },
    {
      id: "admin-sellers",
      label: lang === "th" ? "ผู้ขาย" : "Sellers",
      href: "/admin/dashboard",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5V4H2v16h5m10 0v-8H7v8m10 0H7" />
        </svg>
      ),
    },
    {
      id: "admin-store",
      label: t("common_home"),
      href: "/",
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
  ];

  const navItems = isAdminRoute ? adminNavItems : isSellerRoute ? sellerNavItems : buyerNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-bg-base/80 pb-safe backdrop-blur-xl sm:hidden">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 min-w-[72px] min-h-11 py-[6px] rounded-xl transition-all duration-200 active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45 ${
                isActive ? "text-accent" : "text-text-muted hover:text-text-main"
              }`}
            >
              <div className={`transition-all duration-200 ${isActive ? "-translate-y-0.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" : ""}`}>
                {item.icon}
              </div>
              <span className={`text-sm font-semibold tracking-tight transition-all duration-200 ${isActive ? "opacity-100" : "opacity-70"}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[3px] w-5 rounded-full bg-accent" />
              )}
              {isClient && item.badge && item.badge > 0 ? (
                <span className="type-num absolute top-0 right-2.5 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-accent text-xs font-bold text-bg-base leading-none">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
