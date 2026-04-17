"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function ModeToggle() {
  const { isRegisteredSeller, isSellerMode, toggleSellerMode } = useAuth();
  const { t } = useLanguage();

  if (!isRegisteredSeller) return null;

  return (
    <button
      onClick={toggleSellerMode}
      className="flex items-center gap-2 rounded-xl bg-bg-surface/85 px-3 py-2 text-xs font-semibold text-text-subtle transition-all hover:bg-bg-surface-hover"
      title={t("auth_switchMode")}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      <span className="hidden sm:inline">
        {isSellerMode ? t("auth_modeBuyer") : t("auth_modeSeller")}
      </span>
    </button>
  );
}
