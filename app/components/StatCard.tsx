"use client";

import React from "react";

export interface StatCardProps {
  /** Uppercase label text */
  label: string;
  /** Main numeric value display */
  value: string;
  /** Delta text with sign, e.g. "↑ 12%" or "↓ 3%" */
  delta: string;
  /** CSS color class for delta, e.g. "text-accent" or "text-danger" */
  deltaColor?: "text-accent" | "text-danger" | "text-text-muted" | "text-warning" | "text-brand-primary";
  /** 7 sparkline bar heights */
  sparklineData: number[];
  /** Optional custom CSS for the value */
  valueClassName?: string;
}

/**
 * StatCard — displays a single KPI metric with sparkline chart.
 * Used on Overview and Wallet pages.
 */
export default function StatCard({
  label,
  value,
  delta,
  deltaColor = "text-accent",
  sparklineData,
  valueClassName = "",
}: StatCardProps) {
  return (
    <div className="surface-card motion-fade-in p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className={`type-num mt-1 text-2xl font-extrabold text-text-main ${valueClassName}`}>
        {value}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <span className={`type-num text-xs font-semibold ${deltaColor}`}>{delta}</span>
        <span className="text-xs text-text-muted">vs last period</span>
      </div>
      <div className="mt-3 flex h-10 items-end gap-[3px]">
        {sparklineData.map((h, i) => {
          const isActive = i === sparklineData.length - 1;
          return (
            <div
              key={i}
              className="w-3 rounded-t-sm bg-brand-primary/40 transition-all duration-300 hover:bg-brand-primary"
              style={{
                height: `${h}%`,
                opacity: isActive ? 1 : 0.5 + i * 0.08,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}