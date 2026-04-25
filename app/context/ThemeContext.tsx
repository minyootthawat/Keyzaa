"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

export type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeProviderInner({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setTheme: setNextTheme } = useNextTheme();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentTheme = (mounted ? (resolvedTheme === "light" ? "light" : "dark") : "dark") as Theme;

  const setTheme = (t: Theme) => {
    setNextTheme(t);
  };

  const toggleTheme = () => {
    setNextTheme(currentTheme === "dark" ? "light" : "dark");
  };

  const value = useMemo<ThemeContextType>(
    () => ({ theme: currentTheme, setTheme, toggleTheme }),
    [currentTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ThemeProviderInner>{children}</ThemeProviderInner>
    </NextThemesProvider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
