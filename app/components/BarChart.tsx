"use client";

import React from "react";

export interface BarChartProps {
  /** Array of height percentages (0-100) */
  data: number[];
  /** Bar width in CSS units, e.g. "12px" or "0.75rem" */
  barWidth?: string;
  /** Gap between bars */
  gap?: string;
  /** Whether to highlight the last bar */
  highlightLast?: boolean;
  /** Custom color class for bars (default: brand-primary/40) */
  barColor?: string;
  /** Height of the chart container */
  height?: number;
  /** Custom class for the container */
  className?: string;
}

/**
 * BarChart — renders a vertical bar chart (sparkline style).
 * Used inside StatCard and other data visualization contexts.
 */
export default function BarChart({
  data,
  barWidth = "0.75rem",
  gap = "4px",
  highlightLast = true,
  barColor = "bg-brand-primary/40",
  height = 40,
  className = "",
}: BarChartProps) {
  return (
    <div
      className={`flex items-end gap-[${gap}] ${className}`}
      style={{ height }}
    >
      {data.map((h, i) => {
        const isActive = highlightLast && i === data.length - 1;
        return (
          <div
            key={i}
            className={`rounded-t-sm transition-all duration-300 hover:bg-brand-primary ${barColor}`}
            style={{
              width: barWidth,
              height: `${h}%`,
              opacity: isActive ? 1 : 0.5 + i * 0.08,
            }}
          />
        );
      })}
    </div>
  );
}