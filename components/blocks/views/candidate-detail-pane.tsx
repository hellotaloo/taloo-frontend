'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Mail,
  Phone,
  Star,
  Briefcase,
  Loader2,
  MessageSquare,
  PhoneCall,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Award,
  Calendar,
  UserPlus,
  Archive,
  Plus,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { createCandidacy, getCandidacies } from '@/lib/candidacy-api';
import { toast } from 'sonner';
import {
  APICandidateDetail,
  APICandidateStatus,
  APIAvailabilityStatus,
  APIActivityResponse,
  APIVacancyListItem,
  Candidacy,
  CandidacyStage,
} from '@/lib/types';

export interface CandidateDetailPaneProps {
  candidate: APICandidateDetail | null;
  isLoading?: boolean;
  onClose: () => void;
  vacancies?: APIVacancyListItem[];
}

// Status badge styles
const statusStyles: Record<APICandidateStatus, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-gray-500', text: 'text-white', label: 'Nieuw' },
  qualified: { bg: 'bg-blue-500', text: 'text-white', label: 'Gekwalificeerd' },
  active: { bg: 'bg-green-500', text: 'text-white', label: 'Actief' },
  placed: { bg: 'bg-emerald-500', text: 'text-white', label: 'Geplaatst' },
  inactive: { bg: 'bg-gray-50 border border-gray-200', text: 'text-gray-500', label: 'Inactief' },
};

// Availability labels
const availabilityLabels: Record<APIAvailabilityStatus, string> = {
  available: 'Beschikbaar',
  unavailable: 'Niet beschikbaar',
  unknown: 'Onbekend',
};

// Channel icons
const channelIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  voice: PhoneCall,
  cv: FileText,
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

function StatusBadge({ status }: { status: APICandidateStatus }) {
  const style = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

function RatingDisplay({ rating }: { rating: number | undefined }) {
  if (rating === undefined || rating === null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-700">
      <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
      {rating.toFixed(1)}
    </span>
  );
}


// ─── Timeline event ───────────────────────────────────────────────────────────

const timelineEventConfig: Record<string, { icon: typeof Clock; color: string }> = {
  candidate_applied: { icon: UserPlus, color: 'text-blue-500' },
  screening_started: { icon: Clock, color: 'text-orange-500' },
  screening_completed: { icon: CheckCircle, color: 'text-green-500' },
  qualified: { icon: Award, color: 'text-green-500' },
  candidate_qualified: { icon: Award, color: 'text-green-500' },
  disqualified: { icon: XCircle, color: 'text-red-500' },
  candidate_rejected: { icon: XCircle, color: 'text-red-500' },
  interview_scheduled: { icon: Calendar, color: 'text-blue-500' },
  interview_completed: { icon: CheckCircle, color: 'text-green-500' },
  note_added: { icon: MessageSquare, color: 'text-gray-500' },
  archived: { icon: Archive, color: 'text-gray-500' },
  default: { icon: Clock, color: 'text-gray-400' },
};

function CandidateTimelineEvent({ activity, isLast }: { activity: APIActivityResponse; isLast: boolean }) {
  const config = timelineEventConfig[activity.event_type] ?? timelineEventConfig.default;
  const Icon = config.icon;
  const ChannelIcon = activity.channel ? channelIcons[activity.channel] : null;

  return (
    <div className="relative flex gap-3">
      {!isLast && (
        <div className="absolute left-[15px] top-8 w-[2px] h-[calc(100%+8px)] bg-gray-200" />
      )}
      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 shrink-0">
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {activity.summary || activity.event_type.replace(/_/g, ' ')}
            </p>
            {activity.channel && ChannelIcon && (
              <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <ChannelIcon className="w-3 h-3" />
                {activity.channel === 'whatsapp' ? 'WhatsApp' : activity.channel === 'voice' ? 'Voice' : activity.channel}
              </span>
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

// ─── Candidacy vacancy row ────────────────────────────────────────────────────

function CandidacyVacancyRow({ candidacy }: { candidacy: Candidacy }) {
  const isManual = candidacy.source === 'manual';
  const channelIcon = !isManual && candidacy.source
    ? channelIcons[candidacy.source as keyof typeof channelIcons]
    : null;
  const ChannelIcon = channelIcon || null;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="w-8 h-8 rounded-lg bg-brand-dark-blue flex items-center justify-center shrink-0">
        <Briefcase className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {candidacy.vacancy?.title ?? 'Onbekende vacature'}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
          {candidacy.vacancy?.company && (
            <span className="truncate">{candidacy.vacancy.company}</span>
          )}
          {ChannelIcon && (
            <span className="flex items-center gap-1 shrink-0">
              <ChannelIcon className="w-3 h-3" />
            </span>
          )}
          {isManual && <span className="shrink-0">Manueel</span>}
        </div>
      </div>
      <span className="text-xs text-gray-500 shrink-0 bg-gray-200 rounded px-1.5 py-0.5">
        {STAGE_LABELS[candidacy.stage] ?? candidacy.stage}
      </span>
    </div>
  );
}

// ─── Add vacancy modal ────────────────────────────────────────────────────────

interface AddVacancyModalProps {
  candidateId: string;
  vacancies: APIVacancyListItem[];
  onSuccess: () => void;
  onClose: () => void;
}

function AddVacancyModal({ candidateId, vacancies, onSuccess, onClose }: AddVacancyModalProps) {
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  const filtered = query.trim()
    ? vacancies.filter(
        (v) =>
          v.title.toLowerCase().includes(query.toLowerCase()) ||
          v.company.toLowerCase().includes(query.toLowerCase())
      )
    : vacancies;

  const handleAdd = async (vacancy: APIVacancyListItem) => {
    setAdding(vacancy.id);
    try {
      await createCandidacy({
        candidate_id: candidateId,
        vacancy_id: vacancy.id,
        stage: 'new',
        source: 'manual',
      });
      toast.success(`Toegevoegd aan "${vacancy.title}"`);
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
          <DialogTitle>Vacature toevoegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op titel of bedrijf..."
              className="pl-9"
              autoFocus
            />
          </div>

          {filtered.length > 0 ? (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {filtered.map((v) => (
                <button
                  key={v.id}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                  onClick={() => handleAdd(v)}
                  disabled={!!adding}
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-dark-blue flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{v.title}</p>
                    <p className="text-xs text-gray-500 truncate">{v.company}</p>
                  </div>
                  {adding === v.id && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Geen vacatures gevonden</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CandidateDetailPane({ candidate, isLoading, onClose, vacancies = [] }: CandidateDetailPaneProps) {
  const [activeTab, setActiveTab] = useState<'vacatures' | 'tijdlijn'>('vacatures');
  const [showAddVacancyModal, setShowAddVacancyModal] = useState(false);
  const [candidacies, setCandidacies] = useState<Candidacy[]>([]);
  const [candidaciesLoading, setCandidaciesLoading] = useState(false);

  const fetchCandidacies = useCallback(async (candidateId: string) => {
    setCandidaciesLoading(true);
    try {
      const result = await getCandidacies({ candidate_id: candidateId });
      // Filter out talent pool entries (no linked vacancy)
      setCandidacies(result.items.filter((c) => c.vacancy !== null));
    } catch {
      toast.error('Kon vacatures niet laden');
    } finally {
      setCandidaciesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (candidate?.id) fetchCandidacies(candidate.id);
    else setCandidacies([]);
  }, [candidate?.id, fetchCandidacies]);

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

  if (!candidate) return null;

  // Separate skills and certificates
  const skills = candidate.skills.filter(s => s.skill_category !== 'certificates');
  const certificates = candidate.skills.filter(s => s.skill_category === 'certificates');

  const timeline = candidate.timeline ?? [];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{candidate.full_name}</h2>
              <StatusBadge status={candidate.status} />
              <RatingDisplay rating={candidate.rating} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {candidate.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {candidate.email}
                </span>
              )}
              {candidate.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {candidate.phone}
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
          {/* Rating */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Beoordeling
            </p>
            {candidate.rating !== undefined && candidate.rating !== null ? (
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                {candidate.rating.toFixed(1)}
              </p>
            ) : (
              <p className="text-sm text-gray-400">-</p>
            )}
          </div>

          {/* Availability */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Beschikbaarheid
            </p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {candidate.available_from
                ? `Vanaf ${formatDate(candidate.available_from)}`
                : availabilityLabels[candidate.availability]}
            </p>
          </div>

          {/* Vacancies Count */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Vacatures
            </p>
            <p className="text-sm font-medium text-gray-900">
              {candidaciesLoading ? '…' : candidacies.length} totaal
            </p>
          </div>
        </div>

        {/* Skills & Certificates */}
        {(skills.length > 0 || certificates.length > 0) && (
          <div className="mt-4">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2">
              Vaardigheden & Certificaten
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600"
                >
                  {skill.skill_name.charAt(0).toUpperCase() + skill.skill_name.slice(1)}
                </span>
              ))}
              {certificates.map((cert) => (
                <span
                  key={cert.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700"
                >
                  {cert.skill_name.charAt(0).toUpperCase() + cert.skill_name.slice(1)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 border-b border-gray-200 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('vacatures')}
              className={cn(
                'py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === 'vacatures'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              Vacatures ({candidaciesLoading ? '…' : candidacies.length})
            </button>
            <button
              onClick={() => setActiveTab('tijdlijn')}
              className={cn(
                'py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === 'tijdlijn'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              Tijdlijn ({timeline.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'vacatures' && (
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pipeline
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setShowAddVacancyModal(true)}
                >
                  <Plus className="w-3 h-3" />
                  Vacature toevoegen
                </Button>
              </div>
              {candidaciesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              ) : candidacies.length > 0 ? (
                <div className="space-y-2">
                  {candidacies.map((c) => (
                    <CandidacyVacancyRow key={c.id} candidacy={c} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">
                  Geen vacatures
                </p>
              )}
            </div>
          )}

          {activeTab === 'tijdlijn' && (
            <div className="px-6 py-4">
              {timeline.length > 0 ? (
                <div className="space-y-0">
                  {timeline.map((event, index) => (
                    <CandidateTimelineEvent
                      key={event.id}
                      activity={event}
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

      {showAddVacancyModal && (
        <AddVacancyModal
          candidateId={candidate.id}
          vacancies={vacancies}
          onSuccess={() => fetchCandidacies(candidate.id)}
          onClose={() => setShowAddVacancyModal(false)}
        />
      )}
    </div>
  );
}
