"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CTAButton from "@/app/components/CTAButton";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function AdminLoginPage() {
  const { user, isAdmin, adminRole, adminPermissions, loading, login, logout } = useAuth();
  const { lang, t } = useLanguage();
  const router = useRouter();
  const demoAdminEmail = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || "admin@demo.keyzaa.local";
  const demoAdminPassword = process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || "demo123";
  const [email, setEmail] = useState(demoAdminEmail);
  const [password, setPassword] = useState(demoAdminPassword);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAdmin) {
      router.replace("/backoffice/dashboard");
    }
  }, [isAdmin, loading, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      window.setTimeout(() => {
        router.replace("/backoffice/dashboard");
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : lang === "th" ? "เข้าสู่ระบบไม่สำเร็จ" : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setSubmitting(true);

    try {
      await logout();
      setError("");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="section-container py-8 md:py-12">
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-warning border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="section-container py-8 md:py-12">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px]">
        <section className="rounded-[2rem] border border-warning/15 bg-[linear-gradient(145deg,rgba(36,27,13,0.82),rgba(10,14,26,0.98))] p-6 shadow-[0_28px_80px_rgba(5,10,24,0.34)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warning">
            {lang === "th" ? "Backoffice Systems" : "Backoffice Systems"}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-text-main md:text-5xl">
            {lang === "th" ? "พื้นที่ทำงานสำหรับควบคุมตลาดทั้งระบบ" : "A workspace for controlling the full marketplace system"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-text-subtle md:text-base">
            {lang === "th"
              ? "รีแฟกเตอร์หลังบ้านชุดนี้รวมภาพรวมแพลตฟอร์ม ออเดอร์ สินค้า และผู้ขายให้อยู่ในโครงเดียวกัน เพื่อให้ทีมแอดมินเห็นสัญญาณสำคัญเร็วและทำงานต่อได้ทันที"
              : "This refactored backoffice unifies platform overview, orders, listings, and seller oversight so the admin team can act on the right signals faster."}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: lang === "th" ? "Order operations" : "Order operations",
                description: lang === "th" ? "ติดตามการจ่ายเงิน การส่งมอบ และข้อพิพาท" : "Track payments, fulfillment, and disputes",
              },
              {
                title: lang === "th" ? "Catalog governance" : "Catalog governance",
                description: lang === "th" ? "เห็นสต็อก ราคา และสถานะ active ของสินค้า" : "See stock, pricing, and listing activity",
              },
              {
                title: lang === "th" ? "Seller oversight" : "Seller oversight",
                description: lang === "th" ? "ตรวจสอบร้านค้าที่ต้องติดตามหรือยืนยันเพิ่ม" : "Review sellers that need attention or verification",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                <h2 className="font-semibold text-text-main">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-text-subtle">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-bg-surface/86 p-6 shadow-[0_24px_70px_rgba(5,10,24,0.24)] md:p-8">
          <div className="mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-warning/20 bg-warning/10 text-warning">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3h16.5v4.5H3.75zM3.75 9.75h7.5v10.5h-7.5zM13.5 9.75h6.75v4.5H13.5zM13.5 16.5h6.75v3.75H13.5z" />
              </svg>
            </div>
            <h2 className="type-h1 mt-4">{t("admin_loginTitle")}</h2>
            <p className="mt-2 text-sm leading-6 text-text-subtle">{t("admin_loginDesc")}</p>
          </div>

          {user && !isAdmin ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-danger/20 bg-danger/10 p-4">
                <p className="text-sm font-semibold text-danger">{t("admin_accessDenied")}</p>
                <p className="mt-2 text-sm text-text-subtle">
                  {lang === "th"
                    ? `บัญชี ${user.email} ไม่มีสิทธิ์เข้าใช้งานแอดมิน`
                    : `The account ${user.email} does not have admin access.`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-danger/20 bg-danger/10 text-sm font-semibold text-danger transition-colors hover:bg-danger/15 disabled:opacity-50"
              >
                {submitting ? "..." : t("auth_logout")}
              </button>
              <Link
                href="/"
                className="flex h-11 items-center justify-center rounded-xl border border-border-subtle bg-bg-surface text-sm font-semibold text-text-main transition-colors hover:border-border-main"
              >
                {t("admin_backToStorefront")}
              </Link>
            </div>
          ) : (
            <>
              {user && isAdmin ? (
                <div className="mb-4 rounded-2xl border border-warning/20 bg-warning/10 p-4">
                  <p className="text-sm font-semibold text-warning">{t("admin_rbacGranted")}</p>
                  <p className="mt-2 text-sm text-text-subtle">
                    {lang === "th"
                      ? `สิทธิ์ปัจจุบัน: ${adminRole || "super_admin"} • ${adminPermissions.join(", ")}`
                      : `Current role: ${adminRole || "super_admin"} • ${adminPermissions.join(", ")}`}
                  </p>
                </div>
              ) : null}

              <div className="mb-4 rounded-2xl border border-white/8 bg-bg-base/55 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                  {lang === "th" ? "บัญชีแอดมินเดโม" : "Demo admin account"}
                </p>
                <div className="mt-3 space-y-1 text-sm text-text-subtle">
                  <p>{demoAdminEmail}</p>
                  <p>{demoAdminPassword}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-subtle">{t("auth_email")}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full rounded-xl border border-border-subtle bg-bg-base/60 px-4 py-3 text-sm text-text-main focus:border-warning focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-subtle">{t("auth_password")}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="w-full rounded-xl border border-border-subtle bg-bg-base/60 px-4 py-3 text-sm text-text-main focus:border-warning focus:outline-none"
                  />
                </div>

                {error ? <p className="text-xs font-semibold text-danger">{error}</p> : null}

                <CTAButton type="submit" fullWidth className="h-11">
                  {submitting ? "..." : t("admin_loginCta")}
                </CTAButton>
              </form>

              <div className="mt-4 text-center">
                {user && isAdmin ? (
                  <Link href="/backoffice/dashboard" className="text-sm font-semibold text-warning transition-colors hover:text-warning/80">
                    {t("admin_loginCta")}
                  </Link>
                ) : (
                  <Link href="/" className="text-sm font-semibold text-text-subtle transition-colors hover:text-text-main">
                    {t("admin_backToStorefront")}
                  </Link>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
