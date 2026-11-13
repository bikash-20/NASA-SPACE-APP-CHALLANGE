"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { type Locale, formatNumber, translate } from "./i18n";

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatNumber: (n: number | string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  toggleLocale: () => {},
  t: (key) => key,
  formatNumber: (n) => String(n),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Read saved locale preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("astroguard_locale") as Locale | null;
      if (saved === "en" || saved === "bn") {
        setLocaleState(saved);
      }
    } catch {
      // localStorage may fail in private mode
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("astroguard_locale", newLocale);
    } catch {
      // ignore
    }
  };

  const toggleLocale = () => {
    setLocale(locale === "en" ? "bn" : "en");
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t: (key: string, params?: Record<string, string | number>) =>
        translate(key, locale, params),
      formatNumber: (n: number | string) => formatNumber(n, locale),
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
