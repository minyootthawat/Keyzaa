"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import CTAButton from "@/app/components/CTAButton";

interface AuthDialogProps {
  onClose: () => void;
}

export default function AuthDialog({ onClose }: AuthDialogProps) {
  const { user, role, isRegisteredSeller, isAdmin, login, register, logout } = useAuth();
  const { t, lang } = useLanguage();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    {
      id: "buyer",
      label: lang === "th" ? "บัญชีเดโมผู้ซื้อ" : "Demo buyer",
      description: lang === "th" ? "ใช้ทดสอบเส้นทางซื้อสินค้าและคำสั่งซื้อ" : "Use for storefront and order-flow testing",
      email: process.env.NEXT_PUBLIC_DEMO_BUYER_EMAIL || "testbuyer@keyzaa.local",
      password: process.env.NEXT_PUBLIC_DEMO_BUYER_PASSWORD || "demo123",
    },
    {
      id: "seller",
      label: lang === "th" ? "บัญชีเดโมผู้ขาย" : "Demo seller",
      description: lang === "th" ? "ใช้เข้าหน้า seller register และ dashboard" : "Use for seller register and dashboard testing",
      email: process.env.NEXT_PUBLIC_DEMO_SELLER_EMAIL || "testseller@keyzaa.local",
      password: process.env.NEXT_PUBLIC_DEMO_SELLER_PASSWORD || "demo123",
    },
    {
      id: "admin",
      label: lang === "th" ? "บัญชีเดโมแอดมิน" : "Demo admin",
      description: lang === "th" ? "ใช้เข้าหน้า admin dashboard" : "Use for admin dashboard testing",
      email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || "admin@keyzaa.local",
      password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || "demo123",
    },
  ] as const;

  const applyDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setMode("login");
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative surface-card glass-panel w-full max-w-sm p-6 m-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-muted hover:text-text-main transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="type-h2">
            {mode === "login" ? t("auth_login") : t("register_title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-subtle">
            {mode === "login"
              ? lang === "th"
                ? "บัญชีเดียวใช้ได้ทั้งการซื้อสินค้าและการเข้าร่วมเป็นผู้ขายในมาร์เก็ตเพลส"
                : "One account works for both buying and joining the marketplace as a seller."
              : lang === "th"
                ? "สร้างบัญชีผู้ใช้ก่อน แล้วค่อยสร้างโปรไฟล์ร้านค้าในขั้นตอนถัดไป"
                : "Create your buyer account first, then add your seller profile in the marketplace onboarding step."}
          </p>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-main">{(user as {name?: string})?.name ?? "User"}</p>
                  <p className="mt-1 text-xs text-text-muted">{user.email}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                  {((user as {name?: string})?.name ?? "").charAt(0).toUpperCase() || "?"}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-border-subtle bg-bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle">
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

            <div className="grid gap-2">
              <a
                href="/profile"
                className="flex h-11 items-center justify-center rounded-xl border border-border-subtle bg-bg-surface text-sm font-semibold text-text-main transition-colors hover:border-border-main"
              >
                {lang === "th" ? "เปิดหน้าโปรไฟล์" : "Open profile"}
              </a>
              {isRegisteredSeller ? (
                <a
                  href="/seller/dashboard"
                  className="flex h-11 items-center justify-center rounded-xl border border-border-subtle bg-bg-surface text-sm font-semibold text-text-main transition-colors hover:border-border-main"
                >
                  {lang === "th" ? "ไปหน้าแดชบอร์ดผู้ขาย" : "Open seller dashboard"}
                </a>
              ) : null}
              {(role === "seller" || role === "both") && !isRegisteredSeller ? (
                <a
                  href="/seller/onboarding"
                  className="flex h-11 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-sm font-semibold text-accent transition-colors hover:bg-accent/15"
                >
                  {lang === "th" ? "สมัครเป็นผู้ขาย" : "Become a seller"}
                </a>
              ) : null}
              {isAdmin ? (
                <a
                  href="/backoffice/dashboard"
                  className="flex h-11 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-sm font-semibold text-warning transition-colors hover:bg-warning/15"
                >
                  {lang === "th" ? "ไปหน้าแอดมิน" : "Open admin dashboard"}
                </a>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="flex h-11 items-center justify-center rounded-xl border border-danger/20 bg-danger/10 text-sm font-semibold text-danger transition-colors hover:bg-danger/15 disabled:opacity-50"
              >
                {loading ? "..." : t("auth_logout")}
              </button>
            </div>
          </div>
        ) : (
          <>
            {mode === "login" && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                  {lang === "th" ? "บัญชีเดโม" : "Demo accounts"}
                </p>
                <div className="grid gap-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => applyDemoCredentials(account.email, account.password)}
                      className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3 text-left transition-colors hover:border-brand-primary/30 hover:bg-bg-surface"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-main">{account.label}</p>
                          <p className="mt-1 text-xs text-text-muted">{account.description}</p>
                        </div>
                        <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
                          {lang === "th" ? "เติมอัตโนมัติ" : "Auto-fill"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-subtle">
                        <span>{account.email}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-subtle">{t("auth_name")}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === "th" ? "ชื่อของคุณ" : "Your name"}
                    className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
                    required={mode === "register"}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-subtle">{t("auth_email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-subtle">{t("auth_password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-danger font-semibold">{error}</p>
              )}

              <CTAButton type="submit" fullWidth className="h-11" disabled={loading} data-testid="auth-submit-btn">
                {loading ? "..." : mode === "login" ? t("auth_login") : t("register_submit")}
              </CTAButton>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                }}
                className="text-xs text-text-muted hover:text-brand-primary transition-colors"
              >
                {mode === "login"
                  ? `${t("auth_noAccount")} ${t("register_title")}`
                  : `${t("auth_hasAccount")} ${t("auth_login")}`}
              </button>
              {mode === "login" ? (
                <p className="mt-3 text-xs leading-5 text-text-muted">
                  {lang === "th"
                    ? "ต้องการขายสินค้า? เข้าสู่ระบบแล้วไปที่หน้าสมัครผู้ขายเพื่อเข้าร่วมมาร์เก็ตเพลส"
                    : "Want to sell? Sign in, then open seller onboarding to join the marketplace."}
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
