"use client";

import StickyHeader from "@/app/components/StickyHeader";
import SellerSidebar from "@/app/components/SellerSidebar";
import SellerRouteGuard from "@/app/components/SellerRouteGuard";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellerRouteGuard>
      <StickyHeader />
      <div className="flex min-h-screen flex-col">
        {/* Content with sidebar */}
        <main className="flex-1 pt-[116px] sm:pt-[76px]">
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
