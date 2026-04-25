import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  href: string;
  title: string;
  description: string;
  count: number;
  accent: string;
  Icon: LucideIcon;
}

export default function CategoryCard({
  href,
  title,
  description,
  count,
  accent,
  Icon,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group surface-card relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-5 transition-all duration-300 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-text-main shadow-[0_10px_30px_rgba(4,11,23,0.22)]">
            <Icon className="h-5 w-5" />
          </div>
          <div className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
            {count.toLocaleString()} รายการ
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-text-main transition-colors duration-300 group-hover:text-white">
            {title}
          </h3>
          <p className="text-sm leading-6 text-text-muted transition-colors duration-300 group-hover:text-text-subtle">
            {description}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-brand-tertiary transition-transform duration-300 group-hover:translate-x-1">
          <span>ดูสินค้าหมวดนี้</span>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}
