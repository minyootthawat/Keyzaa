import Link from "next/link";
import AdminSidebar from "@/app/components/AdminSidebar";

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border-subtle bg-bg-base/72 backdrop-blur-2xl">
        <div className="section-container flex items-center justify-between gap-4 py-4">
          <Link
            href="/backoffice/dashboard"
            className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/45"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning font-bold text-lg">
              AD
            </div>
            <div>
              <p className="text-base font-black tracking-tight text-text-main">Keyzaa Admin</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">Full systems workspace</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/backoffice/orders"
              className="rounded-xl border border-border-subtle bg-bg-surface/70 px-4 py-2.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main"
            >
              Orders
            </Link>
            <Link
              href="/backoffice/products"
              className="rounded-xl border border-border-subtle bg-bg-surface/70 px-4 py-2.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main"
            >
              Products
            </Link>
            <Link
              href="/backoffice/sellers"
              className="rounded-xl border border-border-subtle bg-bg-surface/70 px-4 py-2.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main"
            >
              Sellers
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-border-subtle bg-bg-surface/70 px-4 py-2.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main"
            >
              Back to storefront
            </Link>
          </div>
        </div>
      </header>
      <div className="section-container py-6">
        <div className="flex gap-8">
          <AdminSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
