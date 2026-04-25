"use client";

import { useEffect, useMemo, useState } from "react";
import CTAButton from "@/app/components/CTAButton";
import SellerPageShell from "@/app/components/seller/seller-page-shell";
import SellerStatusBadge from "@/app/components/seller/seller-status-badge";
import { useLanguage } from "@/app/context/LanguageContext";
import { formatThaiBaht } from "@/app/lib/marketplace";
import { fetchSellerDashboard, type SellerProductsResponse } from "@/app/lib/seller-dashboard";
import type { Product } from "@/app/types";

export default function SellerProductsPage() {
  const { lang } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchSellerDashboard<SellerProductsResponse>("/api/seller/products", controller.signal)
      .then((data) => {
        setProducts(data.products);
        setError(null);
      })
      .catch(() => {
        setProducts([]);
        setError(lang === "th" ? "โหลดรายการสินค้าไม่สำเร็จ" : "Failed to load seller listings.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lang]);

  const stats = useMemo(() => {
    const active = products.filter((product) => product.isActive).length;
    const lowStock = products.filter((product) => product.stock < 10).length;
    const totalValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);

    return [
      { label: lang === "th" ? "รายการทั้งหมด" : "All listings", value: `${products.length}` },
      { label: lang === "th" ? "เปิดขายอยู่" : "Active", value: `${active}` },
      { label: lang === "th" ? "สต็อกใกล้หมด" : "Low stock", value: `${lowStock}` },
      { label: lang === "th" ? "มูลค่าสินค้าคงเหลือ" : "Inventory value", value: `฿${formatThaiBaht(totalValue)}` },
    ];
  }, [lang, products]);

  return (
    <SellerPageShell
      eyebrow={lang === "th" ? "Catalog Control" : "Catalog Control"}
      title={lang === "th" ? "ระบบจัดการสินค้า" : "Catalog control"}
      description={
        lang === "th"
          ? "ตรวจสอบราคา สต็อก และสถานะเปิดขายของสินค้าทั้งหมดในร้านจากมุมเดียว"
          : "Review pricing, stock, and listing activity for every product in one place."
      }
      action={<CTAButton>{lang === "th" ? "เพิ่มสินค้าใหม่" : "Add product"}</CTAButton>}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-bg-surface/80 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
            <p className="type-num mt-2 text-2xl font-extrabold text-text-main">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-bg-surface/80 p-5">
        {loading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-bg-base/60" />
        ) : error ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-6 text-danger">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-text-muted">
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "สินค้า" : "Product"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "หมวดหมู่" : "Category"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ราคา" : "Price"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "สต็อก" : "Stock"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ขายแล้ว" : "Sold"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "สถานะ" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-white/6 last:border-b-0">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-text-main">{product.title}</p>
                      <p className="mt-1 text-xs text-text-muted">{product.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-4 text-text-subtle">{product.category}</td>
                    <td className="type-num px-4 py-4 font-semibold text-text-main">฿{formatThaiBaht(product.price)}</td>
                    <td className="type-num px-4 py-4 text-text-subtle">{product.stock}</td>
                    <td className="type-num px-4 py-4 text-text-subtle">{product.soldCount}</td>
                    <td className="px-4 py-4">
                      <SellerStatusBadge label={product.isActive ? "active" : "paused"} />
                    </td>
                  </tr>
                ))}
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                      {lang === "th" ? "ยังไม่มีรายการสินค้าในร้าน" : "No listings yet."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SellerPageShell>
  );
}
