export default function SkeletonCard() {
  return (
    <div className="surface-card overflow-hidden">
      <div className="aspect-4/3 animate-pulse bg-bg-elevated/70" />
      <div className="space-y-3 p-4 md:p-5">
        <div className="h-3 w-16 animate-pulse rounded-lg bg-bg-elevated/70" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-bg-elevated/70" />
        <div className="h-4 w-3/4 animate-pulse rounded-lg bg-bg-elevated/70" />
        <div className="border-t border-border-subtle pt-2">
          <div className="flex items-end gap-2">
            <div className="h-6 w-20 animate-pulse rounded-lg bg-bg-elevated/70" />
            <div className="h-4 w-14 animate-pulse rounded-lg bg-bg-elevated/70" />
          </div>
        </div>
        <div className="h-10 w-full animate-pulse rounded-xl bg-bg-elevated/70" />
      </div>
    </div>
  );
}
