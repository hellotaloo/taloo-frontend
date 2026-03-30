'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
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
  ShieldCheck,
  Car,
  Wallet,
  User,
  Tag,
  FileCheck,
  Pencil,
  Trash2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn, formatPhoneNumber } from '@/lib/utils';
import { useTranslations, useLocale } from '@/lib/i18n';
import { createCandidacy } from '@/lib/candidacy-api';
import { putCandidateAttribute, deleteCandidateAttribute, getVacanciesFromAPI } from '@/lib/api';
import { getAttributeTypes } from '@/lib/attribute-types-api';
import { toast } from 'sonner';
import { CandidacyArtifacts } from './candidacy-artifacts';
import {
  APICandidateDetail,
  APICandidateStatus,
  APIAvailabilityStatus,
  APIActivityResponse,
  APIVacancyListItem,
  CandidacySummary,
  CandidacyStage,
  AttributeSummary,
  AttributeType,
  DocumentSummary,
} from '@/lib/types';

export interface CandidateDetailPaneProps {
  candidate: APICandidateDetail | null;
  isLoading?: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onVacancyClick?: (vacancyId: string) => void;
}

// Status badge styles (labels resolved via i18n at render time)
const statusStyles: Record<APICandidateStatus, { bg: string; text: string; labelKey: string }> = {
  new: { bg: 'bg-gray-500', text: 'text-white', labelKey: 'new' },
  qualified: { bg: 'bg-blue-500', text: 'text-white', labelKey: 'qualified' },
  active: { bg: 'bg-green-500', text: 'text-white', labelKey: 'active' },
  placed: { bg: 'bg-emerald-500', text: 'text-white', labelKey: 'placed' },
  inactive: { bg: 'bg-gray-50 border border-gray-200', text: 'text-gray-500', labelKey: 'inactive' },
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

function formatDate(dateString: string, locale: string = 'nl-BE') {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string, locale: string = 'nl-BE') {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: APICandidateStatus }) {
  const t = useTranslations('candidateDetail');
  const style = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {t(style.labelKey)}
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
  const { locale } = useLocale();
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
      <div className="flex-1 pt-1.5 pb-4">
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
            {formatDateTime(activity.created_at, locale)}
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
  offer: 'Onboarden & contract',
  placed: 'Geplaatst',
  rejected: 'Afgewezen',
  withdrawn: 'Teruggetrokken',
};

// ─── Candidacy vacancy row ────────────────────────────────────────────────────

function CandidacyVacancyRow({ candidacy, onClick }: { candidacy: CandidacySummary; onClick?: (vacancyId: string) => void }) {
  const isManual = candidacy.source === 'manual';
  const channelIcon = !isManual && candidacy.source
    ? channelIcons[candidacy.source as keyof typeof channelIcons]
    : null;
  const ChannelIcon = channelIcon || null;
  const isClickable = !!onClick && !!candidacy.vacancy_id;

  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-left transition-colors",
        isClickable && "hover:bg-gray-100"
      )}
      onClick={() => isClickable && onClick!(candidacy.vacancy_id!)}
      disabled={!isClickable}
    >
      <div className="w-8 h-8 rounded-lg bg-brand-dark-blue flex items-center justify-center shrink-0">
        <Briefcase className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {candidacy.vacancy_title ?? 'Onbekende vacature'}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
          {candidacy.vacancy_company && (
            <span className="truncate">{candidacy.vacancy_company}</span>
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
    </button>
  );
}

// ─── Add vacancy modal ────────────────────────────────────────────────────────

interface AddVacancyModalProps {
  candidateId: string;
  excludeVacancyIds?: string[];
  onSuccess: () => void;
  onClose: () => void;
}

function AddVacancyModal({ candidateId, excludeVacancyIds = [], onSuccess, onClose }: AddVacancyModalProps) {
  const t = useTranslations('candidateDetail');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [vacancies, setVacancies] = useState<APIVacancyListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVacancies() {
      try {
        const resp = await getVacanciesFromAPI({ limit: 100 });
        setVacancies(resp.items);
      } catch {
        toast.error('Kon vacatures niet laden');
      } finally {
        setLoading(false);
      }
    }
    fetchVacancies();
  }, []);

  const available = vacancies.filter((v) => !excludeVacancyIds.includes(v.id));

  const filtered = query.trim()
    ? available.filter(
        (v) =>
          v.title.toLowerCase().includes(query.toLowerCase()) ||
          v.company.toLowerCase().includes(query.toLowerCase())
      )
    : available;

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
        toast.error(t('alreadyInPipeline'));
      } else {
        toast.error(t('addFailed'));
      }
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addVacancy')}</DialogTitle>
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

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          ) : filtered.length > 0 ? (
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
            <p className="text-sm text-gray-400 text-center py-4">{t('noVacanciesFound')}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CandidateDetailPane({ candidate, isLoading, onClose, onRefresh, onVacancyClick }: CandidateDetailPaneProps) {
  const t = useTranslations('candidateDetail');
  const { locale } = useLocale();
  const [activeTab, setActiveTab] = useState<'tijdlijn' | 'vacatures' | 'kenmerken' | 'resultaten'>('tijdlijn');
  const [showAddVacancyModal, setShowAddVacancyModal] = useState(false);
  const [showAddAttributeModal, setShowAddAttributeModal] = useState(false);

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
  const candidacies = candidate.candidacies?.filter((c) => c.vacancy_id !== undefined) ?? [];
  const attributes = candidate.attributes ?? [];
  const documents = candidate.documents ?? [];

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
                  {formatPhoneNumber(candidate.phone)}
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
                ? `Vanaf ${formatDate(candidate.available_from, locale)}`
                : availabilityLabels[candidate.availability]}
            </p>
          </div>

          {/* Vacancies Count */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              {t('vacancies')}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {candidacies.length} totaal
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

        {/* Meta info */}
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Synced: {formatDate(candidate.created_at, locale)}
          </span>
          {candidate.last_activity && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {t('lastActivity')} {formatDate(candidate.last_activity, locale)}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 border-b border-gray-200 px-6">
          <div className="flex gap-6">
            {([
              { key: 'tijdlijn' as const, label: 'Tijdlijn', count: timeline.length },
              { key: 'vacatures' as const, label: t('vacancies'), count: candidacies.length },
              { key: 'kenmerken' as const, label: 'Gegevens', count: attributes.length + documents.length },
              { key: 'resultaten' as const, label: 'Agents', count: candidacies.filter(c => c.screening_result || c.document_collection).length },
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
                  {tab.count > 0 && (
                    <span className={cn(
                      'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold',
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-500'
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
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
                  {t('addVacancy')}
                </Button>
              </div>
              {candidacies.length > 0 ? (
                <div className="space-y-2">
                  {candidacies.map((c) => (
                    <CandidacyVacancyRow key={c.id} candidacy={c} onClick={onVacancyClick} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">
                  {t('noVacancies')}
                </p>
              )}
            </div>
          )}
          {activeTab === 'kenmerken' && (
            <div className="px-6 py-4 space-y-6">
              {/* Attributes grouped by category */}
              <AttributesSection
                attributes={attributes}
                candidateId={candidate.id}
                onRefresh={onRefresh}
                onAddClick={() => setShowAddAttributeModal(true)}
              />

              {/* Documents */}
              {documents.length > 0 && (
                <DocumentsSection documents={documents} />
              )}

            </div>
          )}

          {activeTab === 'resultaten' && (
            <div className="px-6 py-4">
              <CandidacyArtifacts candidacies={candidacies} />
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
                  {t('noActivity')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddVacancyModal && (
        <AddVacancyModal
          candidateId={candidate.id}
          excludeVacancyIds={candidacies.map((c) => c.vacancy_id).filter(Boolean) as string[]}
          onSuccess={() => onRefresh?.()}
          onClose={() => setShowAddVacancyModal(false)}
        />
      )}

      {showAddAttributeModal && (
        <AddAttributeModal
          candidateId={candidate.id}
          existingAttributeTypeIds={attributes.map((a) => a.attribute_type_id)}
          onSuccess={() => onRefresh?.()}
          onClose={() => setShowAddAttributeModal(false)}
        />
      )}
    </div>
  );
}

// ─── Attributes section ──────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Tag }> = {
  legal: { label: 'Juridisch', icon: ShieldCheck },
  transport: { label: 'Vervoer', icon: Car },
  availability: { label: 'Beschikbaarheid', icon: Calendar },
  financial: { label: 'Financieel', icon: Wallet },
  personal: { label: 'Persoonlijk', icon: User },
  general: { label: 'Algemeen', icon: Tag },
};

const SOURCE_LABELS: Record<string, string> = {
  pre_screening: 'Pre-screening agent',
  contract: 'Contract',
  manual: 'Handmatig',
  cv_analysis: 'CV-analyse',
  document_collection_agent: 'Document collectie agent',
};

const SOURCE_KOPPELING: Record<string, string> = {
  document_collection_agent: 'PratoFlex',
};

function AttributeSourceInfo({ source }: { source: string }) {
  const t = useTranslations('candidateDetail');
  const label = SOURCE_LABELS[source] ?? source;
  const koppeling = SOURCE_KOPPELING[source];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="p-0.5 rounded-full text-gray-300 hover:text-gray-500 transition-colors">
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-0.5 text-xs">
          <div>
            <span className="text-gray-400">{t('source')} </span>
            <span>{label}</span>
          </div>
          {koppeling && (
            <div>
              <span className="text-gray-400">Koppeling: </span>
              <span>{koppeling}</span>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function tryParseJson(value: string): Record<string, unknown> | null {
  if (!value.startsWith('{') && !value.startsWith('[')) return null;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
    return null;
  } catch {
    return null;
  }
}

function isAddressLike(data: Record<string, unknown>): boolean {
  const keys = Object.keys(data);
  return ['street', 'postcode', 'city', 'stad'].some((k) => keys.includes(k));
}

function isContactLike(data: Record<string, unknown>): boolean {
  const keys = Object.keys(data);
  return keys.includes('name') && keys.includes('phone');
}

function formatAddress(data: Record<string, unknown>): string {
  const street = data.street ?? '';
  const number = data.number ?? '';
  const city = data.stad ?? data.city ?? '';
  const postcode = data.postcode ?? '';
  const country = data.country ?? '';

  const line1 = [street, number].filter(Boolean).join(' ');
  const line2 = [postcode, city].filter(Boolean).join(' ');
  return [line1, line2, country].filter(Boolean).join(', ');
}

function JsonValue({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );
  if (entries.length === 0) return <span className="text-gray-400">-</span>;

  // Format addresses nicely
  if (isAddressLike(data)) {
    return <span className="text-sm text-gray-900">{formatAddress(data)}</span>;
  }

  // Format contacts nicely
  if (isContactLike(data)) {
    return (
      <div className="text-sm text-gray-900">
        <span>{String(data.name)}</span>
        {data.phone != null && (
          <span className="text-gray-500 ml-2">{formatPhoneNumber(String(data.phone))}</span>
        )}
      </div>
    );
  }

  // Generic fallback — clean key-value display
  return (
    <div className="text-sm text-gray-900 space-y-0.5">
      {entries.map(([key, val]) => (
        <div key={key}>
          <span className="text-gray-400 text-xs mr-1.5">{key}:</span>
          <span>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
        </div>
      ))}
    </div>
  );
}

function formatAttributeValue(attr: AttributeSummary): ReactNode {
  if (attr.value === undefined || attr.value === null) return '-';

  switch (attr.data_type) {
    case 'boolean': {
      const v = attr.value.toLowerCase();
      return (v === 'true' || v === 'ja' || v === 'yes' || v === '1') ? 'Ja' : 'Nee';
    }
    case 'date': {
      const d = new Date(attr.value);
      return d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    case 'select': {
      const opt = attr.options?.find((o) => o.value === attr.value);
      return opt?.label ?? attr.value;
    }
    case 'multi_select': {
      const values = attr.value.split(',');
      return values
        .map((v) => attr.options?.find((o) => o.value === v.trim())?.label ?? v.trim())
        .join(', ');
    }
    default: {
      const json = tryParseJson(attr.value);
      if (json) return <JsonValue data={json} />;
      return attr.value;
    }
  }
}

interface AttributesSectionProps {
  attributes: AttributeSummary[];
  candidateId: string;
  onRefresh?: () => void;
  onAddClick: () => void;
}

function AttributesSection({ attributes, candidateId, onRefresh, onAddClick }: AttributesSectionProps) {
  const t = useTranslations('candidateDetail');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteAttr, setConfirmDeleteAttr] = useState<AttributeSummary | null>(null);

  const grouped = attributes.reduce<Record<string, AttributeSummary[]>>((acc, attr) => {
    const cat = attr.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(attr);
    return acc;
  }, {});

  const categoryOrder = ['legal', 'transport', 'availability', 'financial', 'personal', 'general'];
  const sortedCategories = categoryOrder.filter((cat) => grouped[cat]?.length);

  const startEdit = (attr: AttributeSummary) => {
    setEditingId(attr.id);
    setEditValue(attr.value ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (attr: AttributeSummary, value: string) => {
    setSaving(true);
    try {
      await putCandidateAttribute(candidateId, {
        attribute_type_id: attr.attribute_type_id,
        value,
        source: 'manual',
      });
      toast.success(`${attr.name} opgeslagen`);
      setEditingId(null);
      onRefresh?.();
    } catch {
      toast.error(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (attr: AttributeSummary) => {
    // Confirm if agent-collected
    if (attr.source && attr.source !== 'manual') {
      setConfirmDeleteAttr(attr);
      return;
    }
    await doDelete(attr);
  };

  const doDelete = async (attr: AttributeSummary) => {
    setDeletingId(attr.id);
    setConfirmDeleteAttr(null);
    try {
      await deleteCandidateAttribute(candidateId, attr.id);
      toast.success(`${attr.name} verwijderd`);
      onRefresh?.();
    } catch {
      toast.error(t('deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Kenmerken
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={onAddClick}
        >
          <Plus className="w-3 h-3" />
          Kenmerk toevoegen
        </Button>
      </div>

      {sortedCategories.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">{t('noAttributes')}</p>
      )}

      {sortedCategories.map((category) => {
        const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.general;
        const CategoryIcon = config.icon;
        return (
          <div key={category}>
            <div className="flex items-center gap-1.5 mb-2">
              <CategoryIcon className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">{config.label}</span>
            </div>
            <div className="rounded-lg border border-gray-100 divide-y divide-gray-100 bg-white">
              {grouped[category].map((attr) => {
                const isJson = attr.value != null && tryParseJson(attr.value) !== null;
                const jsonData = attr.value != null ? tryParseJson(attr.value) : null;
                const isAddress = jsonData != null && isAddressLike(jsonData);
                // Addresses can be shown inline even though they're JSON
                const showInline = !isJson || isAddress;

                return (
                  <div
                    key={attr.id}
                    className={cn(
                      "group relative px-3 py-2.5 hover:pr-12",
                      showInline ? "flex items-center justify-between gap-3" : "flex flex-col gap-1"
                    )}
                  >
                    {showInline ? (
                      <>
                        <div className="flex items-center gap-2 min-w-0 shrink-0">
                          <span className="text-sm text-gray-500">{attr.name}</span>
                          {attr.verified && (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 min-w-0 justify-end">
                          {editingId === attr.id ? (
                            <InlineAttributeEditor
                              attr={attr}
                              value={editValue}
                              onChange={setEditValue}
                              onSave={(v) => saveEdit(attr, v)}
                              onCancel={cancelEdit}
                              saving={saving}
                            />
                          ) : (
                            <>
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {formatAttributeValue(attr)}
                              </span>
                              {attr.source && attr.source !== 'manual' && (
                                <AttributeSourceInfo source={attr.source} />
                              )}
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm text-gray-500">{attr.name}</span>
                            {attr.verified && (
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            )}
                          </div>
                          {attr.source && attr.source !== 'manual' && (
                            <AttributeSourceInfo source={attr.source} />
                          )}
                        </div>
                        <div className="pl-0.5">
                          {formatAttributeValue(attr)}
                        </div>
                      </>
                    )}
                    {/* Hover actions — absolutely positioned past the info icon */}
                    {editingId !== attr.id && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                        <button
                          onClick={() => startEdit(attr)}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          <Pencil className="w-3 h-3 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(attr)}
                          disabled={deletingId === attr.id}
                          className="p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {deletingId === attr.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                          ) : (
                            <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Delete confirmation for agent-collected attributes */}
      {confirmDeleteAttr && (
        <Dialog open onOpenChange={(open) => !open && setConfirmDeleteAttr(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Kenmerk verwijderen?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">
              &ldquo;{confirmDeleteAttr.name}&rdquo; is verzameld via{' '}
              <span className="font-medium">
                {SOURCE_LABELS[confirmDeleteAttr.source!] ?? confirmDeleteAttr.source}
              </span>
              . Weet je zeker dat je dit wilt verwijderen?
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDeleteAttr(null)}>
                {t('cancel')}
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => doDelete(confirmDeleteAttr)}
              >
                {t('delete')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Inline attribute editor ─────────────────────────────────────────────────

interface InlineAttributeEditorProps {
  attr: AttributeSummary;
  value: string;
  onChange: (v: string) => void;
  onSave: (v: string) => void;
  onCancel: () => void;
  saving: boolean;
}

function InlineAttributeEditor({ attr, value, onChange, onSave, onCancel, saving }: InlineAttributeEditorProps) {
  const t = useTranslations('candidateDetail');
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave(value);
    if (e.key === 'Escape') onCancel();
  };

  switch (attr.data_type) {
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={value === 'true'}
            onCheckedChange={(checked) => onSave(checked ? 'true' : 'false')}
            disabled={saving}
          />
          {saving && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
        </div>
      );

    case 'select':
      return (
        <div className="flex items-center gap-1">
          <Select
            value={value}
            onValueChange={(v) => onSave(v)}
            disabled={saving}
          >
            <SelectTrigger className="h-7 text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {attr.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={onCancel} className="p-1 rounded hover:bg-gray-200">
            <X className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      );

    case 'multi_select': {
      const selected = value ? value.split(',').map((v) => v.trim()) : [];
      const toggle = (optValue: string) => {
        const next = selected.includes(optValue)
          ? selected.filter((v) => v !== optValue)
          : [...selected, optValue];
        onChange(next.join(','));
      };
      return (
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap gap-1.5 justify-end">
            {attr.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1 text-xs cursor-pointer">
                <Checkbox
                  checked={selected.includes(opt.value)}
                  onCheckedChange={() => toggle(opt.value)}
                  disabled={saving}
                  className="h-3.5 w-3.5"
                />
                {opt.label}
              </label>
            ))}
          </div>
          <div className="flex gap-1">
            <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => onSave(value)} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : t('save')}
            </Button>
            <button onClick={onCancel} className="p-1 rounded hover:bg-gray-200">
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
      );
    }

    case 'date':
      return (
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-xs w-36"
            disabled={saving}
            autoFocus
          />
          <Button size="sm" className="h-7 text-[10px] px-2" onClick={() => onSave(value)} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'OK'}
          </Button>
          <button onClick={onCancel} className="p-1 rounded hover:bg-gray-200">
            <X className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      );

    case 'number':
      return (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-xs w-24"
            disabled={saving}
            autoFocus
          />
          <Button size="sm" className="h-7 text-[10px] px-2" onClick={() => onSave(value)} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'OK'}
          </Button>
          <button onClick={onCancel} className="p-1 rounded hover:bg-gray-200">
            <X className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      );

    default: // text
      return (
        <div className="flex items-center gap-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-xs w-36"
            disabled={saving}
            autoFocus
          />
          <Button size="sm" className="h-7 text-[10px] px-2" onClick={() => onSave(value)} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'OK'}
          </Button>
          <button onClick={onCancel} className="p-1 rounded hover:bg-gray-200">
            <X className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      );
  }
}

// ─── Add attribute modal ─────────────────────────────────────────────────────

interface AddAttributeModalProps {
  candidateId: string;
  existingAttributeTypeIds: string[];
  onSuccess: () => void;
  onClose: () => void;
}

function AddAttributeModal({ candidateId, existingAttributeTypeIds, onSuccess, onClose }: AddAttributeModalProps) {
  const t = useTranslations('candidateDetail');
  const [attributeTypes, setAttributeTypes] = useState<AttributeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<AttributeType | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getAttributeTypes({ is_active: true, limit: 200 })
      .then((res) => {
        // Filter out already-set types
        const available = res.items.filter(
          (t) => !existingAttributeTypeIds.includes(t.id)
        );
        setAttributeTypes(available);
      })
      .catch(() => toast.error('Kon kenmerktypes niet laden'))
      .finally(() => setLoading(false));
  }, [existingAttributeTypeIds]);

  const filtered = query.trim()
    ? attributeTypes.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : attributeTypes;

  const handleSave = async () => {
    if (!selectedType || !value.trim()) return;
    setSaving(true);
    try {
      await putCandidateAttribute(candidateId, {
        attribute_type_id: selectedType.id,
        value,
        source: 'manual',
      });
      toast.success(`${selectedType.name} toegevoegd`);
      onSuccess();
      onClose();
    } catch {
      toast.error(t('addFailed'));
    } finally {
      setSaving(false);
    }
  };

  // For boolean, auto-save on toggle since there's no empty state
  const handleBooleanSave = async (boolValue: string) => {
    if (!selectedType) return;
    setSaving(true);
    try {
      await putCandidateAttribute(candidateId, {
        attribute_type_id: selectedType.id,
        value: boolValue,
        source: 'manual',
      });
      toast.success(`${selectedType.name} toegevoegd`);
      onSuccess();
      onClose();
    } catch {
      toast.error(t('addFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kenmerk toevoegen</DialogTitle>
        </DialogHeader>

        {!selectedType ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zoek kenmerktype..."
                className="pl-9"
                autoFocus
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filtered.map((type) => {
                  const catConfig = CATEGORY_CONFIG[type.category] ?? CATEGORY_CONFIG.general;
                  const CatIcon = catConfig.icon;
                  return (
                    <button
                      key={type.id}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      onClick={() => {
                        setSelectedType(type);
                        if (type.data_type === 'boolean') setValue('true');
                      }}
                    >
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                        <CatIcon className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{type.name}</p>
                        <p className="text-[10px] text-gray-400">{catConfig.label} &middot; {type.data_type}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                {attributeTypes.length === 0
                  ? 'Alle kenmerken zijn al ingesteld'
                  : t('noResults')}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">{selectedType.name}</span>
              <button
                onClick={() => { setSelectedType(null); setValue(''); }}
                className="ml-auto p-1 rounded hover:bg-gray-200"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>

            <AddAttributeValueInput
              type={selectedType}
              value={value}
              onChange={setValue}
              onBooleanSave={handleBooleanSave}
              saving={saving}
            />

            {selectedType.data_type !== 'boolean' && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  {t('cancel')}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !value.trim()}>
                  {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  {t('add')}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Add attribute value input ───────────────────────────────────────────────

function AddAttributeValueInput({
  type,
  value,
  onChange,
  onBooleanSave,
  saving,
}: {
  type: AttributeType;
  value: string;
  onChange: (v: string) => void;
  onBooleanSave: (v: string) => void;
  saving: boolean;
}) {
  switch (type.data_type) {
    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{type.name}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => onBooleanSave('true')}
              disabled={saving}
            >
              Ja
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => onBooleanSave('false')}
              disabled={saving}
            >
              Nee
            </Button>
          </div>
        </div>
      );

    case 'select':
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Selecteer een optie..." />
          </SelectTrigger>
          <SelectContent>
            {type.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'multi_select': {
      const selected = value ? value.split(',').map((v) => v.trim()) : [];
      const toggle = (optValue: string) => {
        const next = selected.includes(optValue)
          ? selected.filter((v) => v !== optValue)
          : [...selected, optValue];
        onChange(next.join(','));
      };
      return (
        <div className="space-y-2">
          {type.options?.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={selected.includes(opt.value)}
                onCheckedChange={() => toggle(opt.value)}
                disabled={saving}
              />
              {opt.label}
            </label>
          ))}
        </div>
      );
    }

    case 'date':
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9"
          disabled={saving}
          autoFocus
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Voer een nummer in..."
          className="h-9"
          disabled={saving}
          autoFocus
        />
      );

    default:
      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Voer een waarde in..."
          className="h-9"
          disabled={saving}
          autoFocus
        />
      );
  }
}

// ─── Documents section ───────────────────────────────────────────────────────

const DOC_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending_review: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', label: 'In review' },
  approved: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'Goedgekeurd' },
  rejected: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Afgekeurd' },
};

function DocumentsSection({ documents }: { documents: DocumentSummary[] }) {
  const { locale } = useLocale();
  return (
    <div className="space-y-3">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Documenten
      </span>
      <div className="space-y-1.5">
        {documents.map((doc) => {
          const statusStyle = DOC_STATUS_STYLES[doc.status] ?? DOC_STATUS_STYLES.pending_review;
          return (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-dark-blue flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.document_type_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  {doc.expiration_date && (
                    <span>
                      Verloopt {formatDate(doc.expiration_date, locale)}
                    </span>
                  )}
                  {doc.document_number && (
                    <span className="truncate">{doc.document_number}</span>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0',
                  statusStyle.bg,
                  statusStyle.text
                )}
              >
                {statusStyle.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
