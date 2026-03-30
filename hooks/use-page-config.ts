'use client';

import { usePathname } from 'next/navigation';
import { getPageConfig, type PageConfig } from '@/lib/page-registry';
import { useTranslations } from '@/lib/i18n';

/**
 * Returns the page config (title, description, icon) for the current route.
 * Reads from the central page registry in `lib/page-registry.ts`.
 * Translates title and description via the i18n system when a titleKey is present.
 */
export function usePageConfig(): PageConfig {
  const pathname = usePathname();
  const config = getPageConfig(pathname);
  const t = useTranslations('pages');

  if (!config.titleKey) return config;

  const translatedTitle = t(config.titleKey);
  const descKey = config.titleKey + 'Desc';
  const translatedDesc = t(descKey);
  // If the desc key resolves to the key itself, there's no translation — keep original
  const description = translatedDesc !== descKey ? translatedDesc : config.description;

  return {
    ...config,
    title: translatedTitle,
    description,
  };
}
