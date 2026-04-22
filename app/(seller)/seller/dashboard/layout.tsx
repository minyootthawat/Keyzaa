"use client";

import SellerSidebar from "@/app/components/SellerSidebar";
import SellerRouteGuard from "@/app/components/SellerRouteGuard";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellerRouteGuard>
      <div className="section-container py-8 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:gap-7">
          <SellerSidebar />
          <div>{children}</div>
        </div>
      </div>
    </SellerRouteGuard>
  );
}
