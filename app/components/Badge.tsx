type BadgeProps = {
  label: string;
  tone?: "success" | "promo" | "default";
};

export default function Badge({ label, tone = "default" }: BadgeProps) {
  const toneClass =
    tone === "success"
      ? "border border-accent/20 bg-success-bg text-accent shadow-[0_6px_12px_rgba(16,185,129,0.12)]"
      : tone === "promo"
        ? "border border-brand-primary/20 bg-linear-to-r from-brand-primary/18 to-brand-secondary/12 text-text-main shadow-[0_8px_16px_rgba(20,52,160,0.16)]"
        : "border border-white/6 bg-bg-surface/90 text-text-subtle shadow-[0_6px_12px_rgba(5,10,24,0.12)]";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
      {label}
    </span>
  );
}
