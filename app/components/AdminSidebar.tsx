"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";

interface NavItem {
  href: string;
  labelTh: string;
  labelEn: string;
  icon: string;
  permission: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    href: "/backoffice/dashboard",
    labelTh: "แดชบอร์ด",
    labelEn: "Dashboard",
    icon: "📊",
    permission: "admin:overview:read",
  },
  {
    href: "/backoffice/sellers",
    labelTh: "จัดการร้านค้า",
    labelEn: "Manage sellers",
    icon: "🏪",
    permission: "admin:sellers:read",
  },
  {
    href: "/backoffice/products",
    labelTh: "จัดการสินค้า",
    labelEn: "Manage products",
    icon: "📦",
    permission: "admin:products:read",
  },
  {
    href: "/backoffice/orders",
    labelTh: "คำสั่งซื้อ",
    labelEn: "Orders",
    icon: "🧾",
    permission: "admin:orders:read",
  },
  {
    href: "/backoffice/analytics",
    labelTh: "Analytics",
    labelEn: "Analytics",
    icon: "📈",
    permission: "admin:analytics:read",
    roles: ["super_admin", "ops_admin"],
  },
  {
    href: "/backoffice/settings",
    labelTh: "ตั้งค่าระบบ",
    labelEn: "System settings",
    icon: "⚙️",
    permission: "admin:settings:write",
    roles: ["super_admin"],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const { adminPermissions, adminRole } = useAuth();

  const visibleItems = navItems.filter((item) => {
    if (!adminPermissions.includes(item.permission as import("@/lib/auth/admin").AdminPermission)) return false;
    if (item.roles && adminRole && !item.roles.includes(adminRole)) return false;
    return true;
  });

  return (
    <aside className="surface-card glass-panel motion-fade-up h-fit p-4 lg:sticky lg:top-28 lg:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
        {lang === "th" ? "แอดมิน" : "Admin"}
      </p>
      <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto text-sm lg:block lg:space-y-2 lg:overflow-visible">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-xl px-3 py-2.5 lg:block ${
                isActive
                  ? "bg-brand-primary/25 text-text-main"
                  : "text-text-subtle hover:bg-bg-surface"
              }`}
            >
              <span className="mr-1.5">{item.icon}</span>
              {lang === "th" ? item.labelTh : item.labelEn}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 border-t border-border-subtle pt-4">
        <Link
          href="/"
          className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-text-subtle hover:bg-bg-surface"
        >
          ← {lang === "th" ? "กลับสโตร์" : "Back to storefront"}
        </Link>
      </div>
    </aside>
  );
}
