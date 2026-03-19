'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Loader2, Phone, MessageCircle, FileText, Calendar, AlertTriangle, ExternalLink } from 'lucide-react';
import { cn, formatRelativeDate, formatTimestamp } from '@/lib/utils';
import { getCandidacies, patchCandidacy } from '@/lib/candidacy-api';
import { supabase } from '@/lib/supabase';
import type { Candidacy, CandidacyStage, PlacementCreate } from '@/lib/types';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { PlacementDialog } from '@/components/blocks/placement-dialog';

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<CandidacyStage, string> = {
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

const VISIBLE_STAGES: CandidacyStage[] = [
  'new', 'pre_screening', 'qualified', 'interview_planned', 'interview_done', 'offer', 'placed',
  'rejected', 'withdrawn',
];

const TERMINAL_STAGES: CandidacyStage[] = ['rejected', 'withdrawn'];

// ─── Channel badge ────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: 'voice' | 'whatsapp' | 'cv' }) {
  if (channel === 'voice') return <Phone className="w-3 h-3 text-blue-500 shrink-0" />;
  if (channel === 'whatsapp') return <MessageCircle className="w-3 h-3 text-green-500 shrink-0" />;
  return <FileText className="w-3 h-3 text-purple-500 shrink-0" />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────


// ─── Pipeline card ────────────────────────────────────────────────────────────

interface PipelineCardProps {
  candidacy: Candidacy;
  stage: CandidacyStage;
  onClick: (candidacy: Candidacy) => void;
  muted?: boolean;
}

function PipelineCard({ candidacy, stage, onClick, muted }: PipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidacy.id,
    disabled: muted,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const app = candidacy.latest_application;
  const isOpen = candidacy.vacancy?.is_open_application === true;
  const hasScore = app && app.open_questions_score !== null;
  const hasKnockout = app && app.knockout_total > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'relative w-full text-left rounded-lg border border-gray-200/80 bg-white px-3 py-2.5 transition-all select-none cursor-grab active:cursor-grabbing',
        isDragging ? 'opacity-0' : 'hover:border-gray-300 hover:bg-gray-50/50 shadow-sm hover:shadow-md',
        muted && 'opacity-60',
      )}
      onClick={() => onClick(candidacy)}
    >
      {/* Card content */}
      <div className="relative pointer-events-none">
        {/* Active screening indicator */}
        {stage === 'pre_screening' && (
          <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
        )}
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 truncate leading-tight">
            {candidacy.candidate.full_name}
          </p>
          <span className="text-[10px] text-gray-400 shrink-0">
            {formatRelativeDate(candidacy.stage_updated_at)}
          </span>
        </div>
        {(hasScore || hasKnockout) && (
          <div className="flex items-center gap-2 mt-1">
            {hasScore && (
              <span className="text-[10px] font-medium text-gray-500">
                Score {app.open_questions_score}%
              </span>
            )}
            {hasKnockout && (
              <span className={cn(
                'text-[10px] font-medium',
                app.knockout_passed === app.knockout_total ? 'text-green-600' : 'text-red-500',
              )}>
                Knockout {app.knockout_passed}/{app.knockout_total}
              </span>
            )}
          </div>
        )}
        {stage === 'interview_planned' && app?.interview_scheduled_at && (
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 max-w-full">
              <Calendar className="w-3 h-3 shrink-0" />
              {formatTimestamp(app.interview_scheduled_at)}
            </span>
          </div>
        )}
        {/* Recruiter verification warning */}
        {candidacy.recruiter_verification && (
          <div className="mt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Verificatie nodig
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                {candidacy.recruiter_verification_reason || 'Recruiter verificatie vereist'}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Contract link */}
        {candidacy.contract_url && (
          <div className="mt-1">
            <a
              href={candidacy.contract_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              Contract
            </a>
          </div>
        )}

        {candidacy.vacancy && (
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 max-w-full">
              {app && <ChannelBadge channel={app.channel} />}
              <span className="truncate">{isOpen ? 'Open Sollicitatie' : candidacy.vacancy.title}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card overlay (drag ghost) ───────────────────────────────────────────────

function PipelineCardOverlay({ candidacy }: { candidacy: Candidacy }) {
  const app = candidacy.latest_application;
  const isOpen = candidacy.vacancy?.is_open_application === true;

  return (
    <div className="rounded-lg border bg-white px-3 py-2.5 shadow-xl w-52 rotate-1 opacity-95">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 truncate leading-tight">
          {candidacy.candidate.full_name}
        </p>
      </div>
      {candidacy.vacancy && (
        <div className="mt-1">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 max-w-full">
            {app && <ChannelBadge channel={app.channel} />}
            <span className="truncate">{isOpen ? 'Open Sollicitatie' : candidacy.vacancy.title}</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Pipeline column ──────────────────────────────────────────────────────────

interface PipelineColumnProps {
  stage: CandidacyStage;
  candidacies: Candidacy[];
  onCardClick: (candidacy: Candidacy) => void;
}

function PipelineColumn({ stage, candidacies, onCardClick }: PipelineColumnProps) {
  const isTerminal = TERMINAL_STAGES.includes(stage);
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className={cn('flex flex-col min-w-[200px] flex-1', isTerminal && 'opacity-50 max-w-[200px]')}>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {STAGE_CONFIG[stage]}
        </span>
        <span className={cn(
          'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
          candidacies.length > 0
            ? 'bg-gray-200 text-gray-600'
            : 'bg-gray-100 text-gray-400',
        )}>
          {candidacies.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2 rounded-xl p-2 transition-colors',
          isOver ? 'bg-gray-200/80 ring-2 ring-brand-dark-blue/20' : isTerminal ? 'bg-gray-100/40' : 'bg-gray-100/60',
        )}
      >
        {candidacies.length === 0 && (
          <p className="text-xs text-gray-300 text-center py-6">
            Geen kandidaten
          </p>
        )}
        {candidacies.map((c) => (
          <PipelineCard key={c.id} candidacy={c} stage={stage} onClick={onCardClick} muted={isTerminal} />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface CandidatesPipelineProps {
  searchQuery: string;
  onCandidateClick: (candidateId: string) => void;
}

export function CandidatesPipeline({ searchQuery, onCandidateClick }: CandidatesPipelineProps) {
  const [candidacies, setCandidacies] = useState<Candidacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [placementCandidate, setPlacementCandidate] = useState<Candidacy | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const resp = await getCandidacies({});
        setCandidacies(resp.items ?? []);
      } catch {
        toast.error('Kon pipeline niet laden');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  // Realtime subscription for all candidacy changes
  useEffect(() => {
    const channel = supabase
      .channel('candidacies:global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'ats', table: 'candidacies' },
        async (payload) => {
          console.log('[Pipeline RT]', payload.eventType, payload.new);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            try {
              const resp = await getCandidacies({});
              setCandidacies(resp.items ?? []);
            } catch {
              // ignore
            }
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
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<CandidacyStage, Candidacy[]>();
    for (const s of VISIBLE_STAGES) map.set(s, []);
    const query = searchQuery.toLowerCase();
    for (const c of candidacies) {
      if (!c.vacancy) continue; // skip talent-pool entries (no vacancy object)
      if (!VISIBLE_STAGES.includes(c.stage)) continue;
      if (query && !c.candidate.full_name.toLowerCase().includes(query)) continue;
      map.get(c.stage)?.push(c);
    }
    // Sort each column: most recently updated first
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.stage_updated_at).getTime() - new Date(b.stage_updated_at).getTime());
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

    // Intercept: interview_done → offer requires placement details
    if (candidacy.stage === 'interview_done' && newStage === 'offer') {
      setPlacementCandidate(candidacy);
      return;
    }

    // Optimistic update
    const prevStage = candidacy.stage;
    const prevUpdatedAt = candidacy.stage_updated_at;
    const now = new Date().toISOString();
    setCandidacies((prev) =>
      prev.map((c) => (c.id === candidacyId ? { ...c, stage: newStage, stage_updated_at: now } : c)),
    );

    try {
      await patchCandidacy(candidacyId, { stage: newStage });
    } catch {
      // Rollback on error
      setCandidacies((prev) =>
        prev.map((c) =>
          c.id === candidacyId
            ? { ...c, stage: prevStage, stage_updated_at: prevUpdatedAt }
            : c,
        ),
      );
      toast.error('Ongeldige stap-overgang');
    }
  }

  async function handlePlacementConfirm(placement: PlacementCreate) {
    const candidacy = placementCandidate;
    if (!candidacy) return;

    const now = new Date().toISOString();
    setCandidacies((prev) =>
      prev.map((c) => (c.id === candidacy.id ? { ...c, stage: 'offer' as CandidacyStage, stage_updated_at: now } : c)),
    );
    setPlacementCandidate(null);

    try {
      await patchCandidacy(candidacy.id, { stage: 'offer', placement });
    } catch {
      setCandidacies((prev) =>
        prev.map((c) =>
          c.id === candidacy.id
            ? { ...c, stage: candidacy.stage, stage_updated_at: candidacy.stage_updated_at }
            : c,
        ),
      );
      toast.error('Kon plaatsing niet aanmaken');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const activeStages = VISIBLE_STAGES.filter((s) => !TERMINAL_STAGES.includes(s));
  const terminalStages = VISIBLE_STAGES.filter((s) => TERMINAL_STAGES.includes(s));

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1 min-h-0">
          {activeStages.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              candidacies={grouped.get(stage) ?? []}
              onCardClick={(c) => onCandidateClick(c.candidate_id)}
            />
          ))}
          {/* Separator before terminal columns */}
          <div className="w-px bg-gray-200 shrink-0 my-2" />
          {terminalStages.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              candidacies={grouped.get(stage) ?? []}
              onCardClick={(c) => onCandidateClick(c.candidate_id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCandidacy && <PipelineCardOverlay candidacy={activeCandidacy} />}
        </DragOverlay>
      </DndContext>

      <PlacementDialog
        candidacy={placementCandidate}
        open={!!placementCandidate}
        onOpenChange={(open) => !open && setPlacementCandidate(null)}
        onConfirm={handlePlacementConfirm}
      />
    </div>
  );
}
