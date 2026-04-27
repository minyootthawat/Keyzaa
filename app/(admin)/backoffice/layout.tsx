"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "@/app/context/ThemeContext";
import { useLanguage } from "@/app/context/LanguageContext";
import AdminSidebar from "@/app/components/AdminSidebar";
import { useRouter } from "next/navigation";

const shortcutHints = "D=Dashboard, O=Orders, P=Products, S=Sellers, U=Users, A=Analytics, T=Toggle theme, L=Toggle language";

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

interface AdminUser {
  email: string;
  name: string;
  adminRole: string | null;
  adminPermissions: string[];
  isAdmin: boolean;
}

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLanguage();
  const router = useRouter();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Read token from localStorage (set by login page)
        const token = localStorage.getItem("keyzaa_admin_token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/admin/me", {
          headers,
        });
        if (!res.ok) throw new Error("not authenticated");
        const data = await res.json();
        if (!data.user?.isAdmin) throw new Error("not admin");
        setAdminUser(data.user);
      } catch {
        router.replace("/backoffice/login");
      } finally {
        setChecking(false);
      }
    };
    checkAdmin();
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (isInputFocused) return;

      const key = e.key;
      switch (key.toLowerCase()) {
        case "d":
          router.push("/backoffice/dashboard");
          break;
        case "o":
          router.push("/backoffice/orders");
          break;
        case "p":
          router.push("/backoffice/products");
          break;
        case "u":
          router.push("/backoffice/users");
          break;
        case "s":
          router.push("/backoffice/sellers");
          break;
        case "a":
          router.push("/backoffice/analytics");
          break;
        case "t":
          toggleTheme();
          break;
        case "l":
          toggleLang();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router, toggleTheme, toggleLang]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-warning border-t-transparent" />
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  const role = roleConfig[adminUser.adminRole ?? "support_admin"] || roleConfig.support_admin;

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
            {/* Keyboard shortcuts hint */}
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts"
              className="relative h-11 w-11 shrink-0 flex items-center justify-center rounded-xl text-text-subtle hover:bg-bg-surface-hover hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
            >
              <svg className="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              {showShortcuts && (
                <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-border-subtle bg-bg-elevated p-3 text-xs text-text-main shadow-xl">
                  <p className="mb-2 font-bold text-text-muted uppercase tracking-wider">Keyboard Shortcuts</p>
                  <div className="space-y-1">
                    <p><span className="font-mono font-bold">D</span> Dashboard</p>
                    <p><span className="font-mono font-bold">O</span> Orders</p>
                    <p><span className="font-mono font-bold">P</span> Products</p>
                    <p><span className="font-mono font-bold">U</span> Users</p>
                    <p><span className="font-mono font-bold">S</span> Sellers</p>
                    <p><span className="font-mono font-bold">A</span> Analytics</p>
                    <p><span className="font-mono font-bold">T</span> Toggle theme</p>
                    <p><span className="font-mono font-bold">L</span> Toggle language</p>
                  </div>
                </div>
              )}
            </button>

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
          <AdminSidebar adminRole={adminUser.adminRole} adminPermissions={adminUser.adminPermissions} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
