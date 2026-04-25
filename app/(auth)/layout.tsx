"use client";

import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border-subtle bg-bg-base/72 backdrop-blur-2xl">
        <div className="section-container flex items-center justify-between gap-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl focus-visible:outline-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-tertiary/20 bg-linear-to-br from-brand-primary to-brand-secondary text-white font-bold text-lg shadow-lg shadow-brand-primary/20">
              KZ
            </div>
            <div>
              <p className="text-base font-black tracking-tight text-gradient-brand">Keyzaa</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">Digital marketplace</p>
            </div>
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-border-subtle bg-bg-surface/70 px-4 py-2.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main"
          >
            Back to storefront
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">{children}</main>
    </div>
  );
}