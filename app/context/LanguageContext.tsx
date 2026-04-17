"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations, type TranslationKey } from "@/app/i18n/translations";

type Language = "th" | "en";

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  tr: (th: string, en: string) => string;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window === "undefined") return "th";
    const saved = localStorage.getItem("keyzaa_lang");
    return saved === "en" ? "en" : "th";
  });

  useEffect(() => {
    localStorage.setItem("keyzaa_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LanguageContextType>(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang((prev) => (prev === "th" ? "en" : "th")),
      tr: (th, en) => (lang === "th" ? th : en),
      t: (key) => translations[lang][key],
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
