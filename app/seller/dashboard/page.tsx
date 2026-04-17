"use client";

import CTAButton from "@/app/components/CTAButton";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";

export default function SellerDashboardPage() {
  const { t } = useLanguage();
  const { seller } = useAuth();
  const kpis = [
    { label: t("seller_kpiRevenueToday"), value: "฿28,450", delta: "+12%" },
    { label: t("seller_kpiNewOrders"), value: "126", delta: "+8%" },
    { label: t("seller_kpiDeliveryRate"), value: "98.4%", delta: "+1.1%" },
    { label: t("seller_kpiRating"), value: seller?.rating?.toFixed(1) || "0.0", delta: "+0.2" },
  ];

  const products = [
    { name: "ROV Diamond 500", stock: t("seller_stockReady"), sold: 422, revenue: "฿58,400" },
    { name: "Steam Wallet ฿200", stock: t("seller_stockReady"), sold: 301, revenue: "฿42,140" },
    { name: "Netflix Premium 1 เดือน", stock: t("seller_stockLow"), sold: 112, revenue: "฿28,000" },
  ];
  return (
    <div className="space-y-6 md:space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="type-h1">{t("seller_title")}</h1>
          <p className="type-body mt-1 max-w-[58ch] text-text-subtle">{t("seller_desc")}</p>
        </div>
        <CTAButton>{t("seller_addProduct")}</CTAButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.label} className="surface-card motion-fade-in p-5">
            <p className="text-xs text-text-muted">{item.label}</p>
            <p className="type-num mt-1 text-2xl font-extrabold text-text-main">{item.value}</p>
            <p className="type-num mt-1 text-xs font-semibold text-accent">{item.delta}</p>
          </div>
        ))}
      </div>

      <div className="surface-card motion-fade-up p-5 sm:p-6">
        <h2 className="type-h2">{t("seller_revenue30")}</h2>
        <div className="mt-5 flex h-48 items-end gap-2 rounded-2xl bg-bg-surface/90 p-4 shadow-[0_14px_24px_rgba(5,10,24,0.16)]">
          {[42, 56, 40, 65, 78, 70, 86, 66, 74, 80, 96, 88].map((height, idx) => (
            <div key={idx} className="flex-1 rounded-md bg-linear-to-t from-brand-primary to-accent/70" style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>

      <div className="surface-card motion-fade-up overflow-hidden">
        <div className="px-5 py-4">
          <h2 className="type-h2">{t("seller_productMgmt")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-text-muted">
                <th className="px-5 py-3 font-semibold">{t("seller_products")}</th>
                <th className="px-5 py-3 font-semibold">{t("seller_stock")}</th>
                <th className="px-5 py-3 font-semibold">{t("seller_sold")}</th>
                <th className="px-5 py-3 font-semibold">{t("seller_revenue")}</th>
                <th className="px-5 py-3 font-semibold">{t("seller_manage")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.name}>
                  <td className="max-w-[260px] truncate px-5 py-4 font-semibold text-text-main">{product.name}</td>
                  <td className="px-5 py-4 text-text-subtle">{product.stock}</td>
                  <td className="type-num px-5 py-4 text-text-subtle">{product.sold}</td>
                  <td className="type-num px-5 py-4 font-semibold text-text-main">{product.revenue}</td>
                  <td className="px-5 py-4">
                    <button className="rounded-lg bg-bg-surface px-3 py-1.5 text-xs font-semibold text-text-subtle shadow-[0_8px_16px_rgba(5,10,24,0.14)]">
                      {t("seller_edit")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
