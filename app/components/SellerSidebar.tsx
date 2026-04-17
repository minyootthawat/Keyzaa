"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";

interface NavItem {
  label: string;
  href: string;
}

export default function SellerSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { toggleSellerMode, seller } = useAuth();

  const navItems: NavItem[] = [
    { label: t("seller_overview"), href: "/seller/dashboard" },
    { label: t("sellerOrders_title"), href: "/seller/dashboard/orders" },
    { label: t("sellerProducts_title"), href: "/seller/dashboard/products" },
    { label: t("wallet_title"), href: "/seller/dashboard/wallet" },
    { label: t("settings_title"), href: "/seller/dashboard/settings" },
  ];

  return (
    <aside className="surface-card glass-panel motion-fade-up h-fit p-4 lg:p-5 lg:sticky lg:top-28">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">{t("seller_panel")}</p>
      <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto text-sm lg:block lg:space-y-2 lg:overflow-visible">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-xl px-3 py-2.5 ${isActive ? "bg-brand-primary/25 text-text-main" : "text-text-subtle hover:bg-bg-surface"} lg:block`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 border-t border-border-subtle pt-4">
        <p className="text-xs text-text-muted mb-2">{seller?.shopName}</p>
        <button
          onClick={toggleSellerMode}
          className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-text-subtle hover:bg-bg-surface"
        >
          ← {t("seller_switchToBuyer")}
        </button>
      </div>
    </aside>
  );
}
