import { getBackofficeStatusTone } from "@/app/lib/backoffice";

interface AdminStatusBadgeProps {
  label: string;
}

export default function AdminStatusBadge({ label }: AdminStatusBadgeProps) {
  const tone = getBackofficeStatusTone(label);

  const className =
    tone === "success"
      ? "border-accent/20 bg-accent/10 text-accent"
      : tone === "warning"
        ? "border-warning/20 bg-warning/10 text-warning"
        : tone === "danger"
          ? "border-danger/20 bg-danger/10 text-danger"
          : "border-white/10 bg-white/[0.05] text-text-subtle";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  );
}
