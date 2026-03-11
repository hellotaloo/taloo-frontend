'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import {
  Phone,
  MessageCircle,
  FileText,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/utils';
import { getCandidacies, getCandidacy, patchCandidacy, createCandidacy } from '@/lib/candidacy-api';
import { supabase } from '@/lib/supabase';
import { getCandidates, getCandidate } from '@/lib/api';
import type { Candidacy, CandidacyStage, APICandidateListItem, APICandidateDetail } from '@/lib/types';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { CandidateDetailPane } from '@/components/blocks/records';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

// ─── Stage config ─────────────────────────────────────────────────────────────

interface StageConfig {
  label: string;
  archive?: boolean;
}

const STAGE_CONFIG: Record<CandidacyStage, StageConfig> = {
  new: { label: 'Nieuw' },
  pre_screening: { label: 'Pre-screening' },
  qualified: { label: 'Gekwalificeerd' },
  interview_planned: { label: 'Interview gepland' },
  interview_done: { label: 'Interview afgerond' },
  offer: { label: 'Aanbod' },
  placed: { label: 'Geplaatst' },
  rejected: { label: 'Afgewezen', archive: true },
  withdrawn: { label: 'Teruggetrokken', archive: true },
};

const ACTIVE_STAGES: CandidacyStage[] = [
  'new', 'pre_screening', 'qualified', 'interview_planned', 'interview_done', 'offer', 'placed',
];
const ARCHIVE_STAGES: CandidacyStage[] = ['rejected', 'withdrawn'];

// ─── Channel badge ────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: 'voice' | 'whatsapp' | 'cv' }) {
  if (channel === 'voice') return <Phone className="w-3 h-3 text-blue-500" />;
  if (channel === 'whatsapp') return <MessageCircle className="w-3 h-3 text-green-500" />;
  return <FileText className="w-3 h-3 text-purple-500" />;
}

function channelLabel(channel: 'voice' | 'whatsapp' | 'cv') {
  if (channel === 'voice') return 'Voice';
  if (channel === 'whatsapp') return 'WhatsApp';
  return 'CV';
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, muted }: { name: string; muted?: boolean }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <div
      className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0',
        muted ? 'bg-gray-200 text-gray-400' : 'bg-brand-dark-blue text-white',
      )}
    >
      {initials}
    </div>
  );
}

// ─── Kanban card ──────────────────────────────────────────────────────────────

interface KanbanCardProps {
  candidacy: Candidacy;
  muted?: boolean;
  onCardClick: (candidacy: Candidacy) => void;
  onArchive: (candidacy: Candidacy, stage: 'rejected' | 'withdrawn') => void;
}

function KanbanCard({ candidacy, muted, onCardClick, onArchive }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidacy.id,
    disabled: muted,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const app = candidacy.latest_application;
  const score = app?.open_questions_score;
  const qualified = app?.qualified;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'group relative rounded-lg border bg-white p-3 cursor-pointer select-none transition-shadow',
        isDragging ? 'opacity-40 shadow-lg' : 'shadow-sm hover:shadow-md',
        muted && 'opacity-60',
      )}
      onClick={() => onCardClick(candidacy)}
    >
      {/* Drag handle area */}
      <div
        {...listeners}
        className="absolute inset-0 rounded-lg cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Card content */}
      <div className="relative pointer-events-none">
        {/* Row 1: avatar + name + action menu */}
        <div className="flex items-start gap-2">
          <Avatar name={candidacy.candidate.full_name} muted={muted} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate leading-tight">
              {candidacy.candidate.full_name}
            </p>
            {app ? (
              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                <ChannelBadge channel={app.channel} />
                <span>{channelLabel(app.channel)}</span>
                <span>·</span>
                <span>{formatRelativeDate(candidacy.stage_updated_at)}</span>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5">
                {formatRelativeDate(candidacy.stage_updated_at)}
              </p>
            )}
          </div>
        </div>

        {/* Row 2: score + pass/fail */}
        {app && (score !== null || qualified !== null) && (
          <div className="flex items-center gap-2 mt-2">
            {score !== null && (
              <span className="text-xs font-medium text-gray-700">Score {score}%</span>
            )}
            {qualified === true && (
              <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Geslaagd
              </span>
            )}
            {qualified === false && (
              <span className="flex items-center gap-0.5 text-xs text-red-500 font-medium">
                <XCircle className="w-3 h-3" />
                Mislukt
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action menu — pointer-events re-enabled */}
      {!muted && (
        <div
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                onClick={() => onArchive(candidacy, 'rejected')}
              >
                Afwijzen
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-600"
                onClick={() => onArchive(candidacy, 'withdrawn')}
              >
                Teruggetrokken
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

// ─── Card overlay (drag ghost) ────────────────────────────────────────────────

function CardOverlay({ candidacy }: { candidacy: Candidacy }) {
  const app = candidacy.latest_application;
  const score = app?.open_questions_score;
  const qualified = app?.qualified;

  return (
    <div className="rounded-lg border bg-white p-3 shadow-xl w-60 rotate-1 opacity-95">
      <div className="flex items-start gap-2">
        <Avatar name={candidacy.candidate.full_name} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{candidacy.candidate.full_name}</p>
          {app && (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
              <ChannelBadge channel={app.channel} />
              <span>{channelLabel(app.channel)}</span>
            </div>
          )}
        </div>
      </div>
      {app && (score !== null || qualified !== null) && (
        <div className="flex items-center gap-2 mt-2">
          {score !== null && <span className="text-xs font-medium text-gray-700">Score {score}%</span>}
          {qualified === true && (
            <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Geslaagd
            </span>
          )}
          {qualified === false && (
            <span className="flex items-center gap-0.5 text-xs text-red-500 font-medium">
              <XCircle className="w-3 h-3" /> Mislukt
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add candidate popover ────────────────────────────────────────────────────

interface AddCandidatePopoverProps {
  vacancyId: string;
  stage: CandidacyStage;
  onAdded: (candidacy: Candidacy) => void;
}

function AddCandidatePopover({ vacancyId, stage, onAdded }: AddCandidatePopoverProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<APICandidateListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const resp = await getCandidates({ search: value, limit: 20 });
        setResults(resp.items);
      } catch {
        // silent
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  async function handleSelect(candidate: APICandidateListItem) {
    setAdding(candidate.id);
    try {
      const created = await createCandidacy({ vacancy_id: vacancyId, candidate_id: candidate.id, stage, source: 'manual' });
      onAdded(created);
      setOpen(false);
    } catch {
      toast.error('Kon kandidaat niet toevoegen');
    } finally {
      setAdding(null);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-1 py-1">
          <Plus className="w-3.5 h-3.5" />
          Toevoegen
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Zoek op naam of telefoon..."
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {searching && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
            )}
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {!query.trim() && (
            <p className="text-xs text-gray-400 px-3 py-4 text-center">
              Typ om te zoeken
            </p>
          )}
          {query.trim() && !searching && results.length === 0 && (
            <p className="text-xs text-gray-400 px-3 py-4 text-center">
              Geen kandidaten gevonden
            </p>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
              onClick={() => handleSelect(c)}
              disabled={!!adding}
            >
              <Avatar name={c.full_name} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{c.full_name}</p>
                {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
              </div>
              {adding === c.id && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  stage: CandidacyStage;
  candidacies: Candidacy[];
  vacancyId: string;
  onCardClick: (candidacy: Candidacy) => void;
  onArchive: (candidacy: Candidacy, stage: 'rejected' | 'withdrawn') => void;
  onCandidateAdded: (candidacy: Candidacy) => void;
}

function KanbanColumn({
  stage,
  candidacies,
  vacancyId,
  onCardClick,
  onArchive,
  onCandidateAdded,
}: KanbanColumnProps) {
  const config = STAGE_CONFIG[stage];
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const isArchive = config.archive;

  return (
    <div className="flex flex-col w-60 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {config.label}
          </span>
          <span className="text-xs text-gray-400">({candidacies.length})</span>
        </div>
        {!isArchive && (
          <AddCandidatePopover
            vacancyId={vacancyId}
            stage={stage}
            onAdded={onCandidateAdded}
          />
        )}
      </div>

      {/* Droppable card list */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2 rounded-xl p-2 min-h-[120px] transition-colors',
          isOver ? 'bg-gray-100' : 'bg-gray-50/60',
          isArchive && 'bg-gray-50/30',
        )}
      >
        {candidacies.length === 0 && (
          <p className={cn('text-xs text-center py-4', isArchive ? 'text-gray-300' : 'text-gray-400')}>
            {isArchive ? `Geen ${config.label.toLowerCase()}` : 'Geen kandidaten'}
          </p>
        )}
        {candidacies.map((c) => (
          <KanbanCard
            key={c.id}
            candidacy={c}
            muted={isArchive}
            onCardClick={onCardClick}
            onArchive={onArchive}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main board ───────────────────────────────────────────────────────────────

export interface VacancyKanbanProps {
  vacancyId: string;
}

export function VacancyKanban({ vacancyId }: VacancyKanbanProps) {
  const [candidacies, setCandidacies] = useState<Candidacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchive, setShowArchive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Candidate detail panel
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<APICandidateDetail | null>(null);
  const [candidateLoading, setCandidateLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Fetch candidacies
  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const resp = await getCandidacies({ vacancy_id: vacancyId });
        setCandidacies(resp.items ?? []);
      } catch {
        toast.error('Kon kandidaten niet laden');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [vacancyId]);

  // Realtime subscription for candidacy changes
  useEffect(() => {
    const channel = supabase
      .channel(`candidacies:vacancy:${vacancyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'ats',
          table: 'candidacies',
          filter: `vacancy_id=eq.${vacancyId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as { id: string };
            try {
              const full = await getCandidacy(newRow.id);
              setCandidacies((prev) =>
                prev.some((c) => c.id === full.id) ? prev : [full, ...prev],
              );
            } catch {
              // ignore — initial fetch already has it or backend race
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as { id: string; stage: CandidacyStage; stage_updated_at: string; updated_at: string };
            setCandidacies((prev) =>
              prev.map((c) =>
                c.id === updated.id
                  ? { ...c, stage: updated.stage, stage_updated_at: updated.stage_updated_at, updated_at: updated.updated_at }
                  : c,
              ),
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setCandidacies((prev) => prev.filter((c) => c.id !== deleted.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vacancyId]);

  // Fetch candidate detail
  useEffect(() => {
    if (!selectedCandidateId) {
      setSelectedCandidate(null);
      return;
    }
    setCandidateLoading(true);
    getCandidate(selectedCandidateId)
      .then(setSelectedCandidate)
      .catch(() => setSelectedCandidate(null))
      .finally(() => setCandidateLoading(false));
  }, [selectedCandidateId]);

  // Group by stage
  const grouped = useMemo(() => {
    const map = new Map<CandidacyStage, Candidacy[]>();
    for (const s of [...ACTIVE_STAGES, ...ARCHIVE_STAGES]) map.set(s, []);
    const query = searchQuery.toLowerCase();
    for (const c of candidacies) {
      if (query && !c.candidate.full_name.toLowerCase().includes(query)) continue;
      map.get(c.stage)?.push(c);
    }
    return map;
  }, [candidacies, searchQuery]);

  const activeCandidacy = useMemo(
    () => (activeId ? candidacies.find((c) => c.id === activeId) ?? null : null),
    [activeId, candidacies],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const candidacyId = active.id as string;
    const newStage = over.id as CandidacyStage;
    const candidacy = candidacies.find((c) => c.id === candidacyId);
    if (!candidacy || candidacy.stage === newStage) return;

    // Optimistic update
    const now = new Date().toISOString();
    setCandidacies((prev) =>
      prev.map((c) => (c.id === candidacyId ? { ...c, stage: newStage, stage_updated_at: now } : c)),
    );

    try {
      await patchCandidacy(candidacyId, { stage: newStage });
    } catch {
      setCandidacies((prev) =>
        prev.map((c) =>
          c.id === candidacyId
            ? { ...c, stage: candidacy.stage, stage_updated_at: candidacy.stage_updated_at }
            : c,
        ),
      );
      toast.error('Kon kandidaat niet verplaatsen');
    }
  }

  const handleArchive = useCallback(
    async (candidacy: Candidacy, archiveStage: 'rejected' | 'withdrawn') => {
      const now = new Date().toISOString();
      setCandidacies((prev) =>
        prev.map((c) =>
          c.id === candidacy.id ? { ...c, stage: archiveStage, stage_updated_at: now } : c,
        ),
      );
      try {
        await patchCandidacy(candidacy.id, { stage: archiveStage });
      } catch {
        setCandidacies((prev) =>
          prev.map((c) =>
            c.id === candidacy.id
              ? { ...c, stage: candidacy.stage, stage_updated_at: candidacy.stage_updated_at }
              : c,
          ),
        );
        toast.error('Kon kandidaat niet archiveren');
      }
    },
    [],
  );

  const handleCandidateAdded = useCallback((candidacy: Candidacy) => {
    setCandidacies((prev) => [candidacy, ...prev]);
  }, []);

  const visibleStages = showArchive ? [...ACTIVE_STAGES, ...ARCHIVE_STAGES] : ACTIVE_STAGES;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-5 shrink-0">
        <button
          onClick={() => setShowArchive((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors',
            showArchive
              ? 'bg-gray-900 text-white border-gray-900'
              : 'text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700',
          )}
        >
          {showArchive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          Toon archief
        </button>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek kandidaat..."
            className="pl-8 pr-8 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring w-52"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {visibleStages.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              candidacies={grouped.get(stage) ?? []}
              vacancyId={vacancyId}
              onCardClick={(c) => setSelectedCandidateId(c.candidate_id)}
              onArchive={handleArchive}
              onCandidateAdded={handleCandidateAdded}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCandidacy && <CardOverlay candidacy={activeCandidacy} />}
        </DragOverlay>
      </DndContext>

      {/* Candidate detail sheet */}
      <Sheet
        open={!!selectedCandidateId}
        onOpenChange={(open) => !open && setSelectedCandidateId(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-xl p-0" showCloseButton={false}>
          <CandidateDetailPane
            candidate={selectedCandidate}
            isLoading={candidateLoading}
            onClose={() => setSelectedCandidateId(null)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
