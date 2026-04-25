import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Store, Timer } from "lucide-react";
import CTAButton from "@/app/components/CTAButton";

interface HeroSpotlightProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  discount: number;
  sellerName: string;
}

interface HeroSectionProps {
  spotlightProducts: HeroSpotlightProduct[];
  title: string;
  description: string;
  badge: string;
  proof: string;
  totalProducts: number;
  totalSellers: number;
  primaryCta: string;
  secondaryCta: string;
  trustTitle: string;
  trustPoints: string[];
  spotlightLabel: string;
  featuredLabel: string;
  featuredStatus: string;
  browseLabel: string;
  statusLabel: string;
  inventoryLabel: string;
  sellerCountLabel: string;
}

const trustIcons = [ShieldCheck, Store, Timer] as const;

export default function HeroSection({
  spotlightProducts,
  title,
  description,
  badge,
  proof,
  totalProducts,
  totalSellers,
  primaryCta,
  secondaryCta,
  trustTitle,
  trustPoints,
  spotlightLabel,
  featuredLabel,
  featuredStatus,
  browseLabel,
  statusLabel,
  inventoryLabel,
  sellerCountLabel,
}: HeroSectionProps) {
  const featuredProduct = spotlightProducts[0];

  return (
    <section className="section-container pt-5 pb-10 lg:pt-8 lg:pb-16">
      <div className="relative overflow-hidden rounded-[2rem] border border-border-main/50 bg-bg-subtle px-5 py-6 shadow-[0_30px_90px_rgba(3,9,22,0.42)] sm:px-7 sm:py-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-y-0 left-0 w-[44%] bg-[radial-gradient(circle_at_top_left,rgba(80,104,255,0.28),transparent_72%)]" />
          <div className="absolute right-[-8%] top-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(63,207,142,0.12),transparent_70%)] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,transparent_30%,transparent_70%,rgba(255,255,255,0.03)_100%)]" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-text-main">
              <span>{badge}</span>
            </div>

            <h1 className="mt-5 max-w-[13ch] text-[2.3rem] font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-[3rem] lg:text-[4.2rem]">
              {title}
            </h1>

            <p className="mt-5 max-w-[60ch] text-base leading-7 text-text-subtle sm:text-lg">
              {description}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <CTAButton href="/products" className="h-[3.25rem] px-7 text-base shadow-[0_14px_30px_rgba(24,59,181,0.34)]">
                {primaryCta}
              </CTAButton>
              <CTAButton
                href="/seller/register"
                variant="secondary"
                className="h-[3.25rem] border-white/10 bg-white/5 px-7 text-base text-text-main hover:bg-white/10"
              >
                {secondaryCta}
              </CTAButton>
            </div>

            <p className="mt-4 text-sm font-medium text-text-muted">{proof}</p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-black/[0.15] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-tertiary">
                  {spotlightLabel}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-text-main">{trustTitle}</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-text-subtle">
                {inventoryLabel} {totalProducts.toLocaleString()}+
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {trustPoints.map((point, index) => {
                const Icon = trustIcons[index] ?? ShieldCheck;
                return (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/14 text-brand-tertiary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-6 text-text-subtle">{point}</p>
                  </div>
                );
              })}
            </div>

            {featuredProduct ? (
              <Link
                href={`/products/${featuredProduct.id}`}
                className="group mt-4 block overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.03] transition-colors hover:border-border-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={featuredProduct.image}
                    alt={featuredProduct.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 420px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/12 to-transparent" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-danger/20 bg-danger/10 px-2.5 py-1 text-[11px] font-semibold text-danger">
                      -{featuredProduct.discount}%
                    </span>
                    <span className="rounded-full border border-white/10 bg-bg-base/70 px-2.5 py-1 text-[11px] font-semibold text-text-subtle">
                      {featuredProduct.category}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                        {featuredLabel}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-base font-semibold text-text-main">
                        {featuredProduct.title}
                      </h3>
                      <p className="mt-1 text-sm text-text-muted">{featuredProduct.sellerName}</p>
                    </div>
                    <div className="rounded-2xl border border-accent/20 bg-accent/10 px-3 py-2 text-right">
                      <p className="text-[11px] text-text-muted">{statusLabel}</p>
                      <p className="text-sm font-semibold text-accent">{featuredStatus}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{browseLabel}</p>
                      <p className="mt-1 text-2xl font-black tracking-tight text-white">
                        ฿{featuredProduct.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
                      <span>{sellerCountLabel} {totalSellers.toLocaleString()}+</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
