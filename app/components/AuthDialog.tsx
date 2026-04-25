"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
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
      email: process.env.NEXT_PUBLIC_DEMO_BUYER_EMAIL || "buyer@demo.keyzaa.local",
      password: process.env.NEXT_PUBLIC_DEMO_BUYER_PASSWORD || "demo123",
    },
    {
      id: "seller",
      label: lang === "th" ? "บัญชีเดโมผู้ขาย" : "Demo seller",
      description: lang === "th" ? "ใช้เข้าหน้า seller register และ dashboard" : "Use for seller register and dashboard testing",
      email: process.env.NEXT_PUBLIC_DEMO_SELLER_EMAIL || "seller@demo.keyzaa.local",
      password: process.env.NEXT_PUBLIC_DEMO_SELLER_PASSWORD || "demo123",
    },
    {
      id: "admin",
      label: lang === "th" ? "บัญชีเดโมแอดมิน" : "Demo admin",
      description: lang === "th" ? "ใช้เข้าหน้า admin dashboard" : "Use for admin dashboard testing",
      email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || "admin@demo.keyzaa.local",
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

  const handleSocialSignIn = async (provider: "google" | "facebook" | "line") => {
    setLoading(true);
    await signIn(provider, { callbackUrl: "/" });
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
                  <p className="text-sm font-semibold text-text-main">{user.name}</p>
                  <p className="mt-1 text-xs text-text-muted">{user.email}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
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

        <div className="space-y-2 mb-4">
          <button
            onClick={() => handleSocialSignIn("google")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-white hover:bg-gray-100 text-gray-700 font-medium text-sm transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button
            onClick={() => handleSocialSignIn("facebook")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
          <button
            onClick={() => handleSocialSignIn("line")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-[#00B900] hover:bg-[#00A000] text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61c-.35 0-.631-.285-.631-.63 0-.346.281-.631.63-.631h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.249l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.353c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.198 0 .379.09.498.249l2.462 3.329V8.31c0-.345.285-.63.63-.63.345 0 .63.285.63.63v4.569h-.003zm-2.547-4.425c-.163 0-.301-.031-.426-.088-.113-.057-.195-.133-.257-.227a.465.465 0 0 1-.073-.288c0-.166.12-.31.274-.398.042-.02.09-.033.134-.033.054 0 .107.012.16.033.068.026.138.075.191.14.07.075.117.183.117.306a.46.46 0 0 1-.038.21.486.486 0 0 1-.162.157l-.352.223a.491.491 0 0 1-.191.074h-.039c-.034 0-.063-.003-.099-.01a.563.563 0 0 1-.098-.022.503.503 0 0 1-.098-.041.44.44 0 0 1-.064-.054l-.064-.054-.055-.055-.06-.06-.077-.076a2.094 2.094 0 0 1-.157-.245c-.019-.047-.028-.097-.037-.147l-.013-.073c-.01-.05-.012-.1-.008-.15.002-.048.014-.097.034-.144.031-.067.088-.123.188-.153.1-.029.24-.04.394-.04.071 0 .14.01.203.028.067.022.124.059.173.115.043.051.065.126.065.225v.02l.002.012c.002.007.005.015.008.022l.007.018c.004.01.007.02.012.03l.022.055c.01.02.02.04.033.058l.031.051c.027.042.057.08.09.114l.049.048c.014.012.031.024.053.037l.066.046c.053.035.12.07.19.101.038.017.076.032.114.046a.62.62 0 0 0 .102.031c.012.003.023.007.037.008l.03.006h.02l.038.002h.011c.012 0 .023-.002.037-.004.02 0 .037-.003.055-.008l.051-.012c.037-.01.072-.02.107-.035l.053-.022c.016-.007.033-.017.05-.026.037-.02.071-.041.104-.063l.033-.022a.484.484 0 0 0 .055-.04c.034-.029.063-.06.088-.092a.47.47 0 0 0 .067-.083c.014-.024.026-.05.035-.078l.02-.054c.007-.022.01-.045.011-.068l.002-.03v-.01a.49.49 0 0 0-.006-.06l-.01-.038-.01-.026a.356.356 0 0 0-.02-.044l-.02-.037-.024-.04a.482.482 0 0 0-.031-.044c-.011-.013-.024-.026-.038-.04l-.043-.044c-.035-.034-.073-.065-.114-.094l-.055-.038a.612.612 0 0 0-.108-.064l-.039-.02a.488.488 0 0 0-.052-.022l-.028-.01c-.018-.006-.038-.011-.059-.014a.564.564 0 0 0-.062-.01.506.506 0 0 0-.064-.003l-.028.002zm-.767-1.21c-.075 0-.151-.006-.23-.019a.86.86 0 0 1-.223-.065.482.482 0 0 1-.167-.153.41.41 0 0 1-.051-.207c0-.086.02-.168.06-.24.038-.073.102-.136.19-.188.084-.051.198-.079.331-.079.045 0 .09.003.136.01.048.007.09.02.131.038l.016.006c.018.009.035.016.051.026.045.026.086.057.121.094.016.018.03.036.042.057l.019.034c.007.015.013.031.016.048l.01.035c.004.018.007.036.007.056 0 .021-.003.043-.01.064l-.004.014-.007.03c-.003.014-.007.026-.012.038l-.016.034-.032.059-.041.051a.476.476 0 0 1-.107.097.506.506 0 0 1-.128.071l-.024.009c-.017.005-.034.009-.051.013a.563.563 0 0 1-.056.01.582.582 0 0 1-.06.005h-.02c-.015 0-.03 0-.044-.003a.45.45 0 0 1-.039-.006l-.038-.008a.432.432 0 0 1-.033-.008l-.033-.01a.45.45 0 0 1-.029-.011l-.028-.012a.472.472 0 0 1-.025-.013l-.025-.015-.022-.014-.023-.016a.492.492 0 0 1-.021-.016l-.02-.018-.018-.017-.018-.019-.015-.017a.51.51 0 0 1-.015-.02c-.004-.005-.007-.011-.01-.016l-.013-.019a.462.462 0 0 1-.01-.015c-.004-.007-.008-.014-.01-.022a.483.483 0 0 1-.008-.021l-.008-.023-.007-.022a.488.488 0 0 1-.005-.02v-.007l-.003-.01c-.002-.007-.002-.013-.003-.02l-.002-.012a.489.489 0 0 1-.001-.019v-.017l.002-.021c0-.006.002-.012.004-.018l.006-.028c.003-.012.006-.022.01-.033l.013-.033c.005-.01.01-.021.016-.03l.02-.033.025-.036c.03-.038.066-.072.107-.102l.028-.019a.62.62 0 0 1 .121-.061c.013-.005.026-.01.04-.013.023-.007.046-.012.07-.015.022-.004.046-.006.068-.007a.58.58 0 0 1 .075-.002c.068 0 .134.007.197.02a.468.468 0 0 1 .175.09l.039.036.025.03c.015.02.027.044.038.069l.016.044c.004.015.007.03.01.046.002.016.003.032.003.049 0 .03-.006.059-.018.086a.41.41 0 0 1-.054.076.42.42 0 0 1-.077.057.468.468 0 0 1-.199.05l-.038-.001z"/>
            </svg>
            LINE
          </button>
        </div>

        <div className="relative flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="text-xs text-text-muted">or</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {mode === "login" ? (
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
                    <span>{account.password}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-subtle">{t("auth_name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อของคุณ"
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
