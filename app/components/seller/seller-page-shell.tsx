interface SellerPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function SellerPageShell({
  eyebrow,
  title,
  description,
  action,
  children,
}: SellerPageShellProps) {
  return (
    <div className="space-y-6 md:space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="type-meta text-brand-tertiary">{eyebrow}</p>
          <h1 className="type-h1 text-text-main">{title}</h1>
          <p className="type-body text-text-subtle">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}
