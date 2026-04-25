import type { LucideIcon } from "lucide-react";
import { ArrowRight, BadgeCheck, LifeBuoy, ShieldCheck } from "lucide-react";

interface TrustPillar {
  title: string;
  description: string;
  eyebrow: string;
  Icon: LucideIcon;
  iconClass: string;
}

interface TrustSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  pillars: TrustPillar[];
  flowEyebrow: string;
  flowTitle: string;
  flowDescription: string;
  journeySteps: string[];
  flowFooter: string;
}

export const defaultTrustIcons = {
  escrow: ShieldCheck,
  verified: BadgeCheck,
  dispute: LifeBuoy,
};

export default function TrustSection({
  eyebrow,
  title,
  description,
  pillars,
  flowEyebrow,
  flowTitle,
  flowDescription,
  journeySteps,
  flowFooter,
}: TrustSectionProps) {
  return (
    <section className="section-container py-12 lg:py-16" aria-labelledby="trust-heading">
      <div className="mb-7 max-w-2xl space-y-3 lg:mb-9">
        <p className="type-meta text-brand-tertiary">{eyebrow}</p>
        <h2 id="trust-heading" className="type-h2 text-text-main">
          {title}
        </h2>
        <p className="text-sm leading-6 text-text-muted">{description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 shadow-[0_18px_50px_rgba(3,9,22,0.2)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-bg-surface">
                <pillar.Icon className={`h-5 w-5 ${pillar.iconClass}`} />
              </div>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                {pillar.eyebrow}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-text-main">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-6 text-text-muted">{pillar.description}</p>
            </article>
          ))}
        </div>

        <aside className="rounded-[1.75rem] border border-border-main/45 bg-bg-subtle p-5 shadow-[0_20px_60px_rgba(3,9,22,0.26)] sm:p-6">
          <p className="type-meta text-brand-tertiary">{flowEyebrow}</p>
          <h3 className="mt-3 text-xl font-semibold text-text-main">{flowTitle}</h3>
          <p className="mt-3 text-sm leading-6 text-text-subtle">{flowDescription}</p>

          <div className="mt-5 space-y-3">
            {journeySteps.map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-sm font-bold text-brand-tertiary">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-text-subtle">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
            <span>{flowFooter}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </aside>
      </div>
    </section>
  );
}
