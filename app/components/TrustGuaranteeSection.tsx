"use client";

import React from "react";

interface TrustPillarProps {
  icon: React.ReactNode;
  heading: string;
  description: string;
}

function TrustPillar({ icon, heading, description }: TrustPillarProps) {
  return (
    <div className="rounded-lg border border-bg-bg-surface/50 bg-bg-surface/5 p-6 shadow-xl transition-all duration-300 hover:bg-bg-bg-surface">
      <div className="mb-3 flex items-center space-x-3">
        {icon}
        <h3 className="text-xl font-semibold text-text-main">{heading}</h3>
      </div>
      <p className="text-text-subtle">{description}</p>
    </div>
  );
}

function IconShell({ children, colorClass }: { children: React.ReactNode; colorClass: string }) {
  return <span className={`inline-flex h-8 w-8 items-center justify-center ${colorClass}`}>{children}</span>;
}

export default function TrustGuaranteeSection() {
  return (
    <section className="border-y border-bg-bg-subtle/50 bg-bg-base py-20">
      <div className="container mx-auto max-w-screen-xl px-4">
        <h2 className="mb-12 text-center text-3xl font-bold text-text-main">Shop with Confidence.</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <TrustPillar
            icon={
              <IconShell colorClass="text-brand-primary">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </IconShell>
            }
            heading="Mock Checkout"
            description="Payment screens in this demo use mock flows so teams can validate UX without charging real money."
          />
          <TrustPillar
            icon={
              <IconShell colorClass="text-accent">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </IconShell>
            }
            heading="Order Assurance"
            description="Every item includes clear delivery expectations and a visible issue-resolution path after purchase."
          />
          <TrustPillar
            icon={
              <IconShell colorClass="text-warning">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
                </svg>
              </IconShell>
            }
            heading="Verified Source"
            description="We prioritize verified sellers, transparent product details, and fast support instead of marketplace clutter."
          />
        </div>
      </div>
    </section>
  );
}
