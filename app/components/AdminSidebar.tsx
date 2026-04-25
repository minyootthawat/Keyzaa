"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";

interface NavItem {
  label: string;
  href: string;
  description: string;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const navItems: NavItem[] = [
    {
      label: lang === "th" ? "ภาพรวมแพลตฟอร์ม" : "Platform overview",
      href: "/backoffice/dashboard",
      description: lang === "th" ? "สุขภาพระบบ รายได้ และสัญญาณหลัก" : "System health, revenue, and core signals",
    },
    {
      label: lang === "th" ? "ออเดอร์" : "Orders",
      href: "/backoffice/orders",
      description: lang === "th" ? "ติดตามการชำระเงินและสถานะส่งมอบ" : "Track payments and fulfillment states",
    },
    {
      label: lang === "th" ? "สินค้า" : "Products",
      href: "/backoffice/products",
      description: lang === "th" ? "ดูรายการขาย สต็อก และร้านเจ้าของสินค้า" : "Review listings, stock, and seller ownership",
    },
    {
      label: lang === "th" ? "ผู้ขาย" : "Sellers",
      href: "/backoffice/sellers",
      description: lang === "th" ? "ตรวจสอบร้านค้า ยอดคงเหลือ และสถานะยืนยัน" : "Inspect stores, balances, and verification status",
    },
  ];

  return (
    <aside className="motion-fade-up h-fit rounded-[1.75rem] border border-white/10 bg-bg-surface/80 p-4 shadow-[0_18px_50px_rgba(4,9,24,0.28)] lg:sticky lg:top-28 lg:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
        {lang === "th" ? "แอดมิน" : "Admin"}
      </p>
      <h2 className="mt-2 text-lg font-semibold text-text-main">
        {lang === "th" ? "Platform Systems" : "Platform Systems"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-text-subtle">
        {lang === "th"
          ? "พื้นที่ทำงานสำหรับควบคุมตลาด ตรวจสอบความเสี่ยง และตามสถานะธุรกรรมหลัก"
          : "Workspace for marketplace controls, risk review, and transaction oversight."}
      </p>
      <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto text-sm lg:block lg:space-y-2 lg:overflow-visible">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-2xl border px-3 py-3 lg:block ${
                isActive
                  ? "border-warning/20 bg-warning/10 text-text-main"
                  : "border-transparent text-text-subtle hover:border-white/10 hover:bg-bg-surface-hover"
              }`}
            >
              <p className="font-semibold">{item.label}</p>
              <p className={`mt-1 text-xs leading-5 ${isActive ? "text-text-subtle" : "text-text-muted"}`}>
                {item.description}
              </p>
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 rounded-2xl border border-white/10 bg-bg-base/50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
          {lang === "th" ? "ขอบเขตงาน" : "Workspace scope"}
        </p>
        <p className="mt-2 text-sm leading-6 text-text-subtle">
          {lang === "th"
            ? "ภาพรวมแอดมินนี้ครอบคลุม overview, order operations, product governance, และ seller verification"
            : "This admin workspace covers overview, order operations, product governance, and seller verification."}
        </p>
      </div>
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
