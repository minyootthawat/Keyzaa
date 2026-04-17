type BadgeProps = {
  label: string;
  tone?: "success" | "promo" | "default";
};

export default function Badge({ label, tone = "default" }: BadgeProps) {
  const toneClass =
    tone === "success"
      ? "bg-success-bg text-accent shadow-[0_6px_12px_rgba(16,185,129,0.12)]"
      : tone === "promo"
        ? "bg-linear-to-r from-brand-primary/22 to-brand-secondary/18 text-text-main shadow-[0_6px_14px_rgba(99,91,255,0.14)]"
        : "bg-bg-surface/90 text-text-subtle shadow-[0_6px_12px_rgba(5,10,24,0.12)]";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
      {label}
    </span>
  );
}
