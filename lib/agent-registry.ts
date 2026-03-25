import { Phone, FileCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AgentMeta {
  name: string;
  href: string;
  icon: LucideIcon;
  badgeKey: 'prescreening' | 'preonboarding';
}

/**
 * Maps backend agent_type strings to frontend display metadata.
 * Add new entries here when new agent types are added to the backend.
 */
export const AGENT_REGISTRY: Record<string, AgentMeta> = {
  prescreening: {
    name: 'Pre-screening',
    href: '/pre-screening',
    icon: Phone,
    badgeKey: 'prescreening',
  },
  document_collection: {
    name: 'Documentcollectie',
    href: '/document-collection',
    icon: FileCheck,
    badgeKey: 'preonboarding',
  },
};

/**
 * Maps agent catalog names to backend agent_type strings.
 * Used by the agents catalog page to determine active state.
 */
export const AGENT_NAME_TO_TYPE: Record<string, string> = {
  'Pre-screening Agent': 'prescreening',
  'Onboarding Agent': 'document_collection',
};
