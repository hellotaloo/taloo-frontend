'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCog,
  MessageCircle,
  Phone,
  FileText,
  Globe,
  CheckCircle2,
  XCircle,
  PlayCircle,
  FileCheck,
  Settings,
  Upload,
  Filter,
  ChevronRight,
  Calendar,
  Bell,
  Send,
  Eye,
  RefreshCw,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { cn, formatRelativeDate } from '@/lib/utils';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SearchInput } from '@/components/kit/search-input';
import { CandidateDetailPane, VacancyDetailPane } from '@/components/blocks/overviews';
import { getActivities, getCandidate, getVacancyDetail } from '@/lib/api';
import type { GlobalActivity, ActivityActorType, ActivityChannel, APICandidateDetail, APIVacancyDetail } from '@/lib/types';

// Event type configuration with icons and colors
const eventTypeConfig: Record<string, { icon: React.ElementType; color: string; dotColor: string }> = {
  // Screening lifecycle
  screening_started: { icon: PlayCircle, color: 'text-blue-500', dotColor: 'bg-blue-500' },
  screening_completed: { icon: CheckCircle2, color: 'text-green-500', dotColor: 'bg-green-500' },
  screening_abandoned: { icon: XCircle, color: 'text-gray-400', dotColor: 'bg-gray-400' },
  // Messages
  message_sent: { icon: Send, color: 'text-blue-500', dotColor: 'bg-blue-500' },
  message_received: { icon: MessageCircle, color: 'text-green-500', dotColor: 'bg-green-500' },
  // Voice calls
  call_initiated: { icon: Phone, color: 'text-blue-500', dotColor: 'bg-blue-500' },
  call_completed: { icon: Phone, color: 'text-green-500', dotColor: 'bg-green-500' },
  call_failed: { icon: Phone, color: 'text-red-500', dotColor: 'bg-red-500' },
  // Documents
  document_uploaded: { icon: Upload, color: 'text-purple-500', dotColor: 'bg-purple-500' },
  document_verified: { icon: FileCheck, color: 'text-green-500', dotColor: 'bg-green-500' },
  document_rejected: { icon: FileText, color: 'text-red-500', dotColor: 'bg-red-500' },
  cv_uploaded: { icon: FileText, color: 'text-purple-500', dotColor: 'bg-purple-500' },
  cv_analyzed: { icon: FileCheck, color: 'text-purple-500', dotColor: 'bg-purple-500' },
  // Application status
  status_changed: { icon: RefreshCw, color: 'text-orange-500', dotColor: 'bg-orange-500' },
  qualified: { icon: CheckCircle2, color: 'text-green-500', dotColor: 'bg-green-500' },
  disqualified: { icon: XCircle, color: 'text-red-500', dotColor: 'bg-red-500' },
  // Interview scheduling
  interview_scheduled: { icon: Calendar, color: 'text-blue-500', dotColor: 'bg-blue-500' },
  interview_confirmed: { icon: CheckCircle2, color: 'text-green-500', dotColor: 'bg-green-500' },
  interview_cancelled: { icon: XCircle, color: 'text-red-500', dotColor: 'bg-red-500' },
  interview_rescheduled: { icon: Calendar, color: 'text-orange-500', dotColor: 'bg-orange-500' },
  interview_completed: { icon: CheckCircle2, color: 'text-green-500', dotColor: 'bg-green-500' },
  interview_no_show: { icon: XCircle, color: 'text-red-500', dotColor: 'bg-red-500' },
  // Recruiter actions
  note_added: { icon: FileText, color: 'text-gray-500', dotColor: 'bg-gray-500' },
  application_viewed: { icon: Eye, color: 'text-gray-500', dotColor: 'bg-gray-500' },
  candidate_contacted: { icon: Phone, color: 'text-blue-500', dotColor: 'bg-blue-500' },
  // System events
  application_synced: { icon: RefreshCw, color: 'text-gray-500', dotColor: 'bg-gray-500' },
};

// Default config for unknown event types
const defaultEventConfig = { icon: Bell, color: 'text-gray-500', dotColor: 'bg-gray-500' };

// Actor type configuration
const actorTypeConfig: Record<ActivityActorType, { label: string; color: string; bgColor: string }> = {
  agent: { label: 'Agent', color: 'text-brand-dark-blue', bgColor: 'bg-brand-light-blue/30' },
  candidate: { label: 'Kandidaat', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  recruiter: { label: 'Recruiter', color: 'text-orange-700', bgColor: 'bg-orange-50' },
  system: { label: 'Systeem', color: 'text-gray-500', bgColor: 'bg-gray-50' },
};

// Get specific agent name based on event type
function getAgentName(eventType: string, metadata: Record<string, unknown>): string {
  // Check if agent_name is provided in metadata
  if (metadata.agent_name && typeof metadata.agent_name === 'string') {
    return metadata.agent_name;
  }

  // Derive from event type
  const screeningEvents = [
    'screening_started', 'screening_completed', 'screening_abandoned',
    'message_sent', 'message_received',
    'call_initiated', 'call_completed', 'call_failed',
    'qualified', 'disqualified',
    'interview_scheduled', 'interview_confirmed', 'interview_cancelled',
    'interview_rescheduled', 'interview_completed', 'interview_no_show',
  ];

  const onboardingEvents = [
    'document_uploaded', 'document_verified', 'document_rejected',
  ];

  const cvEvents = ['cv_uploaded', 'cv_analyzed'];

  if (screeningEvents.includes(eventType)) {
    return 'Pre-screening';
  }
  if (onboardingEvents.includes(eventType)) {
    return 'Pre-onboarding';
  }
  if (cvEvents.includes(eventType)) {
    return 'CV Analyse';
  }

  return 'Agent';
}

// Channel badge
function ChannelBadge({ channel }: { channel?: ActivityChannel }) {
  if (!channel) return null;

  const config: Record<string, { icon: React.ElementType; label: string; className: string }> = {
    whatsapp: { icon: MessageCircle, label: 'WhatsApp', className: 'text-green-600' },
    voice: { icon: Phone, label: 'Voice', className: 'text-blue-600' },
    cv: { icon: FileText, label: 'CV', className: 'text-purple-600' },
    web: { icon: Globe, label: 'Web', className: 'text-gray-600' },
  };

  const c = config[channel];
  if (!c) return null;

  const Icon = c.icon;

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', c.className)}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

// Format duration in seconds to readable format
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

// Document type labels
const documentTypeLabels: Record<string, string> = {
  id_card: 'ID-kaart',
  driver_license: 'Rijbewijs',
  work_permit: 'Werkvergunning',
  medical_certificate: 'Medisch attest',
  certificate_diploma: 'Diploma',
  bank_account: 'Bankrekening',
};

// Reason labels
const reasonLabels: Record<string, string> = {
  availability_mismatch: 'Beschikbaarheid komt niet overeen',
  experience_mismatch: 'Ervaring voldoet niet',
  location_mismatch: 'Locatie komt niet overeen',
  salary_mismatch: 'Salarisverwachting komt niet overeen',
};

// Extract preview content from metadata based on event type
function getMetadataPreview(metadata: Record<string, unknown>, eventType: string): {
  badges: { label: string; value: string; color: string }[];
  snippet?: string;
  snippetLabel?: string;
} | null {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  const badges: { label: string; value: string; color: string }[] = [];
  let snippet: string | undefined;
  let snippetLabel: string | undefined;

  // Extract badges (structured data)
  if ('score' in metadata && typeof metadata.score === 'number') {
    const score = metadata.score;
    const displayScore = score > 1 ? score : Math.round(score * 100);
    const color = displayScore >= 70 ? 'bg-green-100 text-green-700' : displayScore >= 40 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
    badges.push({ label: 'Score', value: `${displayScore}%`, color });
  }

  if ('match_score' in metadata && typeof metadata.match_score === 'number') {
    const score = metadata.match_score;
    const color = score >= 70 ? 'bg-green-100 text-green-700' : score >= 40 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
    badges.push({ label: 'Match', value: `${score}%`, color });
  }

  if ('knockout_passed' in metadata && 'knockout_total' in metadata) {
    badges.push({
      label: 'Knockout',
      value: `${metadata.knockout_passed}/${metadata.knockout_total}`,
      color: 'bg-blue-100 text-blue-700',
    });
  }

  if ('duration_seconds' in metadata && typeof metadata.duration_seconds === 'number') {
    badges.push({
      label: 'Duur',
      value: formatDuration(metadata.duration_seconds),
      color: 'bg-gray-100 text-gray-600',
    });
  }

  if ('document_type' in metadata && typeof metadata.document_type === 'string') {
    badges.push({
      label: 'Document',
      value: documentTypeLabels[metadata.document_type] || metadata.document_type,
      color: 'bg-purple-100 text-purple-700',
    });
  }

  if ('experience_years' in metadata && typeof metadata.experience_years === 'number') {
    badges.push({
      label: 'Ervaring',
      value: `${metadata.experience_years} jaar`,
      color: 'bg-gray-100 text-gray-600',
    });
  }

  // Extract text snippet based on event type
  switch (eventType) {
    case 'screening_started':
      if (metadata.first_message && typeof metadata.first_message === 'string') {
        snippet = metadata.first_message;
        snippetLabel = 'Eerste bericht';
      }
      break;
    case 'qualified':
    case 'screening_completed':
      if (metadata.last_answer && typeof metadata.last_answer === 'string') {
        snippet = metadata.last_answer;
        snippetLabel = 'Laatste antwoord';
      } else if (metadata.transcript_preview && typeof metadata.transcript_preview === 'string') {
        snippet = metadata.transcript_preview;
        snippetLabel = 'Fragment';
      }
      break;
    case 'disqualified':
      if (metadata.candidate_response && typeof metadata.candidate_response === 'string') {
        snippet = metadata.candidate_response;
        snippetLabel = metadata.knockout_failed ? `Knockout: ${metadata.knockout_failed}` : 'Antwoord';
      } else if (metadata.reason && typeof metadata.reason === 'string') {
        snippet = reasonLabels[metadata.reason] || metadata.reason;
        snippetLabel = 'Reden';
      }
      break;
    case 'call_completed':
      if (metadata.transcript_preview && typeof metadata.transcript_preview === 'string') {
        snippet = metadata.transcript_preview;
        snippetLabel = 'Fragment';
      }
      break;
    case 'call_failed':
      if (metadata.reason && typeof metadata.reason === 'string') {
        snippet = metadata.reason;
        snippetLabel = 'Reden';
      }
      break;
    case 'interview_scheduled':
      if (metadata.slot_text && typeof metadata.slot_text === 'string') {
        snippet = metadata.slot_text;
        snippetLabel = 'Gepland';
      }
      break;
    case 'cv_analyzed':
      if (metadata.skills_extracted && Array.isArray(metadata.skills_extracted)) {
        snippet = metadata.skills_extracted.slice(0, 5).join(', ');
        snippetLabel = 'Vaardigheden';
      }
      break;
    case 'note_added':
      if (metadata.questions && Array.isArray(metadata.questions)) {
        snippet = metadata.questions.join(' | ');
        snippetLabel = `${metadata.questions_added || metadata.questions.length} vragen toegevoegd`;
      }
      break;
    case 'status_changed':
      if ('is_online' in metadata) {
        snippet = metadata.is_online ? 'Online gezet' : 'Offline gezet';
        if (metadata.channels_enabled && Array.isArray(metadata.channels_enabled)) {
          snippet += ` (${metadata.channels_enabled.join(', ')})`;
        }
      }
      break;
  }

  if (badges.length === 0 && !snippet) return null;

  return { badges, snippet, snippetLabel };
}

// Metadata display component
function MetadataDisplay({ metadata, eventType }: { metadata: Record<string, unknown>; eventType: string }) {
  const preview = getMetadataPreview(metadata, eventType);
  if (!preview) return null;

  const { badges, snippet, snippetLabel } = preview;

  return (
    <div className="mt-1.5 space-y-1">
      {/* Badges row */}
      {badges.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {badges.map((badge, idx) => (
            <span
              key={idx}
              className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium', badge.color)}
            >
              <span className="opacity-70">{badge.label}:</span>
              {badge.value}
            </span>
          ))}
        </div>
      )}

      {/* Snippet */}
      {snippet && (
        <div className="text-xs text-gray-500 italic">
          {snippetLabel && <span className="text-gray-400 not-italic">{snippetLabel}: </span>}
          <span className="line-clamp-2">&ldquo;{snippet}&rdquo;</span>
        </div>
      )}
    </div>
  );
}

// Clickable text component
function ClickableText({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  if (!onClick) {
    return <span className={className}>{children}</span>;
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'hover:underline hover:text-brand-blue cursor-pointer transition-colors text-left',
        className
      )}
    >
      {children}
    </button>
  );
}

// Activity row component (compact timeline item)
function ActivityRow({
  activity,
  index,
  onCandidateClick,
  onVacancyClick,
}: {
  activity: GlobalActivity;
  index: number;
  onCandidateClick: (candidateId: string) => void;
  onVacancyClick: (vacancyId: string) => void;
}) {
  const eventConfig = eventTypeConfig[activity.event_type] || defaultEventConfig;
  const actorConfig = actorTypeConfig[activity.actor_type] || actorTypeConfig.system;
  const EventIcon = eventConfig.icon;

  // Get display label for actor
  const actorLabel = activity.actor_type === 'agent'
    ? getAgentName(activity.event_type, activity.metadata)
    : actorConfig.label;

  return (
    <div
      data-testid={`activity-row-${activity.id}`}
      className="relative flex items-start gap-3 py-2.5 group"
      style={{ animation: `fade-in-up 0.4s ease-out ${index * 30}ms backwards` }}
    >
      {/* Timeline dot */}
      <div className="relative z-10 mt-1.5">
        <div className={cn('w-2.5 h-2.5 rounded-full ring-2 ring-white', eventConfig.dotColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Main row: icon + summary + candidate */}
        <div className="flex items-center gap-2 mb-0.5">
          <EventIcon className={cn('w-3.5 h-3.5 shrink-0', eventConfig.color)} />
          <span className="text-sm text-gray-900 truncate">
            {activity.summary || activity.event_type.replace(/_/g, ' ')}
          </span>
          {activity.candidate_name && activity.candidate_id && (
            <>
              <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
              <ClickableText
                onClick={activity.actor_type !== 'recruiter' ? () => onCandidateClick(activity.candidate_id) : undefined}
                className="text-sm text-gray-600 truncate"
              >
                {activity.candidate_name}
              </ClickableText>
            </>
          )}
        </div>

        {/* Meta row: vacancy + channel */}
        <div className="flex items-center gap-2 text-xs">
          {activity.vacancy_title && activity.vacancy_id && (
            <ClickableText
              onClick={() => onVacancyClick(activity.vacancy_id!)}
              className="text-gray-400 truncate"
            >
              {activity.vacancy_title}
              {activity.vacancy_company && ` · ${activity.vacancy_company}`}
            </ClickableText>
          )}
          {activity.channel && activity.channel !== 'web' && activity.vacancy_title && (
            <span className="text-gray-300">·</span>
          )}
          {activity.channel && activity.channel !== 'web' && (
            <ChannelBadge channel={activity.channel} />
          )}
        </div>

        {/* Metadata display */}
        <MetadataDisplay metadata={activity.metadata} eventType={activity.event_type} />
      </div>

      {/* Right column: actor + timestamp */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap', actorConfig.bgColor, actorConfig.color)}>
          {actorLabel}
        </span>
        <span className="text-[10px] text-gray-400 whitespace-nowrap">
          {formatRelativeDate(activity.created_at)}
        </span>
      </div>
    </div>
  );
}

// Filter types
type FilterType = 'all' | 'candidate' | 'recruiter' | 'system';

export default function MonitorPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activities, setActivities] = useState<GlobalActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail pane states
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<APICandidateDetail | null>(null);
  const [candidateDetailLoading, setCandidateDetailLoading] = useState(false);

  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null);
  const [selectedVacancyDetail, setSelectedVacancyDetail] = useState<APIVacancyDetail | null>(null);
  const [vacancyDetailLoading, setVacancyDetailLoading] = useState(false);

  // Fetch activities from API
  useEffect(() => {
    async function fetchActivities() {
      setIsLoading(true);
      setError(null);
      try {
        // Map filter to actor_type
        const actorType = activeFilter === 'all' ? undefined : activeFilter === 'candidate' ? 'agent' : activeFilter;
        const response = await getActivities({
          actor_type: actorType as ActivityActorType | undefined,
          limit: 100,
        });
        setActivities(response.activities);
      } catch (err) {
        console.error('Failed to fetch activities:', err);
        setError('Kon activiteiten niet laden');
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivities();
  }, [activeFilter]);

  // Fetch candidate detail when selected
  useEffect(() => {
    async function fetchCandidateDetail() {
      if (!selectedCandidateId) {
        setSelectedCandidateDetail(null);
        return;
      }

      setCandidateDetailLoading(true);
      try {
        const detail = await getCandidate(selectedCandidateId);
        setSelectedCandidateDetail(detail);
      } catch (error) {
        console.error('Failed to fetch candidate detail:', error);
        setSelectedCandidateDetail(null);
      } finally {
        setCandidateDetailLoading(false);
      }
    }

    fetchCandidateDetail();
  }, [selectedCandidateId]);

  // Fetch vacancy detail when selected
  useEffect(() => {
    async function fetchVacancyDetail() {
      if (!selectedVacancyId) {
        setSelectedVacancyDetail(null);
        return;
      }

      setVacancyDetailLoading(true);
      try {
        const detail = await getVacancyDetail(selectedVacancyId);
        setSelectedVacancyDetail(detail);
      } catch (error) {
        console.error('Failed to fetch vacancy detail:', error);
        setSelectedVacancyDetail(null);
      } finally {
        setVacancyDetailLoading(false);
      }
    }

    fetchVacancyDetail();
  }, [selectedVacancyId]);

  // Handlers
  const handleCandidateClick = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
  };

  const handleCloseCandidateDetail = () => {
    setSelectedCandidateId(null);
    setSelectedCandidateDetail(null);
  };

  const handleVacancyClick = (vacancyId: string) => {
    setSelectedVacancyId(vacancyId);
  };

  const handleCloseVacancyDetail = () => {
    setSelectedVacancyId(null);
    setSelectedVacancyDetail(null);
  };

  // Filter activities based on search (client-side)
  const filteredActivities = useMemo(() => {
    if (!searchQuery) return activities;
    const query = searchQuery.toLowerCase();
    return activities.filter(
      (a) =>
        (a.summary && a.summary.toLowerCase().includes(query)) ||
        (a.candidate_name && a.candidate_name.toLowerCase().includes(query)) ||
        (a.vacancy_title && a.vacancy_title.toLowerCase().includes(query)) ||
        (a.vacancy_company && a.vacancy_company.toLowerCase().includes(query))
    );
  }, [searchQuery, activities]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: { date: string; label: string; activities: GlobalActivity[] }[] = [];
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    filteredActivities.forEach((activity) => {
      const activityDate = new Date(activity.created_at).toDateString();
      let label = new Date(activity.created_at).toLocaleDateString('nl-BE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      if (activityDate === today) {
        label = 'Vandaag';
      } else if (activityDate === yesterday) {
        label = 'Gisteren';
      }

      const existingGroup = groups.find((g) => g.date === activityDate);
      if (existingGroup) {
        existingGroup.activities.push(activity);
      } else {
        groups.push({ date: activityDate, label, activities: [activity] });
      }
    });

    return groups;
  }, [filteredActivities]);

  return (
    <>
      <PageLayout>
        <PageLayoutHeader>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Monitor</h1>
          </div>
        </PageLayoutHeader>
        <PageLayoutContent>
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center justify-between gap-4">
              <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterType)}>
                <TabsList variant="line">
                  <TabsTrigger value="all" data-testid="filter-all">
                    <Filter className="w-3.5 h-3.5" />
                    Alle
                  </TabsTrigger>
                  <TabsTrigger value="candidate" data-testid="filter-candidate">
                    <Users className="w-3.5 h-3.5" />
                    Kandidaten
                  </TabsTrigger>
                  <TabsTrigger value="recruiter" data-testid="filter-recruiter">
                    <UserCog className="w-3.5 h-3.5" />
                    Recruiters
                  </TabsTrigger>
                  <TabsTrigger value="system" data-testid="filter-system">
                    <Settings className="w-3.5 h-3.5" />
                    Systeem
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Zoeken..."
                className="w-64"
                data-testid="activity-search"
              />
            </div>

            {/* Timeline */}
            <div className="space-y-6">
              {isLoading ? (
                <div data-testid="activities-loading" className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Loader2 className="w-8 h-8 mb-4 animate-spin" />
                  <p className="text-sm">Activiteiten laden...</p>
                </div>
              ) : error ? (
                <div data-testid="activities-error" className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <XCircle className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-sm">{error}</p>
                </div>
              ) : groupedActivities.length === 0 ? (
                <div data-testid="activities-empty" className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Bell className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-sm">Geen activiteiten gevonden</p>
                </div>
              ) : (
                groupedActivities.map((group) => (
                  <div key={group.date} data-testid={`activity-group-${group.date}`}>
                    {/* Date header */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {group.label}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* Timeline items */}
                    <div className="relative ml-1">
                      {/* Vertical line */}
                      <div className="absolute left-[4px] top-4 bottom-4 w-px bg-gray-200" />

                      {/* Activity rows */}
                      {group.activities.map((activity, index) => (
                        <ActivityRow
                          key={activity.id}
                          activity={activity}
                          index={index}
                          onCandidateClick={handleCandidateClick}
                          onVacancyClick={handleVacancyClick}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </PageLayoutContent>
      </PageLayout>

      {/* Candidate Detail Sheet */}
      <Sheet open={!!selectedCandidateId} onOpenChange={(open) => !open && handleCloseCandidateDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0" showCloseButton={false}>
          <CandidateDetailPane
            candidate={selectedCandidateDetail}
            isLoading={candidateDetailLoading}
            onClose={handleCloseCandidateDetail}
          />
        </SheetContent>
      </Sheet>

      {/* Vacancy Detail Sheet */}
      <Sheet open={!!selectedVacancyId} onOpenChange={(open) => !open && handleCloseVacancyDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0" showCloseButton={false}>
          <VacancyDetailPane
            vacancy={selectedVacancyDetail}
            isLoading={vacancyDetailLoading}
            onClose={handleCloseVacancyDetail}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
