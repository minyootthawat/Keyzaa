"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";

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
    href: "/backoffice/users",
    labelTh: "จัดการผู้ใช้",
    labelEn: "Manage users",
    icon: "👥",
    permission: "admin:users:read",
  },
  {
    href: "/backoffice/admins",
    labelTh: "จัดการแอดมิน",
    labelEn: "Admin Management",
    icon: "🔐",
    permission: "admin:users:read",
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

interface AdminSidebarProps {
  adminRole?: string | null;
  adminPermissions?: string[];
}

export default function AdminSidebar({ adminRole, adminPermissions = [] }: AdminSidebarProps) {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const visibleItems = navItems.filter((item) => {
    if (!adminPermissions.includes(item.permission)) return false;
    if (item.roles && adminRole && !item.roles.includes(adminRole)) return false;
    return true;
  });

  return (
    <aside className="surface-card glass-panel motion-fade-up h-fit p-4 lg:sticky lg:top-28 lg:p-5">
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-text-muted">
        {lang === "th" ? "เมนู" : "Menu"}
      </p>
      <nav className="space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-warning/12 text-warning"
                  : "text-text-subtle hover:bg-bg-surface-hover hover:text-text-main"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{lang === "th" ? item.labelTh : item.labelEn}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
