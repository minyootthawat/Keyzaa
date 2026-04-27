"use client";

import { useState } from "react";
import Link from "next/link";
import CTAButton from "@/app/components/CTAButton";
import { useLanguage } from "@/app/context/LanguageContext";

export default function AdminLoginPage() {
  const { lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (lang === "th" ? "เข้าสู่ระบบไม่สำเร็จ" : "Login failed"));
      }
      window.location.href = "/backoffice/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : lang === "th" ? "เข้าสู่ระบบไม่สำเร็จ" : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

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
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                {lang === "th" ? "อีเมล" : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-form"
                placeholder="admin@keyzaa.local"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                {lang === "th" ? "รหัสผ่าน" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-form"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <CTAButton
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting
                ? lang === "th"
                  ? "กำลังเข้าสู่ระบบ..."
                  : "Logging in..."
                : lang === "th"
                ? "เข้าสู่ระบบ"
                : "Login"}
            </CTAButton>
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
