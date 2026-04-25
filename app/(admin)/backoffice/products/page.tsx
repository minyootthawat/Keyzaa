"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageShell from "@/app/components/backoffice/admin-page-shell";
import AdminStatusBadge from "@/app/components/backoffice/admin-status-badge";
import { useLanguage } from "@/app/context/LanguageContext";
import { fetchBackoffice, type BackofficeProduct, type BackofficeProductsResponse } from "@/app/lib/backoffice";
import { formatThaiBaht } from "@/app/lib/marketplace";

export default function AdminProductsPage() {
  const { lang } = useLanguage();
  const [products, setProducts] = useState<BackofficeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchBackoffice<BackofficeProductsResponse>("/api/backoffice/products", controller.signal)
      .then((response) => {
        setProducts(response.products);
        setError(null);
      })
      .catch(() => {
        setProducts([]);
        setError(lang === "th" ? "โหลดข้อมูลสินค้าไม่สำเร็จ" : "Failed to load listings.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lang]);

  const stats = useMemo(() => {
    const active = products.filter((product) => product.isActive).length;
    const lowStock = products.filter((product) => product.stock < 10).length;
    const verifiedSellerCount = products.filter((product) => product.seller.verified).length;

    return [
      { label: lang === "th" ? "รายการขายทั้งหมด" : "Total listings", value: products.length.toLocaleString() },
      { label: lang === "th" ? "ใช้งานอยู่" : "Active", value: active.toLocaleString() },
      { label: lang === "th" ? "สต็อกใกล้หมด" : "Low stock", value: lowStock.toLocaleString() },
      { label: lang === "th" ? "จากร้านยืนยันแล้ว" : "Verified seller listings", value: verifiedSellerCount.toLocaleString() },
    ];
  }, [lang, products]);

  return (
    <AdminPageShell
      eyebrow={lang === "th" ? "Catalog Governance" : "Catalog Governance"}
      title={lang === "th" ? "ระบบดูแลรายการสินค้า" : "Listing governance"}
      description={
        lang === "th"
          ? "ตรวจสอบสต็อก ราคา และความพร้อมของรายการขายจากฝั่งแอดมิน เพื่อคุมคุณภาพแคตตาล็อกให้คงที่"
          : "Review stock, pricing, and listing readiness to keep marketplace catalog quality consistent."
      }
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
          <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-6 text-sm text-danger">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-text-muted">
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "สินค้า" : "Product"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "หมวดหมู่" : "Category"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ร้าน" : "Seller"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "ราคา" : "Price"}</th>
                  <th className="px-4 py-3 font-semibold">{lang === "th" ? "สต็อก" : "Stock"}</th>
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
                    <td className="px-4 py-4">
                      <p className="font-medium text-text-main">{product.seller.storeName}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {product.seller.verified
                          ? lang === "th"
                            ? "ร้านยืนยันแล้ว"
                            : "Verified seller"
                          : lang === "th"
                            ? "รอตรวจสอบ"
                            : "Pending verification"}
                      </p>
                    </td>
                    <td className="type-num px-4 py-4 font-semibold text-text-main">฿{formatThaiBaht(product.price)}</td>
                    <td className="type-num px-4 py-4 text-text-subtle">{product.stock}</td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge label={product.isActive ? "active" : "paused"} />
                    </td>
                  </tr>
                ))}
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                      {lang === "th" ? "ยังไม่มีรายการสินค้า" : "No listings found."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
