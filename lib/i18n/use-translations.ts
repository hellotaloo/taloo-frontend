'use client';

import { useCallback } from 'react';
import { useLocale, type TFunction } from './locale-context';

/**
 * Returns a scoped translation function.
 *
 * @example
 * const t = useTranslations('vacancies');
 * t('statusOpen') // → "Open" (resolves "vacancies.statusOpen")
 * t('statusFilled') // → "Ingevuld" or "Filled"
 *
 * Without namespace:
 * const t = useTranslations();
 * t('vacancies.statusOpen') // → "Open"
 */
export function useTranslations(namespace?: string): TFunction {
  const { t } = useLocale();

  return useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return t(fullKey, params);
    },
    [t, namespace],
  );
}
