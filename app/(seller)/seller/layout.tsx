"use client";

import Link from "next/link";
import SellerSidebar from "@/app/components/SellerSidebar";
import SellerRouteGuard from "@/app/components/SellerRouteGuard";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellerRouteGuard>
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="border-b border-border-subtle bg-bg-base/72 backdrop-blur-2xl">
          <div className="section-container flex items-center justify-between gap-4 py-4">
            <Link
              href="/seller/dashboard"
              className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-tertiary/20 bg-linear-to-br from-brand-primary to-brand-secondary text-white font-bold text-lg shadow-lg shadow-brand-primary/20">
                KZ
              </div>
              <div>
                <p className="text-base font-black tracking-tight text-gradient-brand">Keyzaa Seller</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">Seller workspace</p>
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

        {/* Content with sidebar */}
        <main className="flex-1">
          <div className="section-container py-8 md:py-12">
            <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:gap-7">
              <SellerSidebar />
              <div>{children}</div>
            </div>
          </div>
        </main>
      </div>
    </SellerRouteGuard>
  );
}
