"use client";

import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Login failed");
        setLoading(false);
        return;
      }

      // On success, do a hard navigation so the server sets the cookie
      window.location.href = "/backoffice/dashboard";
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  return (
    <div className="section-container py-8 md:py-12">
      <div className="mx-auto max-w-md">
        <div className="surface-card glass-panel p-6 md:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-warning/20 bg-warning/10 text-warning">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-text-primary">
              {lang === "th" ? "เข้าสู่ระบบแอดมิน" : "Admin Login"}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {lang === "th" ? "เข้าถึงแดชบอร์ดผู้ดูแลระบบ" : "Access the admin dashboard"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-primary">
                {lang === "th" ? "อีเมล" : "Email"}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                className="input-form"
                placeholder=""
                defaultValue=""
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text-primary">
                {lang === "th" ? "รหัสผ่าน" : "Password"}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="input-form"
                placeholder=""
                defaultValue=""
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading
                ? (lang === "th" ? "กำลังเข้าสู่ระบบ..." : "Logging in...")
                : (lang === "th" ? "เข้าสู่ระบบ" : "Login")}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/5 p-3 text-xs text-warning">
            <span>🔑</span>
            <span>
              {lang === "th"
                ? "ดีโม: admin@keyzaa.local / demo123"
                : "Demo: admin@keyzaa.local / demo123"}
            </span>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-text-secondary hover:text-warning">
              ← {lang === "th" ? "กลับหน้าแรก" : "Back to home"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
