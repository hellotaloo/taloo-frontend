'use client';

import { useState } from 'react';
import {
  X,
  Building2,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  Settings,
  Globe,
  EyeOff,
  UserPlus,
  Award,
  Send,
  Briefcase,
  MessageSquare,
  Archive,
  Loader2,
  Clock,
  PhoneCall,
  User,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/kit/status-badge';
import { CollapseBox } from '@/components/kit/collapse-box';
import { MarkdownContent } from '@/components/kit/markdown-content';
import { cn } from '@/lib/utils';
import { APIVacancyDetail, APIActivityResponse, APIApplicantSummary, VacancyAgents, AgentStatusInfo } from '@/lib/types';

export interface VacancyDetailPaneProps {
  vacancy: APIVacancyDetail | null;
  isLoading?: boolean;
  onClose: () => void;
}

// Event type to icon/color mapping (aligned with design system)
// All use bg-gray-50 background with -500 icon colors
const eventTypeConfig: Record<string, { icon: typeof FileText; color: string; bgColor: string }> = {
  // Vacancy events
  created: { icon: FileText, color: 'text-blue-500', bgColor: 'bg-gray-50' },
  screening_configured: { icon: Settings, color: 'text-purple-500', bgColor: 'bg-gray-50' },
  published: { icon: Globe, color: 'text-green-500', bgColor: 'bg-gray-50' },
  unpublished: { icon: EyeOff, color: 'text-gray-500', bgColor: 'bg-gray-50' },
  archived: { icon: Archive, color: 'text-gray-500', bgColor: 'bg-gray-50' },
  // Candidate/Application events
  screening_started: { icon: Clock, color: 'text-orange-500', bgColor: 'bg-gray-50' },
  screening_completed: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-gray-50' },
  qualified: { icon: Award, color: 'text-green-500', bgColor: 'bg-gray-50' },
  disqualified: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-gray-50' },
  candidate_applied: { icon: UserPlus, color: 'text-blue-500', bgColor: 'bg-gray-50' },
  candidate_qualified: { icon: Award, color: 'text-green-500', bgColor: 'bg-gray-50' },
  candidate_submitted: { icon: Send, color: 'text-blue-500', bgColor: 'bg-gray-50' },
  candidate_placed: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-gray-50' },
  candidate_rejected: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-gray-50' },
  interview_scheduled: { icon: Calendar, color: 'text-blue-500', bgColor: 'bg-gray-50' },
  interview_completed: { icon: Users, color: 'text-green-500', bgColor: 'bg-gray-50' },
  note_added: { icon: MessageSquare, color: 'text-gray-500', bgColor: 'bg-gray-50' },
  // Default
  default: { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-50' },
};

// Channel icons
const channelIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  voice: PhoneCall,
  cv: FileText,
  web: Globe,
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TimelineEvent({ activity, isLast }: { activity: APIActivityResponse; isLast: boolean }) {
  const config = eventTypeConfig[activity.event_type] || eventTypeConfig.default;
  const Icon = config.icon;
  const ChannelIconComponent = activity.channel ? channelIcons[activity.channel] : null;
  // Try to get candidate name from activity or metadata
  const candidateName = activity.candidate_name || (activity.metadata?.candidate_name as string);

  return (
    <div className="relative flex gap-3">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 w-[2px] h-[calc(100%+8px)] bg-gray-200" />
      )}

      {/* Icon */}
      <div
        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${config.bgColor}`}
      >
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {activity.summary || activity.event_type.replace(/_/g, ' ')}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {activity.channel && ChannelIconComponent && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <ChannelIconComponent className="w-3 h-3" />
                  {activity.channel === 'whatsapp' ? 'WhatsApp' : activity.channel === 'voice' ? 'Voice' : activity.channel}
                </span>
              )}
              {candidateName && (
                <span className="text-xs text-gray-500">
                  {activity.channel && '•'} {candidateName}
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-gray-400 whitespace-nowrap">
            {formatDateTime(activity.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

type TabType = 'candidates' | 'agents' | 'timeline';

// Agent type configuration
const agentTypeConfig: Record<string, { label: string; icon: typeof PhoneCall; description: string }> = {
  prescreening: {
    label: 'Pre-screening',
    icon: PhoneCall,
    description: 'Voert telefonische en WhatsApp screenings uit'
  },
  preonboarding: {
    label: 'Pre-onboarding',
    icon: FileText,
    description: 'Verzamelt documenten van kandidaten'
  },
  insights: {
    label: 'Insights',
    icon: Users,
    description: 'Analyseert kandidaatgegevens'
  },
};

function AgentCard({ type, agent }: { type: string; agent: AgentStatusInfo }) {
  const config = agentTypeConfig[type];
  if (!config || !agent.exists) return null;

  const Icon = config.icon;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{config.label}</p>
            <p className="text-xs text-gray-500">{config.description}</p>
          </div>
        </div>
        <StatusBadge
          label={agent.status === 'online' ? 'Online' : 'Offline'}
          variant={agent.status === 'online' ? 'green' : 'gray'}
        />
      </div>

      {/* Stats */}
      {agent.total_screenings !== undefined && (
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Screenings</p>
            <p className="text-lg font-semibold text-gray-900">{agent.total_screenings}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Gekwalificeerd</p>
            <p className="text-lg font-semibold text-gray-900">
              {agent.qualified_count ?? 0}
              {agent.qualification_rate !== undefined && (
                <span className="text-xs font-normal text-gray-500 ml-1">
                  ({agent.qualification_rate}%)
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Laatste</p>
            <p className="text-sm font-medium text-gray-900">
              {agent.last_activity_at ? formatDate(agent.last_activity_at) : '-'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TabsSection({
  timeline,
  applicants,
  agents
}: {
  timeline: APIActivityResponse[];
  applicants: APIApplicantSummary[];
  agents?: VacancyAgents;
}) {
  const [activeTab, setActiveTab] = useState<TabType>('candidates');

  // Count active agents
  const activeAgentsCount = agents
    ? Object.values(agents).filter((a) => a.exists).length
    : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab buttons */}
      <div className="shrink-0 border-b border-gray-200 px-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('candidates')}
            className={cn(
              'py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'candidates'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Kandidaten ({applicants.length})
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={cn(
              'py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'agents'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Agents ({activeAgentsCount})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={cn(
              'py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'timeline'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Tijdlijn ({timeline.length})
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'candidates' && (
          <div className="px-6 py-4">
            {applicants.length > 0 ? (
              <div className="space-y-3">
                {applicants.map((applicant) => (
                  <ApplicantRow key={applicant.id} applicant={applicant} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                Geen kandidaten
              </p>
            )}
          </div>
        )}
        {activeTab === 'agents' && (
          <div className="px-6 py-4">
            {agents && activeAgentsCount > 0 ? (
              <div className="space-y-3">
                {Object.entries(agents).map(([type, agent]) => (
                  <AgentCard key={type} type={type} agent={agent} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                Geen agents geconfigureerd
              </p>
            )}
          </div>
        )}
        {activeTab === 'timeline' && (
          <div className="px-6 py-4">
            {timeline.length > 0 ? (
              <div className="space-y-0">
                {timeline.map((activity, index) => (
                  <TimelineEvent
                    key={activity.id}
                    activity={activity}
                    isLast={index === timeline.length - 1}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                Geen activiteit
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Channel icon for single channel display
const singleChannelIcons: Record<string, { icon: typeof MessageSquare; label: string }> = {
  whatsapp: { icon: MessageSquare, label: 'WhatsApp' },
  voice: { icon: PhoneCall, label: 'Voice' },
  cv: { icon: FileText, label: 'CV' },
};

function ApplicantRow({ applicant }: { applicant: APIApplicantSummary }) {
  const channelConfig = singleChannelIcons[applicant.channel];
  const ChannelIconComponent = channelConfig?.icon;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {/* Avatar placeholder */}
      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-gray-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">{applicant.name}</p>
          {applicant.qualified && (
            <Award className="w-3.5 h-3.5 text-green-500 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
          {ChannelIconComponent && (
            <ChannelIconComponent className="w-3 h-3" />
          )}
          <span>{formatDate(applicant.started_at)}</span>
          {applicant.score !== undefined && (
            <span>• Score: {applicant.score}%</span>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <StatusBadge
        label={applicant.qualified ? 'Gekwalificeerd' : applicant.status === 'completed' ? 'Niet gekwalificeerd' : 'Bezig'}
        variant={applicant.qualified ? 'green' : applicant.status === 'completed' ? 'red' : 'orange'}
      />
    </div>
  );
}

export function VacancyDetailPane({ vacancy, isLoading, onClose }: VacancyDetailPaneProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!vacancy) return null;

  // Timeline is already sorted from API (newest first)
  const timeline = vacancy.timeline || [];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{vacancy.title}</h2>
              <StatusBadge
                      label={vacancy.is_online === true ? 'Online' : vacancy.is_online === false ? 'Offline' : 'Concept'}
                      variant={vacancy.is_online === true ? 'green' : vacancy.is_online === false ? 'gray' : 'orange'}
                    />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {vacancy.company}
              </span>
              {vacancy.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {vacancy.location}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick info cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {/* Candidates */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Kandidaten
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {vacancy.candidates_count}
            </p>
          </div>

          {/* Completed */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Afgerond
            </p>
            {vacancy.candidates_count > 0 ? (
              <p className="text-sm font-semibold text-gray-900">
                {vacancy.completed_count}/{vacancy.candidates_count}
              </p>
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>

          {/* Qualified */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Gekwalificeerd
            </p>
            {vacancy.completed_count > 0 ? (
              <p className="text-sm font-semibold text-gray-900">
                {vacancy.qualified_count}/{vacancy.completed_count}
              </p>
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>
        </div>

        {/* Recruiter info */}
        {vacancy.recruiter && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2">
              Recruiter
            </p>
            <div className="flex items-center gap-3">
              {vacancy.recruiter.avatar_url ? (
                <img
                  src={vacancy.recruiter.avatar_url}
                  alt={vacancy.recruiter.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{vacancy.recruiter.name}</p>
                {vacancy.recruiter.team && (
                  <p className="text-xs text-gray-500">{vacancy.recruiter.team}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {vacancy.description && (
          <div className="mt-4">
            <CollapseBox
              title="Vacaturetekst"
              icon={FileText}
              defaultOpen={false}
              contentMaxHeight="200px"
              className="bg-gray-50 border-gray-50"
            >
              <MarkdownContent content={vacancy.description} />
            </CollapseBox>
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Synced: {formatDate(vacancy.created_at)}
          </span>
          {vacancy.last_activity_at && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              Laatste activiteit: {formatDate(vacancy.last_activity_at)}
            </span>
          )}
          {vacancy.source === 'salesforce' && vacancy.source_url && (
            <a
              href={vacancy.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Image
                src="/salesforc-logo-cloud.png"
                alt="Salesforce"
                width={14}
                height={10}
              />
              <span>Bekijk in Salesforce</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Tabs and scrollable content */}
      {(timeline.length > 0 || (vacancy.applicants && vacancy.applicants.length > 0) || vacancy.agents) && (
        <TabsSection
          timeline={timeline}
          applicants={vacancy.applicants || []}
          agents={vacancy.agents}
        />
      )}
    </div>
  );
}
