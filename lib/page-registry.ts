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
  Boxes,
  Briefcase,
  Building2,
  FileCheck,
  FileText,
  History,
  Inbox,
  Kanban,
  LayoutDashboard,
  LayoutList,
  Mic,
  Phone,
  Play,
  Plug,
  ScanSearch,
  Settings,
  Users,
  Activity,
  type LucideIcon,
} from 'lucide-react';
export type PageConfig = {
  title: string;
  description?: string;
  icon: LucideIcon;
};

/**
 * Static route configurations.
 * Add new pages here with their exact path.
 */
export const pageConfigs: Record<string, PageConfig> = {
  // Main pages
  '/': { title: 'Dashboard', description: 'Overzicht van agent activiteiten en prestaties', icon: LayoutDashboard },
  '/inbox': { title: 'Inbox', icon: Inbox },
  '/views': { title: 'Views', description: 'Bekijk en beheer al je gegevens', icon: LayoutList },
  '/views/vacancies': { title: 'Vacatures', description: 'Bekijk en beheer al je vacatures', icon: Briefcase },
  '/views/candidates': { title: 'Kandidaten', description: 'Bekijk en beheer al je kandidaten', icon: Users },
  '/views/pipelines': { title: 'Pipelines', description: 'Overzicht van alle actieve sollicitaties per fase', icon: Kanban },
  '/views/customers': { title: 'Klanten', description: 'Bekijk en beheer al je klanten', icon: Building2 },
  '/activities': { title: 'Activiteiten', description: 'Status van alle lopende en afgeronde agent activiteiten', icon: Activity },
  '/agents': { title: 'Agents', description: 'Ontdek en activeer AI agents voor je workspace', icon: Boxes },

  // Pre-screening
  '/pre-screening': { title: 'Pre-screening', description: 'Overzicht en beheer van de pre-screening agents per vacature', icon: Phone },
  '/pre-screening/settings': { title: 'Pre-screening instellingen', icon: Settings },
  '/pre-screening/demo': { title: 'Pre-screening playground', icon: Play },

  // Documentcollectie
  '/document-collection': { title: 'Documentcollectie', description: 'Verzamel documenten voor nieuwe medewerkers', icon: FileCheck },
  '/document-collection/playground': { title: 'Documentcollectie playground', icon: Play },

  // Other features
  '/insights': { title: 'Pattern Finder', description: 'Ontdek verborgen patronen en optimaliseer je hiring proces', icon: ScanSearch },
  '/audit-trail': { title: 'Audit trail', description: 'Geschiedenis van alle agent en systeem gebeurtenissen', icon: History },

  // Admin section
  '/admin': { title: 'Instellingen', description: 'Beheer instellingen en configuraties', icon: Settings },
'/admin/ontology': { title: 'Ontology', icon: Boxes },
  '/admin/integrations': { title: 'Externe integraties', icon: Plug },

  // Agent settings
  '/agent-settings/voice': { title: 'Voice Agent', description: 'Configure voice settings and test demo calls', icon: Mic },

};

/**
 * Dynamic route patterns for pages with URL parameters.
 * Patterns are tested in order - first match wins.
 */
export const dynamicRoutes: Array<{ pattern: RegExp; config: PageConfig }> = [
  // Pre-screening dynamic routes
  { pattern: /^\/pre-screening\/detail\//, config: { title: 'Pre-screening', icon: Phone } },
  { pattern: /^\/pre-screening\/generate\//, config: { title: 'Pre-screening', icon: Phone } },

  // Interview routes
  { pattern: /^\/interviews\/generate\//, config: { title: 'Interview vragen', icon: Phone } },

  // Vacancy pipeline
  { pattern: /^\/views\/vacancies\/[^/]+\/pipeline/, config: { title: 'Pipeline', icon: Briefcase } },

  // Documentcollectie dynamic routes
  { pattern: /^\/document-collection\/detail\//, config: { title: 'Documentcollectie', icon: FileCheck } },
  { pattern: /^\/document-collection\/generate\//, config: { title: 'Documentcollectie', icon: FileCheck } },

  // Integration detail routes
  { pattern: /^\/admin\/integrations\/[^/]+$/, config: { title: 'Integratie', icon: Plug } },

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
