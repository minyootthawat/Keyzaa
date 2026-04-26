"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import StatCard from "@/app/components/StatCard";
import SectionHeader from "@/app/components/SectionHeader";

interface Review {
  id: string;
  buyerName: string;
  productName: string;
  rating: number;
  comment: string;
  date: string;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: "rev_001",
    buyerName: "สมชาย ใจดี",
    productName: "Robux 1000",
    rating: 5,
    comment: "ส่งเร็วมาก ได้รับภายใน 5 นาที บริการดีเยี่ยม!",
    date: "2026-04-25T10:30:00Z",
  },
  {
    id: "rev_002",
    buyerName: "พิมใจ รักดี",
    productName: " Genshin Impact Top-up",
    rating: 5,
    comment: "ราคาถูกกว่าที่อื่น และส่งเร็ว ชอบมากค่ะ",
    date: "2026-04-24T14:15:00Z",
  },
  {
    id: "rev_003",
    buyerName: "วิชัย มั่นคง",
    productName: "Valorant Points 1000",
    rating: 4,
    comment: "ดีมากครับ ติดนิดหน่อยตอน verify แต่ทีมงานช่วยได้ดี",
    date: "2026-04-23T09:00:00Z",
  },
  {
    id: "rev_004",
    buyerName: "สุนทรี สว่าง",
    productName: "Steam Wallet 500",
    rating: 5,
    comment: "Perfect! ซื้อบ่อยเลย ราคาดีที่สุดแล้ว",
    date: "2026-04-22T18:45:00Z",
  },
  {
    id: "rev_005",
    buyerName: "ธนา เจริญ",
    productName: "Google Play 1000",
    rating: 3,
    comment: "ได้รับเร็ว แต่อยากให้มีโปรโมชันมากกว่านี้",
    date: "2026-04-21T11:20:00Z",
  },
  {
    id: "rev_006",
    buyerName: "นภา วิไล",
    productName: "Robux 500",
    rating: 5,
    comment: "เด็กชอบมากค่ะ ขอบคุณมากนะคะ",
    date: "2026-04-20T16:00:00Z",
  },
];

const SPARKLINE_AVG = [60, 75, 65, 80, 70, 90, 85];
const SPARKLINE_FIVE = [50, 60, 70, 65, 80, 75, 90];
const SPARKLINE_RESP = [40, 55, 50, 65, 60, 70, 80];
const SPARKLINE_TOTAL = [30, 45, 55, 40, 60, 50, 70];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill={star <= rating ? "#F8BB4A" : "none"}
          stroke={star <= rating ? "#F8BB4A" : "#8b9ac4"}
          strokeWidth="1.5"
        >
          <path d="M7 1l1.8 3.6L13 5.2l-3 2.9.7 4.1L7 10.4l-3.7 1.8.7-4.1L1 5.2l4.2-.6L7 1z" />
        </svg>
      ))}
    </div>
  );
}

function formatDate(iso: string, lang: "th" | "en") {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SellerReviewsPage() {
  const { seller } = useAuth();
  const { lang } = useLanguage();
  const [loading] = useState(false);
  const [reviews] = useState<Review[]>(MOCK_REVIEWS);

  const totalReviews = reviews.length;
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1);
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const responseRate = "98%";

  const statCards = [
    {
      label: lang === "th" ? "รีวิวทั้งหมด" : "Total Reviews",
      value: String(totalReviews),
      delta: "↑ 12%",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_TOTAL,
    },
    {
      label: lang === "th" ? "คะแนนเฉลี่ย" : "Avg Rating",
      value: `${avgRating}/5`,
      delta: "↑ 0.2",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_AVG,
    },
    {
      label: lang === "th" ? "รีวิว 5 ดาว" : "5-Star Reviews",
      value: String(fiveStarCount),
      delta: "↑ 5",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_FIVE,
    },
    {
      label: lang === "th" ? "อัตราการตอบกลับ" : "Response Rate",
      value: responseRate,
      delta: "—",
      deltaColor: "text-text-muted" as const,
      sparklineData: SPARKLINE_RESP,
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
        title="รีวิวจากลูกค้า"
        subtitle={
          lang === "th"
            ? `ร้าน ${seller?.shopName ?? ""} · ดูรีวิวและคะแนนจากลูกค้าที่ซื้อสินค้าจากคุณ`
            : `${seller?.shopName ?? ""} · View reviews and ratings from your customers`
        }
        cta={undefined}
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Reviews table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                  {lang === "th" ? "ผู้ซื้อ" : "Buyer"}
                </th>
                <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                  {lang === "th" ? "สินค้า" : "Product"}
                </th>
                <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                  {lang === "th" ? "คะแนน" : "Rating"}
                </th>
                <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                  {lang === "th" ? "ความคิดเห็น" : "Comment"}
                </th>
                <th className="px-5 py-3.5 font-semibold text-text-muted uppercase tracking-wide text-xs">
                  {lang === "th" ? "วันที่" : "Date"}
                </th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg width="48" height="48" fill="none" viewBox="0 0 48 48" className="text-text-muted">
                        <path d="M24 4l5.5 11.1L42 16.8l-9 8.8 2.1 12.4L24 32.5l-11.1 5.5 2.1-12.4-9-8.8 12.5-1.7L24 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      </svg>
                      <p className="font-semibold text-text-main">
                        {lang === "th" ? "ยังไม่มีรีวิว" : "No reviews yet"}
                      </p>
                      <p className="text-sm text-text-muted">
                        {lang === "th" ? "รีวิวจากลูกค้าจะแสดงที่นี่" : "Reviews from customers will appear here"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="border-b border-border-subtle/50 hover:bg-bg-surface/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-semibold text-text-main">{review.buyerName}</span>
                    </td>
                    <td className="px-5 py-4 text-text-subtle">
                      <span className="truncate max-w-[180px] block">{review.productName}</span>
                    </td>
                    <td className="px-5 py-4">
                      <StarRating rating={review.rating} />
                    </td>
                    <td className="px-5 py-4 text-text-subtle">
                      <span className="truncate max-w-[300px] block italic">"{review.comment}"</span>
                    </td>
                    <td className="px-5 py-4 text-text-muted text-xs">
                      {formatDate(review.date, lang)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
