'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Locale, Dictionary } from './types';
import nl from './dictionaries/nl.json';
import en from './dictionaries/en.json';
import { getWorkspaceSettings } from '@/lib/workspace-settings-api';

const dictionaries: Record<Locale, Dictionary> = { nl, en };

const COOKIE_NAME = 'locale';
const DEFAULT_LOCALE: Locale = 'nl';

function readCookieLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  const val = match?.[1];
  return val === 'en' ? 'en' : 'nl';
}

function writeCookieLocale(locale: Locale) {
  document.cookie = `${COOKIE_NAME}=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

function getWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('workspace_id');
}

/** Resolve a dot-path like "vacancies.statusOpen" from a dictionary */
function resolve(dict: Dictionary, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = dict;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Initialize from cookie for instant render, then sync with backend
  const [locale, setLocaleState] = useState<Locale>(readCookieLocale);

  // Fetch workspace settings on mount to sync locale
  useEffect(() => {
    const workspaceId = getWorkspaceId();
    if (!workspaceId) return;

    getWorkspaceSettings(workspaceId)
      .then((settings) => {
        const wsLocale = settings.language === 'en' ? 'en' : 'nl';
        if (wsLocale !== locale) {
          setLocaleState(wsLocale);
          writeCookieLocale(wsLocale);
          document.documentElement.lang = wsLocale;
        }
      })
      .catch(() => {
        // Silently fall back to cookie/default — API may not be available yet
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeCookieLocale(next);
    document.documentElement.lang = next;
  }, []);

  const t: TFunction = useCallback(
    (key, params) => {
      const value = resolve(dictionaries[locale], key) ?? resolve(dictionaries[DEFAULT_LOCALE], key) ?? key;
      if (!params) return value;
      return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}

/**
 * Translate backend labels that use "key" or "key:param" format.
 * The param after the colon is passed as {name}, {channel}, and {doc} to the t() function.
 */
export function useTranslateBackendLabel() {
  const { t } = useLocale();
  return useCallback(
    (value: string | null | undefined): string => {
      if (!value) return '';
      const colonIdx = value.indexOf(':');
      if (colonIdx === -1) return t(value);
      const key = value.slice(0, colonIdx);
      const param = value.slice(colonIdx + 1);
      return t(key, { name: param, channel: param, doc: param });
    },
    [t],
  );
}
