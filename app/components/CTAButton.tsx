"use client";

import Link from "next/link";

type CTAButtonProps = {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  className?: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  href?: string;
  "data-testid"?: string;
};

export default function CTAButton({
  children,
  onClick,
  className = "",
  variant = "primary",
  fullWidth = false,
  type = "button",
  disabled = false,
  href,
  "data-testid": dataTestid,
}: CTAButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45 disabled:pointer-events-none disabled:opacity-60";

  const style =
    variant === "primary"
      ? "btn-primary text-white"
      : "btn-secondary";

  const width = fullWidth ? "w-full" : "";
  const combinedClassName = `${base} ${style} ${width} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        data-testid={dataTestid}
        className={combinedClassName}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} data-testid={dataTestid} className={combinedClassName}>
      {children}
    </button>
  );
}
