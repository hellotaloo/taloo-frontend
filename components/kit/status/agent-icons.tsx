'use client';

import { cn } from '@/lib/utils';
import { Phone, FileCheck, ScanSearch } from 'lucide-react';
import { VacancyAgents, AgentStatusInfo } from '@/lib/types';
import Link from 'next/link';

export interface AgentIconsProps {
  agents: VacancyAgents;
  vacancyId?: string;
  className?: string;
}

/**
 * Get styling classes based on agent status
 * - Online (green): exists: true + status: "online"
 * - Offline (gray): exists: true + status: "offline"
 * - No display: exists: false
 */
function getAgentStyles(agent: AgentStatusInfo): { bg: string; text: string } | null {
  if (!agent.exists) return null;

  if (agent.status === 'online') {
    return { bg: 'bg-green-500', text: 'text-white' };
  }
  // offline or null status
  return { bg: 'bg-gray-100', text: 'text-gray-400' };
}

/**
 * Agent status badges showing which AI agents are active for a vacancy.
 * Uses the same icons as the navigation sidebar.
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

  const prescreeningStyles = getAgentStyles(agents.prescreening);
  const preonboardingStyles = getAgentStyles(agents.preonboarding);
  const insightsStyles = getAgentStyles(agents.insights);

  const badgeBaseClass = 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium';
  const linkClass = 'hover:brightness-90 transition-all';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {prescreeningStyles && (
        vacancyId ? (
          <Link
            href={`/pre-screening/edit/${vacancyId}`}
            className={cn(badgeBaseClass, linkClass, prescreeningStyles.bg, prescreeningStyles.text)}
          >
            <Phone className="w-3 h-3" />
            Pre-screening
          </Link>
        ) : (
          <span className={cn(badgeBaseClass, prescreeningStyles.bg, prescreeningStyles.text)}>
            <Phone className="w-3 h-3" />
            Pre-screening
          </span>
        )
      )}
      {preonboardingStyles && (
        vacancyId ? (
          <Link
            href={`/pre-onboarding/edit/${vacancyId}`}
            className={cn(badgeBaseClass, linkClass, preonboardingStyles.bg, preonboardingStyles.text)}
          >
            <FileCheck className="w-3 h-3" />
            Pre-onboarding
          </Link>
        ) : (
          <span className={cn(badgeBaseClass, preonboardingStyles.bg, preonboardingStyles.text)}>
            <FileCheck className="w-3 h-3" />
            Pre-onboarding
          </span>
        )
      )}
      {insightsStyles && (
        vacancyId ? (
          <Link
            href={`/insights?vacancy=${vacancyId}`}
            className={cn(badgeBaseClass, linkClass, insightsStyles.bg, insightsStyles.text)}
          >
            <ScanSearch className="w-3 h-3" />
            Insights
          </Link>
        ) : (
          <span className={cn(badgeBaseClass, insightsStyles.bg, insightsStyles.text)}>
            <ScanSearch className="w-3 h-3" />
            Insights
          </span>
        )
      )}
    </div>
  );
}
