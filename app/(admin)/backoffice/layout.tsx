"use client";

import Link from "next/link";
import { useTheme } from "@/app/context/ThemeContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import AdminSidebar from "@/app/components/AdminSidebar";

const roleConfig: Record<string, { labelTh: string; labelEn: string; emoji: string; className: string }> = {
  super_admin: {
    labelTh: "Super Admin",
    labelEn: "Super Admin",
    emoji: "👑",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  },
  ops_admin: {
    labelTh: "Ops Admin",
    labelEn: "Ops Admin",
    emoji: "📊",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
  support_admin: {
    labelTh: "Support",
    labelEn: "Support",
    emoji: "🎧",
    className: "bg-green-500/15 text-green-400 border-green-500/25",
  },
  catalog_admin: {
    labelTh: "Catalog",
    labelEn: "Catalog",
    emoji: "🏷️",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  },
};

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLanguage();
  const { adminRole } = useAuth();

  const role = roleConfig[adminRole ?? "support_admin"] || roleConfig.support_admin;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border-subtle bg-bg-base/72 backdrop-blur-2xl">
        <div className="section-container flex items-center justify-between gap-4 py-4">
          <Link
            href="/backoffice/dashboard"
            className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/45"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning font-bold text-lg">
              AD
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-base font-black tracking-tight text-text-main">Keyzaa Admin</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">Full systems workspace</p>
              </div>
              {/* Role badge */}
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${role.className}`}>
                {role.emoji} {role.labelEn}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              aria-label={lang === "th" ? "Switch to English" : "สลับเป็นภาษาไทย"}
              className="h-11 rounded-xl px-3 text-sm font-bold text-text-subtle hover:bg-bg-surface-hover hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
            >
              {lang === "th" ? "EN" : "TH"}
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={`Theme: ${theme === "dark" ? "Light" : "Dark"}`}
              title={`Theme: ${theme === "dark" ? "Light" : "Dark"}`}
              className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl text-text-subtle hover:bg-bg-surface-hover hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
            >
              {theme === "dark" ? (
                <svg className="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : (
                <svg className="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              )}
            </button>
            <Link
              href="/"
              className="rounded-xl border border-border-subtle bg-bg-surface/70 px-4 py-2.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main"
            >
              Back to storefront
            </Link>
          </div>
        </div>
      </header>
      <div className="section-container py-6">
        <div className="flex gap-8">
          <AdminSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
