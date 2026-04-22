"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import CTAButton from "@/app/components/CTAButton";

function formatCompactNumber(value: number | undefined) {
  return Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export default function ProfilePage() {
  const { user, seller, isRegisteredSeller, isAdmin, logout, loading } = useAuth();
  const { t, lang } = useLanguage();

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="section-container py-8 md:py-12">
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="section-container py-8 md:py-12">
        <div className="surface-card glass-panel mx-auto max-w-2xl p-8 text-center md:p-10">
          <h1 className="type-h1">{t("profile_signInTitle")}</h1>
          <p className="type-body mt-3 text-text-subtle">{t("profile_signInDesc")}</p>
          <div className="mt-6 flex justify-center">
            <Link href="/">
              <CTAButton>{t("auth_login")}</CTAButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container py-8 md:py-12">
      <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="space-y-6">
          <section className="surface-card glass-panel overflow-hidden p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-xl font-black text-white shadow-lg shadow-brand-primary/20">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="type-h1 text-3xl">{user.name}</p>
                    <p className="type-body text-text-subtle">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/8 bg-bg-base/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle">
                      {user.role}
                    </span>
                    {isRegisteredSeller ? (
                      <span className="rounded-full border border-accent/18 bg-accent/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                        {lang === "th" ? "ผู้ขาย" : "Seller"}
                      </span>
                    ) : null}
                    {isAdmin ? (
                      <span className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-warning">
                        {t("admin_title")}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-danger/20 bg-danger/10 px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
              >
                {t("auth_logout")}
              </button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("profile_accountLabel")}</p>
                <p className="mt-2 text-sm font-semibold text-text-main">{user.email}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("profile_permissions")}</p>
                <p className="mt-2 text-sm font-semibold text-text-main">
                  {isAdmin
                    ? lang === "th"
                      ? "ผู้ซื้อ ผู้ขาย และแอดมิน"
                      : "Buyer, seller, and admin"
                    : isRegisteredSeller
                      ? lang === "th"
                        ? "ผู้ซื้อและผู้ขาย"
                        : "Buyer and seller"
                      : lang === "th"
                        ? "ผู้ซื้อ"
                        : "Buyer"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("profile_status")}</p>
                <p className="mt-2 text-sm font-semibold text-text-main">
                  {isRegisteredSeller
                    ? seller?.verificationStatus === "verified"
                      ? lang === "th"
                        ? "ยืนยันแล้ว"
                        : "Verified"
                      : lang === "th"
                        ? "กำลังตรวจสอบ"
                        : "In review"
                    : lang === "th"
                      ? "พร้อมซื้อสินค้า"
                      : "Ready to buy"}
                </p>
              </div>
            </div>
          </section>

          <section className="surface-card p-6 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="type-h2">{t("buyerOrders_title")}</h2>
                <p className="mt-1 text-sm text-text-subtle">{t("profile_ordersDesc")}</p>
              </div>
              <Link
                href="/orders"
                className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm font-semibold text-text-main transition-colors hover:border-border-main"
              >
                {t("profile_openOrders")}
              </Link>
            </div>
          </section>

          {isRegisteredSeller && seller ? (
            <section className="surface-card p-6 md:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="type-h2">{t("profile_sellerMetrics")}</h2>
                  <p className="mt-1 text-sm text-text-subtle">{t("profile_sellerDesc")}</p>
                </div>
                <Link
                  href="/seller/dashboard"
                  className="rounded-xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-2.5 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/15"
                >
                  {t("profile_openSeller")}
                </Link>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("profile_shopName")}</p>
                  <p className="mt-2 text-sm font-semibold text-text-main">{seller.shopName}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("wallet_available")}</p>
                  <p className="type-num mt-2 text-xl font-bold text-text-main">฿{seller.balance.toLocaleString("en-US")}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("profile_sales")}</p>
                  <p className="type-num mt-2 text-xl font-bold text-text-main">{formatCompactNumber(seller.salesCount)}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("profile_rating")}</p>
                  <p className="type-num mt-2 text-xl font-bold text-text-main">{seller.rating.toFixed(1)}</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="surface-card p-6 md:p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="type-h2">{t("register_title")}</h2>
                  <p className="mt-1 text-sm text-text-subtle">{t("profile_sellerCtaDesc")}</p>
                </div>
                <Link href="/seller/register">
                  <CTAButton>{t("profile_becomeSeller")}</CTAButton>
                </Link>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {isAdmin ? (
            <section className="surface-card p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-warning">{t("admin_title")}</p>
              <h2 className="type-h2 mt-3">{t("profile_adminAccess")}</h2>
              <p className="mt-2 text-sm text-text-subtle">{t("profile_adminDesc")}</p>
              <Link
                href="/admin/dashboard"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 px-4 text-sm font-semibold text-warning transition-colors hover:bg-warning/15"
              >
                {t("profile_openAdmin")}
              </Link>
            </section>
          ) : null}

          <section className="surface-card p-6">
            <h2 className="type-h2">{t("profile_quickActions")}</h2>
            <div className="mt-4 grid gap-3">
              <Link
                href="/products"
                className="rounded-2xl border border-white/8 bg-bg-surface/70 px-4 py-3 text-sm font-semibold text-text-main transition-colors hover:border-border-main"
              >
                {lang === "th" ? "เลือกซื้อสินค้า" : "Browse products"}
              </Link>
              <Link
                href="/orders"
                className="rounded-2xl border border-white/8 bg-bg-surface/70 px-4 py-3 text-sm font-semibold text-text-main transition-colors hover:border-border-main"
              >
                {t("profile_openOrders")}
              </Link>
              {isRegisteredSeller ? (
                <Link
                  href="/seller/dashboard/settings"
                  className="rounded-2xl border border-white/8 bg-bg-surface/70 px-4 py-3 text-sm font-semibold text-text-main transition-colors hover:border-border-main"
                >
                  {t("settings_title")}
                </Link>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
