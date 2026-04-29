"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";

interface NavItem {
  label: string;
  href: string;
  description: string;
  requiresActive?: boolean;
}

export default function SellerSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { seller } = useAuth();
  const sellerStatus = seller?.status ?? "pending_verification";
  const isActive = sellerStatus === "active";

  const STATUS_LABELS: Record<string, { th: string; en: string }> = {
    pending_verification: { th: "รอตรวจสอบ", en: "Pending" },
    active: { th: "เปิดใช้งาน", en: "Active" },
    rejected: { th: "ถูกปฏิเสธ", en: "Rejected" },
    suspended: { th: "ถูกระงับ", en: "Suspended" },
  };

  const STATUS_BADGE: Record<string, string> = {
    pending_verification: "bg-warning/15 text-warning",
    active: "bg-success/15 text-success",
    rejected: "bg-error/15 text-error",
    suspended: "bg-orange-500/15 text-orange-400",
  };

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
      requiresActive: true,
    },
    {
      label: "บัญชีเกม",
      href: "/seller/dashboard/game-accounts",
      description: "ดู stock, account inventory และสถานะเปิดขาย",
      requiresActive: true,
    },
    {
      label: t("wallet_title"),
      href: "/seller/dashboard/wallet",
      description: t("wallet_history"),
      requiresActive: true,
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
      <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto text-sm lg:block lg:overflow-visible">
        {navItems
          .filter((item) => !item.requiresActive || isActive)
          .map((item) => {
          const isActivePath = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={isActive ? item.href : "#"}
              onClick={!isActive ? (e) => e.preventDefault() : undefined}
              className={`shrink-0 rounded-2xl border px-3 py-3 lg:block ${
                !isActive && item.requiresActive
                  ? "opacity-40 cursor-not-allowed border-transparent"
                  : isActivePath
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
        <div className="mt-2 flex items-center gap-2">
          <p className="text-sm font-semibold text-text-main">{seller?.shopName}</p>
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[sellerStatus]}`}>
            {STATUS_LABELS[sellerStatus]?.th ?? sellerStatus}
          </span>
        </div>
        {!isActive && (
          <p className="mt-2 text-xs text-warning">
            {sellerStatus === "pending_verification"
              ? "รอแอดมินตรวจสอบ ยังไม่สามารถขายสินค้าได้"
              : sellerStatus === "rejected"
              ? "การสมัครถูกปฏิเสธ ติดต่อแอดมิน"
              : "บัญชีถูกระงับ ติดต่อแอดมิน"}
          </p>
        )}
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
