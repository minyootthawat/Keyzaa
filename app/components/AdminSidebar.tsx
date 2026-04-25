"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";

interface NavItem {
  label: string;
  href: string;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const navItems: NavItem[] = [
    { label: lang === "th" ? "ภาพรวมแพลตฟอร์ม" : "Platform overview", href: "/backoffice/dashboard" },
  ];

  return (
    <aside className="surface-card glass-panel motion-fade-up h-fit p-4 lg:sticky lg:top-28 lg:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
        {lang === "th" ? "แอดมิน" : "Admin"}
      </p>
      <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto text-sm lg:block lg:space-y-2 lg:overflow-visible">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-xl px-3 py-2.5 lg:block ${
                isActive ? "bg-brand-primary/25 text-text-main" : "text-text-subtle hover:bg-bg-surface"
              }`}
            >
              {item.label}
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
