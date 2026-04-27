"use client";

import { useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import StatCard from "@/app/components/StatCard";
import SectionHeader from "@/app/components/SectionHeader";
import { formatThaiBaht } from "@/app/lib/marketplace";

const SPARKLINE_REVENUE = [55, 70, 60, 85, 75, 90, 95];
const SPARKLINE_ORDERS = [40, 55, 45, 65, 60, 75, 80];
const SPARKLINE_VISITORS = [30, 45, 60, 40, 55, 70, 65];
const SPARKLINE_CONVERSION = [20, 35, 30, 45, 40, 55, 50];

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

const MOCK_TOP_PRODUCTS: TopProduct[] = [
  { id: "tp_001", name: "Robux 1000", sales: 342, revenue: 30800 },
  { id: "tp_002", name: "Genshin Impact Top-up", sales: 256, revenue: 25600 },
  { id: "tp_003", name: "Valorant Points 1000", sales: 198, revenue: 19800 },
  { id: "tp_004", name: "Steam Wallet 500", sales: 167, revenue: 83500 },
  { id: "tp_005", name: "Google Play 1000", sales: 143, revenue: 14300 },
];

// Simple bar chart for sales over time (mock)
function SalesChart() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const values = [65, 80, 72, 90, 85, 95];
  const maxVal = Math.max(...values);

  return (
    <div className="surface-card p-5">
      <h3 className="type-h2 text-text-main mb-4">
        {useLanguage().lang === "th" ? "ยอดขายรายเดือน" : "Monthly Sales"}
      </h3>
      <div className="flex h-40 items-end gap-3">
        {months.map((month, i) => {
          const heightPct = (values[i] / maxVal) * 100;
          return (
            <div key={month} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-sm bg-brand-primary/60 hover:bg-brand-primary transition-colors relative group"
                style={{ height: `${heightPct}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  {values[i]}%
                </div>
              </div>
              <span className="text-xs text-text-muted">{month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrafficSources() {
  const sources = [
    { label: "Direct", pct: 42, color: "bg-brand-primary" },
    { label: "Search", pct: 31, color: "bg-accent" },
    { label: "Social", pct: 18, color: "bg-warning" },
    { label: "Referral", pct: 9, color: "bg-text-muted" },
  ];

  return (
    <div className="surface-card p-5">
      <h3 className="type-h2 text-text-main mb-4">
        {useLanguage().lang === "th" ? "แหล่งที่มาของ трафик" : "Traffic Sources"}
      </h3>
      <div className="space-y-3">
        {sources.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-16 text-sm text-text-subtle">{s.label}</span>
            <div className="flex-1 h-2 rounded-full bg-bg-surface overflow-hidden">
              <div
                className={`h-full rounded-full ${s.color}`}
                style={{ width: `${s.pct}%` }}
              />
            </div>
            <span className="w-10 text-right text-sm font-semibold text-text-main">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConversionFunnel() {
  const steps = [
    { label: "Visitors", value: 12450, pct: 100 },
    { label: "Product Views", value: 8920, pct: 71.6 },
    { label: "Add to Cart", value: 3210, pct: 25.8 },
    { label: "Checkout", value: 1890, pct: 15.2 },
    { label: "Purchase", value: 1432, pct: 11.5 },
  ];

  return (
    <div className="surface-card p-5">
      <h3 className="type-h2 text-text-main mb-4">
        {useLanguage().lang === "th" ? "Conversion Funnel" : "Conversion Funnel"}
      </h3>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-3">
            <span className="w-28 text-sm text-text-subtle">{step.label}</span>
            <div className="flex-1 h-3 rounded-full bg-bg-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-primary/60"
                style={{ width: `${step.pct}%` }}
              />
            </div>
            <span className="w-20 text-right text-sm font-semibold text-text-main">
              {step.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopProductsTable({ products }: { products: TopProduct[] }) {
  const { lang } = useLanguage();

  return (
    <div className="surface-card overflow-hidden">
      <div className="p-5 border-b border-border-subtle">
        <h3 className="type-h2 text-text-main">
          {lang === "th" ? "สินค้าขายดี" : "Top Products"}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                #
              </th>
              <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                {lang === "th" ? "สินค้า" : "Product"}
              </th>
              <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                {lang === "th" ? "ยอดขาย" : "Sales"}
              </th>
              <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                {lang === "th" ? "รายได้" : "Revenue"}
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, i) => (
              <tr
                key={product.id}
                className="border-b border-border-subtle/50 hover:bg-bg-surface/40 transition-colors"
              >
                <td className="px-5 py-4 text-text-muted font-semibold">{i + 1}</td>
                <td className="px-5 py-4 font-semibold text-text-main">{product.name}</td>
                <td className="px-5 py-4 text-text-subtle">{product.sales}</td>
                <td className="px-5 py-4 font-semibold text-text-main">
                  ฿{formatThaiBaht(product.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SellerAnalyticsPage() {
  const { seller } = useAuth();
  const { lang } = useLanguage();
  const [loading] = useState(false);

  const totalRevenue = 178250;
  const totalOrders = 1432;
  const totalVisitors = 12450;
  const conversionRate = "11.5%";

  const statCards = [
    {
      label: lang === "th" ? "รายได้รวม" : "Total Revenue",
      value: `฿${formatThaiBaht(totalRevenue)}`,
      delta: "↑ 18%",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_REVENUE,
    },
    {
      label: lang === "th" ? "ยอดขายทั้งหมด" : "Total Orders",
      value: String(totalOrders),
      delta: "↑ 12%",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_ORDERS,
    },
    {
      label: lang === "th" ? "ผู้เข้าชม" : "Visitors",
      value: totalVisitors.toLocaleString(),
      delta: "↑ 24%",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_VISITORS,
    },
    {
      label: lang === "th" ? "อัตราการแปลง" : "Conversion Rate",
      value: conversionRate,
      delta: "↑ 2.1%",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_CONVERSION,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 md:space-y-7">
        <div className="h-28 w-full rounded-2xl bg-bg-surface/60 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="surface-card p-5">
              <div className="h-3 w-20 rounded bg-bg-surface/80 animate-pulse" />
              <div className="mt-3 h-8 w-28 rounded bg-bg-surface/80 animate-pulse" />
              <div className="mt-3 h-10 w-full rounded bg-bg-surface/60 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-48 w-full rounded-2xl bg-bg-surface/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-7">
      {/* Page header */}
      <SectionHeader
        title="Analytics"
        subtitle={
          lang === "th"
            ? `ร้าน ${seller?.shopName ?? ""} · ติดตามผลและวิเคราะห์การขายของคุณ`
            : `${seller?.shopName ?? ""} · Track and analyze your sales performance`
        }
        cta={undefined}
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SalesChart />
        <TrafficSources />
      </div>

      {/* Conversion funnel */}
      <ConversionFunnel />

      {/* Top products */}
      <TopProductsTable products={MOCK_TOP_PRODUCTS} />
    </div>
  );
}
