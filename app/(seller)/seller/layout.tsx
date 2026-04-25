"use client";

import StickyHeader from "@/app/components/StickyHeader";
import SellerSidebar from "@/app/components/SellerSidebar";
import SellerRouteGuard from "@/app/components/SellerRouteGuard";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellerRouteGuard>
      <StickyHeader />
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 pt-[116px] sm:pt-[76px]">
          <div className="section-container py-8 md:py-12">
            <div className="mb-6 rounded-[1.9rem] border border-brand-primary/14 bg-[linear-gradient(145deg,rgba(17,28,49,0.94),rgba(10,16,28,0.98))] px-6 py-5 shadow-[0_24px_70px_rgba(5,10,24,0.28)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-tertiary">Seller Workspace</p>
              <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-text-main md:text-3xl">
                    ระบบจัดการร้านค้าแบบครบวงจร
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-text-subtle">
                    ดูยอดขาย คุมรายการสินค้า ติดตามคำสั่งซื้อ และจัดการการรับยอดจากโครงเดียวกันที่อ่านง่ายบนมือถือ
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-7">
              <SellerSidebar />
              <div className="min-w-0">{children}</div>
            </div>
          </div>
        </main>
      </div>
    </SellerRouteGuard>
  );
}
