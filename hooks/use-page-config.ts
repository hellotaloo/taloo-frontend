'use client';

import { usePathname } from 'next/navigation';
import { getPageConfig, type PageConfig } from '@/lib/page-registry';

/**
 * Returns the page config (title, description, icon) for the current route.
 * Reads from the central page registry in `lib/page-registry.ts`.
 */
export function usePageConfig(): PageConfig {
  const pathname = usePathname();
  return getPageConfig(pathname);
}
