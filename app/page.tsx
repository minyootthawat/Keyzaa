"use client";

import Link from "next/link";
import CTAButton from "./components/CTAButton";
import Badge from "./components/Badge";
import PriceTag from "./components/PriceTag";
import products from "@/data/products.json";
import { useLanguage } from "./context/LanguageContext";

const categoryIcons: Record<string, string> = {
  "เติมเกม": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="m12 12 4.5 3.5"/><path d="m7.5 9.5 3-3"/><circle cx="17" cy="10" r="1"/><circle cx="7" cy="10" r="1"/></svg>`,
  "Gift Card": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8v12"/><path d="M7 12h2"/><path d="M15 12h2"/></svg>`,
  "Subscription": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m9 12 2 2 4-4"/></svg>`,
  "AI Tools": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14h.01"/><path d="M8 14h.01"/><path d="M11 17h2"/><path d="M3 12h18"/><path d="M4 22h16"/><path d="M12 18v4"/></svg>`,
  "โปร": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
};

export default function Home() {
  const { t, lang } = useLanguage();
  const bestDeals = products.slice(0, 4);
  const hotDeals = products.slice(4, 8);
  const categories = [
    { key: "เติมเกม", icon: categoryIcons["เติมเกม"], accent: "#635bff" },
    { key: "Gift Card", icon: categoryIcons["Gift Card"], accent: "#f8bb4a" },
    { key: "Subscription", icon: categoryIcons["Subscription"], accent: "#5fd7a0" },
    { key: "AI Tools", icon: categoryIcons["AI Tools"], accent: "#ff6b6b" },
    { key: "โปร", icon: categoryIcons["โปร"], accent: "#7c4dff" },
  ];
  const trustItems = [
    { icon: "⚡", text: t("home_trustInstant"), color: "#f8bb4a" },
    { icon: "🔒", text: t("home_trustSecure"), color: "#5fd7a0" },
    { icon: "🇹🇭", text: t("home_trustThaiSupport"), color: "#635bff" },
    { icon: "★", text: t("home_trustRating"), color: "#ff6b6b" },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] h-[70vh] w-[70vh] rounded-full bg-[radial-gradient(circle,rgba(99,91,255,0.18),transparent_70%)]" />
        <div className="absolute top-[30%] right-[-15%] h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(248,187,74,0.12),transparent_70%)]" />
        <div className="absolute bottom-[10%] left-[20%] h-[40vh] w-[40vh] rounded-full bg-[radial-gradient(circle,rgba(95,215,160,0.08),transparent_70%)]" />
      </div>

      <section className="relative min-h-[92vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-px h-40 bg-gradient-to-b from-[#635bff]/60 via-[#635bff]/20 to-transparent" />
          <div className="absolute top-32 right-1/3 w-px h-60 bg-gradient-to-b from-[#f8bb4a]/40 via-[#f8bb4a]/10 to-transparent" />
          <div className="absolute bottom-40 left-1/2 w-px h-32 bg-gradient-to-b from-[#5fd7a0]/30 via-[#5fd7a0]/10 to-transparent" />
        </div>

        <div className="section-container w-full py-16 lg:py-24">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#5fd7a0]/10 border border-[#5fd7a0]/25 text-[#5fd7a0] text-sm font-semibold"
                   style={{ animation: "fade-up 600ms cubic-bezier(0.22,1,0.36,1) both" }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5fd7a0] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5fd7a0]"></span>
                </span>
                {t("home_heroBadge")}
              </div>

              <h1 className="type-display text-text-main leading-[1.05]"
                  style={{ animation: "fade-up 600ms 100ms cubic-bezier(0.22,1,0.36,1) both" }}>
                {t("home_heroTitle")}
              </h1>

              <p className="type-body text-text-subtle max-w-[56ch] leading-relaxed"
                 style={{ animation: "fade-up 600ms 200ms cubic-bezier(0.22,1,0.36,1) both" }}>
                {t("home_heroDesc")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2"
                   style={{ animation: "fade-up 600ms 300ms cubic-bezier(0.22,1,0.36,1) both" }}>
                <Link href="/products?category=เติมเกม" className="flex-1">
                  <CTAButton fullWidth className="h-14 text-base relative overflow-hidden group">
                    <span className="relative z-10">{t("home_ctaTopup")}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#635bff] via-[#7c4dff] to-[#8d7cff] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </CTAButton>
                </Link>
                <Link href="/products?category=Gift%20Card" className="flex-1">
                  <CTAButton fullWidth variant="secondary" className="h-14 text-base">
                    {t("home_ctaBuyGift")}
                  </CTAButton>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-sm text-text-muted"
                   style={{ animation: "fade-up 600ms 400ms cubic-bezier(0.22,1,0.36,1) both" }}>
                <span className="type-num font-semibold text-[#f8bb4a]">12,000+</span>
                <span>deliveries • PromptPay • TrueMoney</span>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#635bff]/30 to-[#5fd7a0]/20 rounded-3xl blur-3xl transform rotate-6 scale-105" />
                <div className="relative grid grid-cols-2 gap-4 p-6 rounded-3xl bg-gradient-to-br from-[#121933]/95 to-[#0d1222]/95 border border-border-subtle backdrop-blur-xl">
                  {bestDeals.map((product, i) => (
                    <Link key={product.id} href={`/products/${product.id}`}
                         className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-[#1a2344]/80 to-[#121933]/80 border border-[#ffffff08] hover:border-[#635bff]/30 transition-all duration-300 hover:-translate-y-1"
                         style={{ animation: `fade-up 500ms ${500 + i * 80}ms cubic-bezier(0.22,1,0.36,1) both` }}>
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#635bff]/20 to-transparent rounded-bl-full" />
                      <p className="type-meta text-text-muted mb-1">{product.category}</p>
                      <p className="text-sm font-semibold text-text-main line-clamp-2 leading-snug">{product.title}</p>
                      <div className="mt-3 flex items-baseline justify-between">
                        <PriceTag price={product.price} originalPrice={product.originalPrice} />
                      </div>
                      <div className="absolute -bottom-1 -right-1 px-2 py-1 rounded-tl-xl rounded-br-2xl bg-[#ff6b6b]/20 text-[#ff6b6b] text-xs font-bold">
                        -{product.discount}%
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container py-16 lg:py-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="type-h2 text-text-main">{t("home_popularCategories")}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((cat, i) => (
            <Link key={cat.key} href={`/products?category=${encodeURIComponent(cat.key)}`}
                 className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#121933] to-[#0d1222] border border-[#ffffff08] hover:border-[#ffffff15] transition-all duration-300 hover:-translate-y-0.5"
                 style={{ animation: `fade-up 500ms ${i * 60}ms cubic-bezier(0.22,1,0.36,1) both` }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{ background: `radial-gradient(circle at 50% 0%, ${cat.accent}15, transparent 70%)` }} />
              <div className="relative flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                     style={{ backgroundColor: `${cat.accent}18`, color: cat.accent }}
                     dangerouslySetInnerHTML={{ __html: cat.icon }} />
                <span className="text-sm font-semibold text-text-subtle group-hover:text-text-main transition-colors">{cat.key}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-container py-16 lg:py-20">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="type-h2 text-text-main flex items-center gap-2">
              <span className="text-[#f8bb4a]">★</span>
              {t("home_bestDeals")}
            </h2>
            <p className="text-sm text-text-muted">{t("home_dealsProof")}</p>
          </div>
          <Link href="/products" className="shrink-0 text-sm font-semibold text-text-subtle hover:text-[#635bff] transition-colors">
            {t("common_viewAll")} →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bestDeals.map((product, i) => (
            <Link key={product.id} href={`/products/${product.id}`}
                 className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121933] to-[#0d1222] border border-[#ffffff08] hover:border-[#635bff]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#635bff]/5"
                 style={{ animation: `fade-up 500ms ${i * 80}ms cubic-bezier(0.22,1,0.36,1) both` }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#f8bb4a]/15 to-transparent rounded-bl-full" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="type-meta text-text-muted">{product.category}</p>
                  <Badge label={`-${product.discount}%`} tone="promo" />
                </div>
                <p className="text-base font-semibold text-text-main line-clamp-2 leading-snug min-h-12">{product.title}</p>
                <div className="mt-4 flex items-end justify-between">
                  <PriceTag price={product.price} originalPrice={product.originalPrice} />
                </div>
                <div className="mt-3 pt-3 border-t border-[#ffffff08] flex items-center justify-between text-xs text-text-muted">
                  <span>{product.sellerCount} {t("common_sellers")}</span>
                  <span className="text-[#5fd7a0]">{t("common_instantDelivery")}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-container py-6 overflow-hidden">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#635bff]/10 via-[#f8bb4a]/5 to-[#5fd7a0]/10" />
          <div className="relative flex overflow-x-auto no-scrollbar py-6 px-4 gap-8">
            {[...trustItems, ...trustItems].map((item, i) => (
              <div key={i} className="shrink-0 flex items-center gap-3 px-4 py-2 rounded-xl bg-[#ffffff05] border border-[#ffffff08]">
                <span className="text-xl" style={{ color: item.color }}>{item.icon}</span>
                <span className="text-sm font-semibold text-text-subtle whitespace-nowrap">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-container py-16 lg:py-20">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="type-h2 text-text-main">{t("home_recommended")}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {hotDeals.map((product, i) => (
            <Link key={product.id} href={`/products/${product.id}`}
                 className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121933] to-[#0d1222] border border-[#ffffff08] hover:border-[#ffffff15] p-4 transition-all duration-300 hover:-translate-y-0.5"
                 style={{ animation: `fade-up 500ms ${i * 80}ms cubic-bezier(0.22,1,0.36,1) both` }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{ background: "radial-gradient(circle at 50% 100%, rgba(99,91,255,0.1), transparent 70%)" }} />
              <div className="relative">
                <p className="type-meta text-text-muted mb-1">{product.category}</p>
                <p className="text-base font-semibold text-text-main line-clamp-2 leading-snug">{product.title}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-extrabold text-text-main">฿{product.price.toLocaleString()}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-text-muted line-through">฿{product.originalPrice.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-container py-16 lg:py-24">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#635bff]/20 via-[#7c4dff]/10 to-[#5fd7a0]/15" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
          <div className="relative p-8 lg:p-12 text-center">
            <h2 className="type-h1 text-text-main mb-3">
              {lang === "th" ? "พร้อมเริ่มต้น?" : "Ready to start?"}
            </h2>
            <p className="type-body text-text-subtle max-w-xl mx-auto mb-8">
              {lang === "th" 
                ? "เติมเกม ซื้อ Gift Card หรือสมัคร subscription ที่คุณชอบ ได้ตั้งแต่วินาทีนี้"
                : "Top up games, buy gift cards, or subscribe to your favorites starting now"}
            </p>
            <Link href="/products">
              <CTAButton className="h-14 px-10 text-base">
                {t("common_products")}
              </CTAButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
