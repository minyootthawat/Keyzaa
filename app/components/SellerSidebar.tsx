"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";

interface NavItem {
  label: string;
  href: string;
  description: string;
}

export default function SellerSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { seller } = useAuth();

  const navItems: NavItem[] = [
    {
      label: t("seller_overview"),
      href: "/seller/dashboard",
      description: t("seller_title"),
    },
    {
      label: t("sellerOrders_title"),
      href: "/seller/dashboard/orders",
      description: t("sellerOrders_emptyDesc"),
    },
    {
      label: t("sellerProducts_title"),
      href: "/seller/dashboard/products",
      description: t("sellerProducts_title"),
    },
    {
      label: "บัญชีเกม",
      href: "/seller/dashboard/game-accounts",
      description: "ดู stock, account inventory และสถานะเปิดขาย",
    },
    {
      label: t("wallet_title"),
      href: "/seller/dashboard/wallet",
      description: t("wallet_history"),
    },
    {
      label: t("settings_title"),
      href: "/seller/dashboard/settings",
      description: "จัดการข้อมูลร้านค้าและความพร้อมรับยอด",
    },
  ];

  return (
    <aside className="motion-fade-up h-fit rounded-[1.75rem] border border-white/10 bg-bg-surface/80 p-4 shadow-[0_18px_50px_rgba(4,9,24,0.28)] lg:sticky lg:top-28 lg:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">{t("seller_panel")}</p>
      <h2 className="mt-2 text-lg font-semibold text-text-main">Seller Systems</h2>
      <p className="mt-2 text-sm leading-6 text-text-subtle">
        พื้นที่ทำงานสำหรับจัดการยอดขาย รายการสินค้า คำสั่งซื้อ และการรับยอดจากที่เดียว
      </p>
      <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto text-sm lg:block lg:space-y-2 lg:overflow-visible">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-2xl border px-3 py-3 lg:block ${
                isActive
                  ? "border-brand-primary/20 bg-brand-primary/12 text-text-main"
                  : "border-transparent text-text-subtle hover:border-white/10 hover:bg-bg-surface-hover"
              }`}
            >
              <p className="font-semibold">{item.label}</p>
              <p className={`mt-1 text-xs leading-5 ${isActive ? "text-text-subtle" : "text-text-muted"}`}>
                {item.description}
              </p>
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 rounded-2xl border border-white/10 bg-bg-base/50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">ร้านของคุณ</p>
        <p className="mt-2 text-sm font-semibold text-text-main">{seller?.shopName}</p>
        <p className="mt-1 text-sm text-text-muted">ใช้เมนูด้านบนเพื่อตรวจสอบยอด รายการขาย และงานที่ต้องทำวันนี้</p>
      </div>
      <div className="mt-4 border-t border-border-subtle pt-4">
        <Link
          href="/"
          className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-text-subtle hover:bg-bg-surface"
        >
          ← {t("seller_switchToBuyer")}
        </Link>
      </div>
    </aside>
  );
}
