"use client";

import React from "react";
import CTAButton from "./CTAButton";

export interface SectionHeaderProps {
  /** Bilingual page title key or string */
  title: string;
  /** Bilingual subtitle/description */
  subtitle: string;
  /** Optional CTA button config */
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
  };
  /** Optional className to override container styles */
  className?: string;
}

/**
 * SectionHeader — renders page header with title, subtitle, and optional CTA.
 * Used at the top of every seller dashboard page.
 */
export default function SectionHeader({
  title,
  subtitle,
  cta,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div>
        <h1 className="type-h1">{title}</h1>
        <p className="type-body mt-1 max-w-[58ch] text-text-subtle">{subtitle}</p>
      </div>
      {cta && (
        cta.href ? (
          <CTAButton
            onClick={cta.onClick}
            disabled={cta.disabled}
          >
            {cta.label}
          </CTAButton>
        ) : (
          <button
            onClick={cta.onClick}
            disabled={cta.disabled}
            className="btn-primary rounded-xl px-5 py-3 text-sm font-semibold"
          >
            {cta.label}
          </button>
        )
      )}
    </div>
  );
}