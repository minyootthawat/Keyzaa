"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { type Product } from "@/app/components/ProductCard";
import { useCart } from "@/app/context/CartContext";
import CTAButton from "@/app/components/CTAButton";
import Badge from "@/app/components/Badge";
import { useLanguage } from "@/app/context/LanguageContext";
import type { SellerOption } from "@/app/types";

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

interface ProductDetail extends Product {
  longDescription: string;
  platform: string;
  sellers: SellerOption[];
  reviews: Review[];
}

const MOCK_FETCH_DELAY = 400;

const starIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const checkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const clockIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const shieldIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<SellerOption | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      import("@/data/products.json").then((mod) => {
        const baseProduct = (mod.default as Product[]).find((p) => p.id === id);

        if (!baseProduct) {
          router.push("/products");
          return;
        }

        const mockSellers: SellerOption[] = [
          { id: "s1", name: "Keyzaa Official", price: baseProduct.price, rating: 4.9, salesCount: 15420, deliverySpeed: "ทันที", isOfficial: true },
          { id: "s2", name: "GameStore TH", price: baseProduct.price + 5, rating: 4.8, salesCount: 3200, deliverySpeed: "1-5 นาที" },
          { id: "s3", name: "BestDeal Digital", price: Math.max(baseProduct.price - 15, 10), rating: 4.5, salesCount: 890, deliverySpeed: "10-30 นาที" },
        ].sort((a, b) => a.price - b.price);

        const mockReviews: Review[] = [
          { id: "r1", user: "Somchai K.", rating: 5, comment: "ส่งไวมากครับ แนะนำเลย", date: "2 วันที่แล้ว" },
          { id: "r2", user: "Wichai S.", rating: 5, comment: "ราคาถูกที่สุดในตลาดตอนนี้แล้ว", date: "1 สัปดาห์ที่แล้ว" },
          { id: "r3", user: "Marisa P.", rating: 4, comment: "ใช้งานได้จริง ไม่มีปัญหาค่ะ", date: "2 สัปดาห์ที่แล้ว" },
        ];

        const detail: ProductDetail = {
          ...baseProduct,
          platform: baseProduct.platform || "PC / Mobile",
          longDescription: `สินค้านี้คือ ${baseProduct.title} ที่จะช่วยให้คุณได้รับประสบการณ์การใช้งานที่ยอดเยี่ยมที่สุด\n\nรายละเอียดสินค้า:\n- จัดส่งเป็นรหัส (Digital Key) หรือเติมเข้าไอดีโดยตรง\n- ใช้งานได้กับโซนประเทศไทย\n- รับประกันการใช้งาน 100% ตลอดอายุการใช้งาน\n- บริการซัพพอร์ตตลอด 24 ชั่วโมงหากติดปัญหาทางการใช้งาน`,
          sellers: mockSellers,
          reviews: mockReviews,
        };

        setProduct(detail);
        setSelectedSeller(mockSellers[0]);
        setLoading(false);
      });
    }, MOCK_FETCH_DELAY);
    return () => clearTimeout(timer);
  }, [id, router]);

  const handleAddToCart = () => {
    if (!product || !selectedSeller) return;
    addItem({ id: product.id, title: product.title, price: selectedSeller.price, image: product.image, quantity: 1, sellerId: selectedSeller.id, sellerName: selectedSeller.name, platform: product.platform });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#635bff]/30 blur-xl animate-pulse" />
          <div className="relative h-14 w-14 rounded-2xl border-2 border-[#635bff]/30 border-t-[#635bff] animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) return null;

  const bestDiscount = Math.max(...product.sellers.map(s => Math.round((1 - s.price / (product.originalPrice || product.price * 1.2)) * 100)));

  return (
    <div className="min-h-screen pb-32 md:pb-16">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[60vh] h-[60vh] rounded-full bg-[radial-gradient(circle,rgba(99,91,255,0.12),transparent_70%)]" />
        <div className="absolute bottom-[20%] right-0 w-[50vh] h-[50vh] rounded-full bg-[radial-gradient(circle,rgba(248,187,74,0.08),transparent_70%)]" />
      </div>

      <div className="section-container py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12 xl:grid-cols-[1fr_480px]">
          <div className="space-y-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#635bff]/20 via-transparent to-[#f8bb4a]/10 rounded-3xl blur-xl opacity-60" />
              <div className="relative overflow-hidden rounded-2xl border border-[#ffffff10] bg-gradient-to-br from-[#121933] to-[#0d1222] p-6 sm:p-8">
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-[#ff6b6b]/20 text-[#ff6b6b] text-xs font-bold">
                  -{product.discount}%
                </div>
                <div className="relative aspect-square max-w-[280px] mx-auto">
                  <Image src={product.image} alt={product.title} fill className="object-contain p-4" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0d1222] to-transparent" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="flex gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5fd7a0]/15 text-[#5fd7a0] text-xs font-semibold border border-[#5fd7a0]/25">
                    <span dangerouslySetInnerHTML={{ __html: checkIcon }} />
                    {t("common_instantDelivery")}
                  </span>
                  <Badge label={product.platform} tone="default" />
                  <Badge label={product.badge || t("common_recommended")} tone="promo" />
                </div>
              </div>

              <h1 className="type-h1 text-text-main leading-tight">{product.title}</h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#f8bb4a]" dangerouslySetInnerHTML={{ __html: starIcon }} />
                  4.9 {t("pdp_avgReview")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span dangerouslySetInnerHTML={{ __html: shieldIcon }} />
                  {t("pdp_refund")}
                </span>
                <span>{t("pdp_sold")} {selectedSeller?.salesCount.toLocaleString()}+</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-6 border-b border-[#ffffff10]">
                <button
                  onClick={() => setActiveTab("description")}
                  className={`pb-3 text-sm font-bold transition-all ${
                    activeTab === "description" ? "text-text-main border-b-2 border-[#635bff]" : "text-text-muted hover:text-text-subtle"
                  }`}
                >
                  {t("pdp_details")}
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`pb-3 text-sm font-bold transition-all ${
                    activeTab === "reviews" ? "text-text-main border-b-2 border-[#635bff]" : "text-text-muted hover:text-text-subtle"
                  }`}
                >
                  {t("pdp_reviews")} ({product.reviews.length})
                </button>
              </div>

              {activeTab === "description" ? (
                <div className="rounded-2xl bg-gradient-to-br from-[#ffffff08] to-[#ffffff03] border border-[#ffffff08] p-6 text-sm leading-relaxed text-text-subtle whitespace-pre-line">
                  {product.longDescription}
                </div>
              ) : (
                <div className="space-y-3">
                  {product.reviews.map((review, i) => (
                    <div key={review.id} className="rounded-2xl bg-gradient-to-br from-[#ffffff06] to-[#ffffff02] border border-[#ffffff08] p-5" style={{ animation: `fade-up 400ms ${i * 60}ms ease both` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 rounded-full bg-gradient-to-br from-[#635bff] to-[#7c4dff] items-center justify-center text-xs font-bold text-white">
                            {review.user.charAt(0)}
                          </div>
                          <p className="text-sm font-bold text-text-main">{review.user}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, j) => (
                            <span key={j} className={`text-sm ${j < review.rating ? "text-[#f8bb4a]" : "text-text-muted/30"}`} dangerouslySetInnerHTML={{ __html: starIcon }} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-text-muted mb-2">{review.date}</p>
                      <p className="text-sm text-text-subtle">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-[92px] lg:self-start">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a2344] via-[#121933] to-[#0d1222]" />
              <div className="absolute inset-0 border border-[#ffffff10] rounded-2xl" />
              <div className="relative p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{t("pdp_currentPrice")}</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-black text-text-main">฿{(selectedSeller?.price || product.price).toLocaleString()}</span>
                      {product.originalPrice && (
                        <span className="text-lg text-text-muted line-through">฿{product.originalPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2.5 py-1 rounded-lg bg-[#ff6b6b]/20 text-[#ff6b6b] text-sm font-bold">-{bestDiscount}%</span>
                    <span className="text-xs text-text-muted">จาก {product.sellers.length} ร้าน</span>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-[#ffffff10] to-transparent" />

                <div className="space-y-2.5">
                  <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">เลือกร้านค้า</p>
                  {product.sellers.map((seller, idx) => (
                    <button
                      key={seller.id}
                      onClick={() => setSelectedSeller(seller)}
                      className={`w-full rounded-xl p-4 text-left transition-all duration-200 ${
                        selectedSeller?.id === seller.id
                          ? "bg-gradient-to-br from-[#635bff]/20 to-[#7c4dff]/10 border border-[#635bff]/40 shadow-[0_0_20px_rgba(99,91,255,0.15)]"
                          : "bg-[#ffffff05] border border-[#ffffff08] hover:bg-[#ffffff08] hover:border-[#ffffff15]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-text-main">{seller.name}</p>
                            {seller.isOfficial && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#5fd7a0]/20 text-[#5fd7a0]">Official</span>
                            )}
                            {idx === 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f8bb4a]/20 text-[#f8bb4a]">ดีที่สุด</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <span className="text-[#f8bb4a]" dangerouslySetInnerHTML={{ __html: starIcon }} />
                              {seller.rating}
                            </span>
                            <span>{seller.salesCount.toLocaleString()} ขายแล้ว</span>
                            <span className="flex items-center gap-1">
                              <span dangerouslySetInnerHTML={{ __html: clockIcon }} />
                              {seller.deliverySpeed}
                            </span>
                          </div>
                        </div>
                        <p className="text-lg font-black text-text-main">฿{seller.price.toLocaleString()}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-[#ffffff10] to-transparent" />

                <div className="grid grid-cols-1 gap-3">
                  <CTAButton fullWidth onClick={handleBuyNow} className="h-12 text-base relative overflow-hidden group">
                    <span className="relative z-10">{t("common_buyNow")}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#635bff] via-[#7c4dff] to-[#8d7cff] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </CTAButton>
                  <CTAButton fullWidth variant="secondary" onClick={handleAddToCart} className="h-12 text-base">
                    {t("common_addToCart")}
                  </CTAButton>
                </div>

                <div className="flex items-center justify-center gap-4 pt-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <span dangerouslySetInnerHTML={{ __html: shieldIcon }} />
                    ปลอดภัย 100%
                  </span>
                  <span>•</span>
                  <span>ชำระเงินรวดเร็ว</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#ffffff10] bg-gradient-to-b from-[#070912] via-[#070912ee] to-[#070912] backdrop-blur-xl md:hidden">
        <div className="section-container flex items-center justify-between gap-4 py-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">{t("pdp_currentPrice")}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-text-main">฿{(selectedSeller?.price || product.price).toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-xs text-text-muted line-through">฿{product.originalPrice.toLocaleString()}</span>
              )}
            </div>
          </div>
          <CTAButton onClick={handleBuyNow} className="h-11 px-6">{t("common_buyNow")}</CTAButton>
        </div>
      </div>
    </div>
  );
}
