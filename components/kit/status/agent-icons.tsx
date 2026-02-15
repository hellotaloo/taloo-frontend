'use client';

import { cn } from '@/lib/utils';
import { Phone, FileCheck, ScanSearch } from 'lucide-react';
import { VacancyAgents, AgentStatusInfo } from '@/lib/types';
import Link from 'next/link';
import { TagBadge, type TagBadgeVariant } from '@/components/kit/tag-badge';

export interface AgentIconsProps {
  agents: VacancyAgents;
  vacancyId?: string;
  className?: string;
}

/**
 * Get variant based on agent status
 * - Online (green): exists: true + status: "online"
 * - Offline (gray): exists: true + status: "offline"
 * - No display: exists: false
 */
function getAgentVariant(agent: AgentStatusInfo): TagBadgeVariant | null {
  if (!agent.exists) return null;
  return agent.status === 'online' ? 'green' : 'gray';
}

/**
 * Agent status badges showing which AI agents are active for a vacancy.
 * Uses TagBadge component for consistent styling.
 * When vacancyId is provided, badges become clickable links to the agent detail pages.
 *
 * Colors:
 * - Green: Agent exists and is online
 * - Gray: Agent exists but is offline
 * - Hidden: Agent doesn't exist
 */
export function AgentIcons({ agents, vacancyId, className }: AgentIconsProps) {
  const hasAnyAgent =
    agents.prescreening.exists || agents.preonboarding.exists || agents.insights.exists;

  if (!hasAnyAgent) {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  const prescreeningVariant = getAgentVariant(agents.prescreening);
  const preonboardingVariant = getAgentVariant(agents.preonboarding);
  const insightsVariant = getAgentVariant(agents.insights);

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {prescreeningVariant && (
        vacancyId ? (
          <Link href={`/pre-screening/edit/${vacancyId}`} className="hover:brightness-90 transition-all">
            <TagBadge label="Pre-screening" variant={prescreeningVariant} icon={Phone} />
          </Link>
        ) : (
          <TagBadge label="Pre-screening" variant={prescreeningVariant} icon={Phone} />
        )
      )}
      {preonboardingVariant && (
        vacancyId ? (
          <Link href={`/pre-onboarding/edit/${vacancyId}`} className="hover:brightness-90 transition-all">
            <TagBadge label="Pre-onboarding" variant={preonboardingVariant} icon={FileCheck} />
          </Link>
        ) : (
          <TagBadge label="Pre-onboarding" variant={preonboardingVariant} icon={FileCheck} />
        )
      )}
      {insightsVariant && (
        vacancyId ? (
          <Link href={`/insights?vacancy=${vacancyId}`} className="hover:brightness-90 transition-all">
            <TagBadge label="Insights" variant={insightsVariant} icon={ScanSearch} />
          </Link>
        ) : (
          <TagBadge label="Insights" variant={insightsVariant} icon={ScanSearch} />
        )
      )}
    </div>
  );
}
