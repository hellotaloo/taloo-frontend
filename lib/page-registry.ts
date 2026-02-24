/**
 * PAGE REGISTRY
 * =============
 * Central registry for all page configurations in the app.
 *
 * ⚠️  IMPORTANT: When creating a new page, you MUST add it here!
 *
 * This controls the tab title shown in the Header component.
 * Without an entry here, the page will show "Nieuw tabblad" as default.
 *
 * Required steps for new pages:
 * 1. Create `page.tsx` with your component
 * 2. Create `layout.tsx` with metadata (browser tab title)
 * 3. Add entry to this file (Header tab title + icon)
 *
 * @example
 * // Adding a new page at /admin/users:
 * '/admin/users': { title: 'Gebruikers', icon: Users },
 *
 * @example
 * // Adding a dynamic route pattern:
 * { pattern: /^\/admin\/users\/\d+/, config: { title: 'Gebruiker', icon: User } },
 */

import {
  Activity,
  Boxes,
  Briefcase,
  FileCheck,
  FileText,
  GitBranch,
  Inbox,
  LayoutList,
  Mic,
  Phone,
  ScanSearch,
  Settings,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { PencilSquareIcon, BoltIcon } from '@heroicons/react/24/outline';

export type PageConfig = {
  title: string;
  icon: LucideIcon | typeof PencilSquareIcon;
};

/**
 * Static route configurations.
 * Add new pages here with their exact path.
 */
export const pageConfigs: Record<string, PageConfig> = {
  // Main pages
  '/': { title: 'Nieuw gesprek', icon: PencilSquareIcon },
  '/inbox': { title: 'Inbox', icon: Inbox },
  '/overviews': { title: 'Overzichten', icon: LayoutList },
  '/activities': { title: 'Activiteiten', icon: BoltIcon },

  // Pre-screening
  '/pre-screening': { title: 'Pre-screening', icon: Phone },
  '/pre-screening/settings': { title: 'Pre-screening instellingen', icon: Settings },

  // Pre-onboarding
  '/pre-onboarding': { title: 'Pre-onboarding', icon: FileCheck },

  // Other features
  '/insights': { title: 'Pattern Finder', icon: ScanSearch },
  '/finetune': { title: 'Finetune', icon: SlidersHorizontal },

  // Admin section
  '/admin': { title: 'Admin', icon: Settings },
  '/admin/monitor': { title: 'Monitor', icon: Activity },
  '/admin/voice-settings': { title: 'Voice instellingen', icon: Mic },
  '/admin/ontology': { title: 'Ontology', icon: Boxes },
  '/admin/ontology/graph': { title: 'Ontology Graph', icon: GitBranch },

  // Agent settings
  '/agent-settings/voice': { title: 'Voice Agent', icon: Mic },

  // Legacy routes (keep for backwards compatibility)
  '/metrics': { title: 'Pre-screening Metrics', icon: Phone },
  '/knockout-interviews': { title: 'Pre-screening', icon: Phone },
  '/search': { title: 'Zoeken', icon: ScanSearch },
  '/vacatures': { title: 'Vacatures', icon: LayoutList },
  '/kandidaten': { title: 'Kandidaten', icon: LayoutList },
  '/onboarding': { title: 'Onboarding', icon: FileCheck },
};

/**
 * Dynamic route patterns for pages with URL parameters.
 * Patterns are tested in order - first match wins.
 */
export const dynamicRoutes: Array<{ pattern: RegExp; config: PageConfig }> = [
  // Pre-screening dynamic routes
  { pattern: /^\/pre-screening\/detail\//, config: { title: 'Pre-screening', icon: Phone } },
  { pattern: /^\/pre-screening\/view\//, config: { title: 'Pre-screening', icon: Phone } },
  { pattern: /^\/pre-screening\/generate\//, config: { title: 'Pre-screening', icon: Phone } },

  // Interview routes
  { pattern: /^\/interviews\/generate\//, config: { title: 'Interview vragen', icon: Phone } },

  // Pre-onboarding dynamic routes
  { pattern: /^\/pre-onboarding\/detail\//, config: { title: 'Pre-onboarding', icon: FileCheck } },
  { pattern: /^\/pre-onboarding\/generate\//, config: { title: 'Pre-onboarding', icon: FileCheck } },

];

/**
 * Default config shown when no match is found.
 * If you see this in the UI, a page is missing from the registry!
 */
export const defaultPageConfig: PageConfig = {
  title: 'Nieuw tabblad',
  icon: FileText,
};

/**
 * Get the page configuration for a given pathname.
 * Checks exact matches first, then dynamic patterns.
 */
export function getPageConfig(pathname: string): PageConfig {
  // Check exact match first
  if (pageConfigs[pathname]) {
    return pageConfigs[pathname];
  }

  // Check for dynamic routes
  for (const { pattern, config } of dynamicRoutes) {
    if (pattern.test(pathname)) {
      return config;
    }
  }

  return defaultPageConfig;
}
