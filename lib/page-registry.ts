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
  /** Key into the pages.* translation namespace */
  titleKey?: string;
  description?: string;
  icon: LucideIcon;
};

/**
 * Static route configurations.
 * Add new pages here with their exact path.
 */
export const pageConfigs: Record<string, PageConfig> = {
  // Main pages
  '/': { title: 'Dashboard', titleKey: 'dashboard', icon: LayoutDashboard },
  '/inbox': { title: 'Inbox', titleKey: 'inbox', icon: Inbox },
  '/views': { title: 'Views', titleKey: 'views', icon: LayoutList },
  '/views/vacancies': { title: 'Vacatures', titleKey: 'vacancies', icon: Briefcase },
  '/views/candidates': { title: 'Kandidaten', titleKey: 'candidates', icon: Users },
  '/views/pipelines': { title: 'Pipelines', titleKey: 'pipelines', icon: Kanban },
  '/views/customers': { title: 'Klanten', titleKey: 'customers', icon: Building2 },
  '/activities': { title: 'Activiteiten', titleKey: 'activities', icon: Activity },
  '/agents': { title: 'Agents', titleKey: 'agents', icon: Boxes },

  // Pre-screening
  '/pre-screening': { title: 'Pre-screening', titleKey: 'preScreening', icon: Phone },
  '/pre-screening/settings': { title: 'Pre-screening instellingen', titleKey: 'preScreeningSettings', icon: Settings },
  '/pre-screening/demo': { title: 'Pre-screening playground', titleKey: 'preScreeningPlayground', icon: Play },

  // Documentcollectie
  '/document-collection': { title: 'Documentcollectie', titleKey: 'documentCollection', icon: FileCheck },
  '/document-collection/playground': { title: 'Documentcollectie playground', titleKey: 'documentCollectionPlayground', icon: Play },

  // Other features
  '/insights': { title: 'Pattern Finder', titleKey: 'patternFinder', icon: ScanSearch },
  '/audit-trail': { title: 'Audit trail', titleKey: 'auditTrail', icon: History },

  // Admin section
  '/admin': { title: 'Instellingen', titleKey: 'admin', icon: Settings },
  '/admin/members': { title: 'Leden', titleKey: 'members', icon: Users },
  '/admin/settings': { title: 'Algemene instellingen', titleKey: 'generalSettings', icon: Settings },
  '/admin/ontology': { title: 'Ontology', titleKey: 'ontology', icon: Boxes },
  '/admin/integrations': { title: 'Externe integraties', titleKey: 'integrations', icon: Plug },

  // Agent settings
  '/agent-settings/voice': { title: 'Voice Agent', titleKey: 'voiceAgent', icon: Mic },

};

/**
 * Dynamic route patterns for pages with URL parameters.
 * Patterns are tested in order - first match wins.
 */
export const dynamicRoutes: Array<{ pattern: RegExp; config: PageConfig }> = [
  // Pre-screening dynamic routes
  { pattern: /^\/pre-screening\/detail\//, config: { title: 'Pre-screening', titleKey: 'preScreening', icon: Phone } },
  { pattern: /^\/pre-screening\/generate\//, config: { title: 'Pre-screening', titleKey: 'preScreening', icon: Phone } },

  // Interview routes
  { pattern: /^\/interviews\/generate\//, config: { title: 'Interview vragen', titleKey: 'interviewQuestions', icon: Phone } },

  // Vacancy pipeline
  { pattern: /^\/views\/vacancies\/[^/]+\/pipeline/, config: { title: 'Pipeline', titleKey: 'pipeline', icon: Briefcase } },

  // Documentcollectie dynamic routes
  { pattern: /^\/document-collection\/detail\//, config: { title: 'Documentcollectie', titleKey: 'documentCollection', icon: FileCheck } },
  { pattern: /^\/document-collection\/generate\//, config: { title: 'Documentcollectie', titleKey: 'documentCollection', icon: FileCheck } },

  // Integration detail routes
  { pattern: /^\/admin\/integrations\/[^/]+$/, config: { title: 'Integratie', titleKey: 'integration', icon: Plug } },
  { pattern: /^\/admin\/integrations\/[^/]+\/mapping\/import/, config: { title: 'Vacature import', titleKey: 'vacancyImport', icon: Plug } },
  { pattern: /^\/admin\/integrations\/[^/]+\/mapping\/export/, config: { title: 'Data terugkoppeling', titleKey: 'dataFeedback', icon: Plug } },
  { pattern: /^\/admin\/integrations\/[^/]+\/mapping/, config: { title: 'Mapping', titleKey: 'mapping', icon: Plug } },

];

/**
 * Default config shown when no match is found.
 * If you see this in the UI, a page is missing from the registry!
 */
export const defaultPageConfig: PageConfig = {
  title: 'Nieuw tabblad',
  titleKey: 'newTab',
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
