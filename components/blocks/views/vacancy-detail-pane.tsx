'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Plus,
  Search,
  ClipboardList,
  Stethoscope,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/kit/status-badge';
import { MarkdownContent } from '@/components/kit/markdown-content';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getCandidates, getWorkstationSheet, setWorkstationSheetParam, deleteWorkstationSheetParam, getMedicalRisks, patchVacancy, type WorkstationSheetParam, type MedicalRiskOption } from '@/lib/api';
import { getCandidacies, createCandidacy } from '@/lib/candidacy-api';
import { APIVacancyDetail, APIActivityResponse, APIApplicantSummary, VacancyAgents, AgentStatusInfo, Candidacy, CandidacyStage, APICandidateListItem } from '@/lib/types';
import { toast } from 'sonner';

export interface VacancyDetailPaneProps {
  vacancy: APIVacancyDetail | null;
  isLoading?: boolean;
  onClose: () => void;
  onCandidateClick?: (candidateId: string) => void;
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
      <div className="flex-1 pt-1.5 pb-4">
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

type TabType = 'candidates' | 'agents' | 'timeline' | 'description' | 'werkpostfiche';

// Agent type configuration
const agentTypeConfig: Record<string, { label: string; icon: typeof PhoneCall; description: string }> = {
  prescreening: {
    label: 'Pre-screening',
    icon: PhoneCall,
    description: 'Voert telefonische en WhatsApp screenings uit'
  },
  preonboarding: {
    label: 'Documentcollectie',
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
        {agent.status !== null && (
          <StatusBadge
            label={agent.status === 'online' ? 'Online' : 'Offline'}
            variant={agent.status === 'online' ? 'green' : 'gray'}
          />
        )}
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

// ─── Stage labels ─────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<CandidacyStage, string> = {
  new: 'Nieuw',
  pre_screening: 'Pre-screening',
  qualified: 'Gekwalificeerd',
  interview_planned: 'Interview gepland',
  interview_done: 'Interview afgerond',
  offer: 'Aanbod',
  placed: 'Geplaatst',
  rejected: 'Afgewezen',
  withdrawn: 'Teruggetrokken',
};

// ─── Candidate avatar ─────────────────────────────────────────────────────────

function CandidateAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-brand-dark-blue text-white flex items-center justify-center text-[10px] font-semibold shrink-0">
      {initials}
    </div>
  );
}

// ─── Candidacy row ────────────────────────────────────────────────────────────

function CandidacyRow({ candidacy, onClick }: { candidacy: Candidacy; onClick?: (candidateId: string) => void }) {
  return (
    <button
      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
      onClick={() => onClick?.(candidacy.candidate_id)}
    >
      <CandidateAvatar name={candidacy.candidate.full_name} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{candidacy.candidate.full_name}</p>
        {candidacy.candidate.email && (
          <p className="text-xs text-gray-500 truncate">{candidacy.candidate.email}</p>
        )}
      </div>
      <span className="text-xs text-gray-500 shrink-0 bg-gray-200 rounded px-1.5 py-0.5">
        {STAGE_LABELS[candidacy.stage] ?? candidacy.stage}
      </span>
    </button>
  );
}

// ─── Add candidate modal ──────────────────────────────────────────────────────

interface AddCandidateModalProps {
  vacancyId: string;
  onSuccess: () => void;
  onClose: () => void;
}

function AddCandidateModal({ vacancyId, onSuccess, onClose }: AddCandidateModalProps) {
  const [query, setQuery] = useState('');
  const [allCandidates, setAllCandidates] = useState<APICandidateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const resp = await getCandidates({ limit: 100 });
        setAllCandidates(resp.items);
      } catch {
        toast.error('Kon kandidaten niet laden');
      } finally {
        setLoading(false);
      }
    }
    fetchCandidates();
  }, []);

  const filtered = query.trim()
    ? allCandidates.filter(
        (c) =>
          c.full_name.toLowerCase().includes(query.toLowerCase()) ||
          (c.email && c.email.toLowerCase().includes(query.toLowerCase())) ||
          (c.phone && c.phone.includes(query))
      )
    : allCandidates;

  const handleAdd = async (candidate: APICandidateListItem) => {
    setAdding(candidate.id);
    try {
      await createCandidacy({
        candidate_id: candidate.id,
        vacancy_id: vacancyId,
        stage: 'new',
        source: 'manual',
      });
      toast.success(`${candidate.full_name} toegevoegd aan pipeline`);
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof Error && err.message === 'CONFLICT') {
        toast.error('Kandidaat staat al in deze pipeline');
      } else {
        toast.error('Toevoegen mislukt');
      }
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kandidaat toevoegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op naam, e-mail of telefoon..."
              className="pl-9"
              autoFocus
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                  onClick={() => handleAdd(c)}
                  disabled={!!adding}
                >
                  <CandidateAvatar name={c.full_name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.full_name}</p>
                    {c.email && <p className="text-xs text-gray-500 truncate">{c.email}</p>}
                  </div>
                  {adding === c.id && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Geen kandidaten gevonden</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Medical risks selector ──────────────────────────────────────────────────

function MedicalRisksSelector({
  vacancyId,
  value,
  onChange,
}: {
  vacancyId: string;
  value: { id: string; name: string }[];
  onChange: (risks: { id: string; name: string }[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<MedicalRiskOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch options when query changes
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await getMedicalRisks(query || undefined);
        if (!controller.signal.aborted) {
          setOptions(results);
        }
      } catch {
        // ignore
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 300 : 0);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedIds = new Set(value.map(v => v.id));

  const handleSelect = (option: MedicalRiskOption) => {
    if (selectedIds.has(option.id)) {
      onChange(value.filter(v => v.id !== option.id));
    } else {
      onChange([...value, { id: option.id, name: option.name }]);
    }
  };

  const handleRemove = (id: string) => {
    onChange(value.filter(v => v.id !== id));
  };

  return (
    <div className="p-2.5 bg-gray-50 rounded-lg" ref={containerRef}>
      <span className="text-sm text-gray-700">Risico&apos;s</span>

      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map(risk => (
            <span
              key={risk.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-gray-200 text-xs text-gray-700"
            >
              {risk.name}
              <button
                onClick={() => handleRemove(risk.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative mt-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Zoek risico..."
          className="h-8 pl-8 text-xs bg-white"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
            </div>
          ) : options.length > 0 ? (
            options.map(option => (
              <button
                key={option.id}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors',
                  selectedIds.has(option.id) && 'bg-blue-50 text-blue-700'
                )}
                onClick={() => handleSelect(option)}
              >
                <div className={cn(
                  'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                  selectedIds.has(option.id)
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300'
                )}>
                  {selectedIds.has(option.id) && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
                {option.name}
              </button>
            ))
          ) : (
            <p className="text-xs text-gray-400 text-center py-3">Geen resultaten</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tabs section ─────────────────────────────────────────────────────────────

function TabsSection({
  vacancyId,
  timeline,
  applicants,
  agents,
  description,
  onCandidateClick
}: {
  vacancyId: string;
  timeline: APIActivityResponse[];
  applicants: APIApplicantSummary[];
  agents?: VacancyAgents;
  description?: string;
  onCandidateClick?: (candidateId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [candidacies, setCandidacies] = useState<Candidacy[]>([]);
  const [candidaciesLoading, setCandidaciesLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [werkpostfiche, setWerkpostfiche] = useState<WorkstationSheetParam[]>([]);
  const [werkpostficheLoading, setWerkpostficheLoading] = useState(false);

  const fetchCandidacies = useCallback(async () => {
    setCandidaciesLoading(true);
    try {
      const result = await getCandidacies({ vacancy_id: vacancyId });
      setCandidacies(result.items);
    } catch {
      toast.error('Kon kandidaten niet laden');
    } finally {
      setCandidaciesLoading(false);
    }
  }, [vacancyId]);

  const fetchWerkpostfiche = useCallback(async () => {
    setWerkpostficheLoading(true);
    try {
      const data = await getWorkstationSheet(vacancyId);
      setWerkpostfiche(data);
    } catch {
      setWerkpostfiche([]);
    } finally {
      setWerkpostficheLoading(false);
    }
  }, [vacancyId]);

  useEffect(() => {
    fetchCandidacies();
    fetchWerkpostfiche();
  }, [fetchCandidacies, fetchWerkpostfiche]);

  const activeAgentsCount = agents
    ? Object.values(agents).filter((a) => a.exists).length
    : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab buttons */}
      <div className="shrink-0 border-b border-gray-200 px-6">
        <div className="flex gap-6">
          {([
            { key: 'timeline' as const, label: 'Tijdlijn', count: timeline.length },
            { key: 'candidates' as const, label: 'Kandidaten', count: candidaciesLoading ? -1 : candidacies.length },
            { key: 'werkpostfiche' as const, label: 'Werkpostfiche', count: werkpostfiche.length },
            { key: 'description' as const, label: 'Vacaturetekst', count: 0 },
            { key: 'agents' as const, label: 'Agents', count: activeAgentsCount },
          ]).map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'py-3 text-sm font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5',
                  isActive
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.label}
                {tab.count !== 0 && (
                  <span className={cn(
                    'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold',
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-500'
                  )}>
                    {tab.count === -1 ? '…' : tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'candidates' && (
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Pipeline
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-3 h-3" />
                Kandidaat toevoegen
              </Button>
            </div>
            {candidaciesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : candidacies.length > 0 ? (
              <div className="space-y-2">
                {candidacies.map((c) => (
                  <CandidacyRow key={c.id} candidacy={c} onClick={onCandidateClick} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                Geen kandidaten
              </p>
            )}
          </div>
        )}
        {activeTab === 'description' && (
          <div className="px-6 py-4">
            {description ? (
              <MarkdownContent content={description} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                Geen vacaturetekst
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
        {activeTab === 'werkpostfiche' && (
          <div className="px-6 py-4">
            {werkpostficheLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Medisch category */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">Medisch onderzoek</span>
                  </div>
                  <div className="space-y-1.5">
                    {/* Medical check toggle */}
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Verplicht gezondheidstoezicht</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn(
                          'text-sm',
                          werkpostfiche.find(p => p.param_key === 'medical_check')
                            ? 'font-medium text-green-700'
                            : 'text-gray-400'
                        )}>
                          {werkpostfiche.find(p => p.param_key === 'medical_check') ? 'Vereist' : 'Niet vereist'}
                        </span>
                        <Switch
                          checked={!!werkpostfiche.find(p => p.param_key === 'medical_check')}
                          onCheckedChange={async (checked) => {
                            if (checked) {
                              await setWorkstationSheetParam(vacancyId, 'medical_check', 'yes');
                            } else {
                              await deleteWorkstationSheetParam(vacancyId, 'medical_check');
                              // Also clear risks when disabling
                              await deleteWorkstationSheetParam(vacancyId, 'medical_risks');
                            }
                            fetchWerkpostfiche();
                          }}
                        />
                      </div>
                    </div>

                    {/* Medical risks — only when medical_check is enabled */}
                    {werkpostfiche.find(p => p.param_key === 'medical_check') && (
                      <MedicalRisksSelector
                        vacancyId={vacancyId}
                        value={(() => {
                          const param = werkpostfiche.find(p => p.param_key === 'medical_risks');
                          if (!param) return [];
                          try { return JSON.parse(param.param_value) as { id: string; name: string }[]; }
                          catch { return []; }
                        })()}
                        onChange={async (risks) => {
                          if (risks.length > 0) {
                            await setWorkstationSheetParam(vacancyId, 'medical_risks', JSON.stringify(risks));
                          } else {
                            await deleteWorkstationSheetParam(vacancyId, 'medical_risks');
                          }
                          fetchWerkpostfiche();
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddCandidateModal
          vacancyId={vacancyId}
          onSuccess={fetchCandidacies}
          onClose={() => setShowAddModal(false)}
        />
      )}
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

// ─── Inline start date editor ────────────────────────────────────────────────

function StartDateField({ vacancyId, value }: { vacancyId: string; value?: string | null }) {
  const [editing, setEditing] = useState(false);
  const [savedValue, setSavedValue] = useState(value ?? '');
  const [dateValue, setDateValue] = useState(value ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSavedValue(value ?? '');
    setDateValue(value ?? '');
  }, [value]);

  const handleSave = async (newValue: string) => {
    setSaving(true);
    try {
      await patchVacancy(vacancyId, { start_date: newValue || null });
      setSavedValue(newValue);
      setEditing(false);
      toast.success('Startdatum opgeslagen');
    } catch {
      toast.error('Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = savedValue
    ? new Date(savedValue + 'T00:00:00').toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
          className="h-7 text-xs w-36"
          disabled={saving}
          autoFocus
        />
        <Button size="sm" className="h-7 text-[10px] px-2" onClick={() => handleSave(dateValue)} disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'OK'}
        </Button>
        <button onClick={() => { setEditing(false); setDateValue(savedValue); }} className="p-1 rounded hover:bg-gray-200">
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors group"
    >
      {formattedDate ? (
        <span>{formattedDate}</span>
      ) : (
        <span className="text-gray-400 font-normal group-hover:text-gray-500">Instellen</span>
      )}
    </button>
  );
}

export function VacancyDetailPane({ vacancy, isLoading, onClose, onCandidateClick }: VacancyDetailPaneProps) {
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

          {/* Start date */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Startdatum
            </p>
            <StartDateField vacancyId={vacancy.id} value={vacancy.start_date} />
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
          <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {vacancy.recruiter.avatar_url ? (
              <img
                src={vacancy.recruiter.avatar_url}
                alt={vacancy.recruiter.name}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-gray-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{vacancy.recruiter.name}</p>
              {vacancy.recruiter.team && (
                <p className="text-xs text-gray-500">{vacancy.recruiter.team}</p>
              )}
            </div>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide shrink-0">
              Recruiter
            </span>
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
      <TabsSection
        vacancyId={vacancy.id}
        timeline={timeline}
        applicants={vacancy.applicants || []}
        agents={vacancy.agents}
        description={vacancy.description}
        onCandidateClick={onCandidateClick}
      />
    </div>
  );
}
