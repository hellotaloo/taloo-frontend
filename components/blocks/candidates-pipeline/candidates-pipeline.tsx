'use client';

import { useState, useMemo, useEffect } from 'react';
import { Loader2, Phone, MessageCircle, FileText, Briefcase } from 'lucide-react';
import { getCandidacies } from '@/lib/candidacy-api';
import type { Candidacy, CandidacyStage } from '@/lib/types';
import { toast } from 'sonner';

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<CandidacyStage, string> = {
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

const VISIBLE_STAGES: CandidacyStage[] = [
  'new', 'pre_screening', 'qualified', 'interview_planned', 'interview_done', 'offer', 'placed',
];

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
  onClick: (candidacy: Candidacy) => void;
}

function PipelineCard({ candidacy, onClick }: PipelineCardProps) {
  const app = candidacy.latest_application;
  const isOpen = candidacy.vacancy?.is_open_application === true;

  return (
    <button
      className="w-full text-left rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
      onClick={() => onClick(candidacy)}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 text-white ${isOpen ? 'bg-lime-500' : 'bg-brand-dark-blue'}`}>
          {candidacy.candidate.full_name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}
        </div>
        <span className="text-sm font-medium text-gray-900 truncate leading-tight">
          {candidacy.candidate.full_name}
        </span>
      </div>
      {candidacy.vacancy && (
        <div className="flex items-center gap-1.5 pl-8 mb-1">
          {isOpen ? (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-lime-100 text-lime-700 border border-lime-200">
              Open Sollicitatie
            </span>
          ) : (
            <>
              <Briefcase className="w-3 h-3 text-brand-dark-blue shrink-0" />
              <span className="text-[11px] text-gray-500 truncate">{candidacy.vacancy.title}</span>
            </>
          )}
        </div>
      )}
      {app && (
        <div className="flex items-center gap-1 pl-8">
          <ChannelBadge channel={app.channel} />
        </div>
      )}
    </button>
  );
}

// ─── Pipeline column ──────────────────────────────────────────────────────────

interface PipelineColumnProps {
  stage: CandidacyStage;
  candidacies: Candidacy[];
  onCardClick: (candidacy: Candidacy) => void;
}

function PipelineColumn({ stage, candidacies, onCardClick }: PipelineColumnProps) {
  return (
    <div className="flex flex-col w-[230px] shrink-0">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {STAGE_CONFIG[stage]}
        </span>
        <span className="text-xs text-gray-400">({candidacies.length})</span>
      </div>
      <div className="flex flex-col gap-2 bg-gray-50/60 rounded-xl p-2 min-h-[80px]">
        {candidacies.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">Geen kandidaten</p>
        ) : (
          candidacies.map((c) => (
            <PipelineCard key={c.id} candidacy={c} onClick={onCardClick} />
          ))
        )}
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
    return map;
  }, [candidacies, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {VISIBLE_STAGES.map((stage) => (
        <PipelineColumn
          key={stage}
          stage={stage}
          candidacies={grouped.get(stage) ?? []}
          onCardClick={(c) => onCandidateClick(c.candidate_id)}
        />
      ))}
    </div>
  );
}
