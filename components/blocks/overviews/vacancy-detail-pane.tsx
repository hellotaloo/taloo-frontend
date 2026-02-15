'use client';

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
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AgentIcons } from '@/components/kit/status';
import { StatusBadge } from '@/components/kit/status-badge';
import { CollapseBox } from '@/components/kit/collapse-box';
import { MarkdownContent } from '@/components/kit/markdown-content';
import { APIVacancyDetail, APIActivityResponse } from '@/lib/types';

export interface VacancyDetailPaneProps {
  vacancy: APIVacancyDetail | null;
  isLoading?: boolean;
  onClose: () => void;
}

// Event type to icon/color mapping
const eventTypeConfig: Record<string, { icon: typeof FileText; color: string; bgColor: string }> = {
  // Vacancy events
  created: { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  screening_configured: { icon: Settings, color: 'text-purple-500', bgColor: 'bg-purple-50' },
  published: { icon: Globe, color: 'text-green-500', bgColor: 'bg-green-50' },
  unpublished: { icon: EyeOff, color: 'text-gray-500', bgColor: 'bg-gray-50' },
  archived: { icon: Archive, color: 'text-gray-500', bgColor: 'bg-gray-50' },
  // Candidate/Application events
  screening_started: { icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-50' },
  screening_completed: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50' },
  qualified: { icon: Award, color: 'text-lime-600', bgColor: 'bg-lime-50' },
  disqualified: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
  candidate_applied: { icon: UserPlus, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  candidate_qualified: { icon: Award, color: 'text-lime-600', bgColor: 'bg-lime-50' },
  candidate_submitted: { icon: Send, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
  candidate_placed: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  candidate_rejected: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
  interview_scheduled: { icon: Calendar, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  interview_completed: { icon: Users, color: 'text-green-500', bgColor: 'bg-green-50' },
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
  const ChannelIcon = activity.channel ? channelIcons[activity.channel] : null;

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
            {activity.channel && ChannelIcon && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <ChannelIcon className="w-3 h-3" />
                {activity.channel === 'whatsapp' ? 'WhatsApp' : activity.channel === 'voice' ? 'Voice' : activity.channel}
              </p>
            )}
          </div>
          <span className="text-[10px] text-gray-400 whitespace-nowrap">
            {formatDateTime(activity.created_at)}
          </span>
        </div>
      </div>
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

  // Calculate completion rate
  const completionRate = vacancy.candidates_count > 0
    ? Math.round((vacancy.completed_count / vacancy.candidates_count) * 100)
    : 0;

  // Calculate qualification rate
  const qualificationRate = vacancy.completed_count > 0
    ? Math.round((vacancy.qualified_count / vacancy.completed_count) * 100)
    : 0;

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
        <div className="grid grid-cols-4 gap-3 mt-4">
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
            {vacancy.completed_count > 0 ? (
              <p className="text-sm font-semibold text-gray-900">
                {vacancy.completed_count} ({completionRate}%)
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
            {vacancy.qualified_count > 0 ? (
              <p className="text-sm font-semibold text-gray-900">
                {vacancy.qualified_count} ({qualificationRate}%)
              </p>
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>

          {/* Active Agents */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Agents
            </p>
            {vacancy.agents ? (
              <AgentIcons agents={vacancy.agents} vacancyId={vacancy.id} />
            ) : (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
        </div>

        {/* Description */}
        {vacancy.description && (
          <div className="mt-4">
            <CollapseBox
              title="Vacaturetekst"
              icon={FileText}
              defaultOpen={false}
              contentMaxHeight="200px"
            >
              <MarkdownContent content={vacancy.description} />
            </CollapseBox>
          </div>
        )}

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
                <div className="flex items-center gap-3 mt-1">
                  {vacancy.recruiter.email && (
                    <a
                      href={`mailto:${vacancy.recruiter.email}`}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      {vacancy.recruiter.email}
                    </a>
                  )}
                  {vacancy.recruiter.phone && (
                    <a
                      href={`tel:${vacancy.recruiter.phone}`}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {vacancy.recruiter.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Timeline */}
        <div className="px-6 py-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Activiteit ({timeline.length})
          </h3>
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
      </div>
    </div>
  );
}
