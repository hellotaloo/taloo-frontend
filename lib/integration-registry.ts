import { type ElementType } from 'react';
import { Database, Video } from 'lucide-react';
import type { ConnectionResponse } from './integrations-api';
import type { StatusBadgeVariant } from '@/components/kit/status-badge';

/**
 * Blueprint for an external integration provider.
 * Every integration must define these properties.
 */
export interface IntegrationBlueprint {
  /** Lucide icon component */
  icon: ElementType;
  /** Vendor / product line label (e.g. "Bullhorn", "Teams & Outlook") */
  vendor: string;
  /** Whether the provider supports field mapping */
  hasMapping: boolean;
}

/**
 * Registry of all known integration providers.
 * Add a new entry here when onboarding a new integration.
 */
const registry: Record<string, IntegrationBlueprint> = {
  connexys: {
    icon: Database,
    vendor: 'Bullhorn',
    hasMapping: true,
  },
  microsoft: {
    icon: Video,
    vendor: 'Teams & Outlook',
    hasMapping: false,
  },
};

/** Default blueprint for unknown providers */
const fallback: IntegrationBlueprint = {
  icon: Database,
  vendor: '',
  hasMapping: false,
};

/**
 * Get the blueprint for a provider by slug.
 * Returns a fallback if the slug is unknown.
 */
export function getProviderBlueprint(slug: string): IntegrationBlueprint {
  return registry[slug] ?? fallback;
}

/**
 * Derive a status translation key and badge variant from a connection.
 * The returned `labelKey` should be passed to `t()` with the `integrations` namespace.
 */
export function getStatusDisplay(connection?: ConnectionResponse): {
  labelKey: string;
  variant: StatusBadgeVariant;
} {
  if (!connection || !connection.has_credentials) {
    return { labelKey: 'statusNotConfigured', variant: 'gray' };
  }
  switch (connection.health_status) {
    case 'healthy':
      return { labelKey: 'statusConnected', variant: 'green' };
    case 'unhealthy':
      return { labelKey: 'statusConnectionFailed', variant: 'red' };
    default:
      return { labelKey: 'statusNotTested', variant: 'orange' };
  }
}
