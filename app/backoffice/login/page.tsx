"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { useState, useEffect, useRef } from "react";

export default function AdminLoginPage() {
  const { lang } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [shimmer, setShimmer] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setMounted(true);
    setShimmer(true);
    const timer = setTimeout(() => setShimmer(false), 1500);
    return () => clearTimeout(timer);
  }, []);

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

      window.location.href = "/backoffice/dashboard";
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      {/* Ambient background effects */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="gradient-orb gradient-orb-1" />
        <div className="gradient-orb gradient-orb-2" />
        <div className="noise-overlay" />
      </div>

      {/* Geometric grid pattern */}
      <div className="grid-pattern" aria-hidden="true" />

      {/* Floating accent elements */}
      <div className="floating-elements" aria-hidden="true">
        <div className="float-card float-card-1">
          <div className="card-dot card-dot-green" />
          <span>SYSTEMS ONLINE</span>
        </div>
        <div className="float-card float-card-2">
          <div className="card-line" />
          <div className="card-line card-line-short" />
        </div>
        <div className="float-card float-card-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
      </div>

      {/* Main content */}
      <div className={`login-wrapper ${mounted ? "mounted" : ""}`}>
        {/* Header accent */}
        <div className="header-accent">
          <div className="header-line" />
          <span className="header-text">ADMIN CONTROL CENTER</span>
          <div className="header-line" />
        </div>

        {/* Main card */}
        <div className="login-card">
          {/* Card glow effect */}
          <div className="card-glow" />

          {/* Status indicator */}
          <div className="status-badge">
            <div className="status-pulse" />
            <span>{lang === "th" ? "การเชื่อมต่อที่ปลอดภัย" : "SECURE"}</span>
          </div>

          {/* Shield icon */}
          <div className="shield-section">
            <div className="shield-bg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="title-section">
            <h1 className="login-title">
              {lang === "th" ? "เข้าสู่ระบบแอดมิน" : "Welcome Back"}
            </h1>
            <p className="login-subtitle">
              {lang === "th"
                ? "เข้าถึงแดชบอร์ดผู้ดูแลระบบ"
                : "Sign in to access the admin dashboard"}
            </p>
          </div>

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className={`form-group ${focusedField === "email" ? "focused" : ""}`}>
              <label htmlFor="email" className="form-label">
                {lang === "th" ? "อีเมล" : "Email Address"}
              </label>
              <div className="input-container">
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  className="form-input"
                  placeholder={lang === "th" ? "admin@keyzaa.local" : "admin@keyzaa.local"}
                  defaultValue=""
                  required
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            <div className={`form-group ${focusedField === "password" ? "focused" : ""}`}>
              <label htmlFor="password" className="form-label">
                {lang === "th" ? "รหัสผ่าน" : "Password"}
              </label>
              <div className="input-container">
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="form-input"
                  placeholder="••••••••"
                  defaultValue=""
                  required
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              <span className="button-content">
                {loading ? (
                  <>
                    <span className="button-spinner" />
                    <span>{lang === "th" ? "กำลังเข้าสู่ระบบ..." : "Signing in..."}</span>
                  </>
                ) : (
                  <>
                    <span>{lang === "th" ? "เข้าสู่ระบบ" : "Sign In"}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Demo hint */}
          <div className="demo-hint">
            <div className="hint-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div className="hint-content">
              <span className="hint-label">{lang === "th" ? "ดีโม" : "Demo"}</span>
              <span className="hint-credentials">admin@keyzaa.local / demo123</span>
            </div>
          </div>

          {/* Footer link */}
          <div className="footer-link">
            <a href="/" className="link-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span>{lang === "th" ? "กลับหน้าแรก" : "Back to Home"}</span>
            </a>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="bottom-accent">
          <span>© 2026 KEYZAA</span>
          <span className="accent-sep">·</span>
          <span>{lang === "th" ? "ระบบทั้งหมดถูกเฝ้าระวัง" : "All systems monitored"}</span>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Geist+Sans:wght@400;500;600;700&display=swap');

        .login-root {
          --bg-primary: #09090b;
          --bg-surface: #18181b;
          --bg-elevated: #27272a;
          --border-subtle: rgba(255, 255, 255, 0.1);
          --border-main: rgba(255, 255, 255, 0.15);
          --primary: #6366f1;
          --primary-hover: #818cf8;
          --primary-glow: rgba(99, 102, 241, 0.25);
          --success: #22c55e;
          --error: #ef4444;
          --text-primary: #fafafa;
          --text-secondary: #a1a1aa;
          --text-muted: #71717a;

          position: relative;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          overflow: hidden;
          font-family: 'Inter', 'Geist Sans', system-ui, sans-serif;
        }

        /* Ambient Background */
        .ambient-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.5;
        }

        .gradient-orb-1 {
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
          top: -300px;
          left: -200px;
          animation: orb-float-1 25s ease-in-out infinite;
        }

        .gradient-orb-2 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
          bottom: -200px;
          right: -100px;
          animation: orb-float-2 30s ease-in-out infinite;
        }

        @keyframes orb-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(80px, 60px) scale(1.1); }
          66% { transform: translate(-40px, 100px) scale(0.95); }
        }

        @keyframes orb-float-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-60px, -40px); }
        }

        .noise-overlay {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
        }

        /* Grid Pattern */
        .grid-pattern {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Floating Elements */
        .floating-elements {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .float-card {
          position: absolute;
          background: rgba(24, 24, 27, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 12px 16px;
        }

        .float-card-1 {
          top: 15%;
          right: 8%;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          animation: float-drift 20s ease-in-out infinite;
        }

        .card-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .card-dot-green {
          background: var(--success);
          box-shadow: 0 0 12px var(--success);
          animation: dot-pulse 2s ease-in-out infinite;
        }

        @keyframes dot-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .float-card-2 {
          bottom: 25%;
          left: 6%;
          width: 100px;
          animation: float-drift 25s ease-in-out infinite reverse;
        }

        .card-line {
          height: 3px;
          background: linear-gradient(90deg, var(--primary), transparent);
          border-radius: 2px;
          margin-bottom: 8px;
        }

        .card-line-short {
          width: 60%;
        }

        .float-card-3 {
          top: 35%;
          left: 10%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          animation: float-drift 18s ease-in-out infinite;
        }

        .float-card-3 svg {
          width: 24px;
          height: 24px;
        }

        @keyframes float-drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -15px) rotate(1deg); }
          50% { transform: translate(-5px, -25px) rotate(-1deg); }
          75% { transform: translate(-15px, -10px) rotate(0.5deg); }
        }

        /* Login Wrapper */
        .login-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          padding: 24px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 600ms cubic-bezier(0.22, 1, 0.36, 1),
                      transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .login-wrapper.mounted {
          opacity: 1;
          transform: translateY(0);
        }

        /* Header Accent */
        .header-accent {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 32px;
          animation: header-reveal 500ms ease 100ms both;
        }

        @keyframes header-reveal {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .header-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border-main), transparent);
        }

        .header-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: var(--text-muted);
          white-space: nowrap;
        }

        /* Login Card */
        .login-card {
          position: relative;
          background: rgba(24, 24, 27, 0.8);
          backdrop-filter: blur(24px);
          border: 1px solid var(--border-subtle);
          border-radius: 24px;
          padding: 40px 32px;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.03) inset,
            0 25px 50px -12px rgba(0, 0, 0, 0.6),
            0 0 80px -20px var(--primary-glow);
          animation: card-reveal 600ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both;
          overflow: hidden;
        }

        @keyframes card-reveal {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .card-glow {
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          width: 300px;
          height: 200px;
          background: radial-gradient(ellipse, var(--primary-glow) 0%, transparent 70%);
          pointer-events: none;
          opacity: 0.6;
        }

        /* Status Badge */
        .status-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 100px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: var(--success);
          animation: badge-pulse 3s ease-in-out infinite;
        }

        @keyframes badge-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .status-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 8px var(--success);
        }

        /* Shield Section */
        .shield-section {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .shield-bg {
          position: relative;
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
          border-radius: 20px;
          box-shadow:
            0 8px 24px -4px var(--primary-glow),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        }

        .shield-bg svg {
          width: 36px;
          height: 36px;
          color: white;
        }

        /* Title Section */
        .title-section {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-title {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin: 0 0 8px;
          line-height: 1.2;
        }

        .login-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          margin: 0;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: var(--error);
          font-size: 13px;
          animation: error-appear 300ms ease;
        }

        @keyframes error-appear {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .error-alert svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: color 200ms ease;
        }

        .form-group.focused .form-label {
          color: var(--primary);
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          width: 20px;
          height: 20px;
          color: var(--text-muted);
          transition: color 200ms ease;
          pointer-events: none;
        }

        .input-icon svg {
          width: 100%;
          height: 100%;
        }

        .form-group.focused .input-icon {
          color: var(--primary);
        }

        .form-input {
          width: 100%;
          padding: 14px 14px 14px 46px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          font-family: inherit;
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: all 200ms ease;
        }

        .form-input::placeholder {
          color: var(--text-muted);
        }

        .form-input:focus {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }

        /* Submit Button */
        .submit-button {
          position: relative;
          width: 100%;
          padding: 16px 24px;
          margin-top: 8px;
          background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
          border: none;
          border-radius: 14px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          overflow: hidden;
          transition: all 200ms ease;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -4px var(--primary-glow);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .button-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .button-content svg {
          width: 18px;
          height: 18px;
          transition: transform 200ms ease;
        }

        .submit-button:hover:not(:disabled) .button-content svg {
          transform: translateX(4px);
        }

        .button-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 600ms linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Demo Hint */
        .demo-hint {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 28px;
          padding: 16px;
          background: rgba(99, 102, 241, 0.05);
          border: 1px dashed rgba(99, 102, 241, 0.2);
          border-radius: 14px;
        }

        .hint-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 10px;
          color: var(--primary);
          flex-shrink: 0;
        }

        .hint-icon svg {
          width: 20px;
          height: 20px;
        }

        .hint-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hint-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .hint-credentials {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          font-variant-numeric: tabular-nums;
        }

        /* Footer Link */
        .footer-link {
          margin-top: 24px;
          text-align: center;
        }

        .link-inner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 200ms ease;
        }

        .link-inner:hover {
          color: var(--primary);
        }

        .link-inner svg {
          width: 16px;
          height: 16px;
        }

        /* Bottom Accent */
        .bottom-accent {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-top: 32px;
          font-size: 11px;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          animation: footer-appear 500ms ease 400ms both;
        }

        @keyframes footer-appear {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .accent-sep {
          opacity: 0.5;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .login-wrapper {
            padding: 16px;
          }

          .login-card {
            padding: 32px 24px;
          }

          .login-title {
            font-size: 24px;
          }

          .floating-elements {
            display: none;
          }

          .header-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
