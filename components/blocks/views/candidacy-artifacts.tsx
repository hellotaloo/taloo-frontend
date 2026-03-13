'use client';

import {
  PhoneCall,
  FileText,
  CheckCircle,
  XCircle,
  ChevronDown,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/kit/status-badge';
import type {
  CandidacySummary,
  ScreeningResult,
  ScreeningAnswer,
  DocumentCollectionSummary,
  DocumentCollectionItem,
  AnswerRating,
} from '@/lib/types';

// ─── Rating styles ───────────────────────────────────────────────────────────

const ratingStyles: Record<AnswerRating, { bg: string; text: string; label: string }> = {
  excellent: { bg: 'bg-green-50', text: 'text-green-700', label: 'Uitstekend' },
  good: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Goed' },
  average: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Gemiddeld' },
  below_average: { bg: 'bg-red-50', text: 'text-red-600', label: 'Ondergemiddeld' },
  weak: { bg: 'bg-red-50', text: 'text-red-700', label: 'Zwak' },
};

// ─── Channel icons ───────────────────────────────────────────────────────────

const channelIcons: Record<string, typeof PhoneCall> = {
  voice: PhoneCall,
  whatsapp: MessageSquare,
  cv: FileText,
};

// ─── Document status config ──────────────────────────────────────────────────

const docStatusConfig: Record<string, { label: string; variant: 'green' | 'orange' | 'red' | 'gray' }> = {
  verified: { label: 'Geverifieerd', variant: 'green' },
  needs_review: { label: 'Review nodig', variant: 'orange' },
  rejected: { label: 'Afgekeurd', variant: 'red' },
  pending: { label: 'In afwachting', variant: 'gray' },
};

// ─── Pre-screening artifact ──────────────────────────────────────────────────

function ScreeningArtifact({ result }: { result: ScreeningResult }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const ChannelIcon = channelIcons[result.channel] ?? PhoneCall;
  const isCompleted = result.status === 'completed';

  const knockoutAnswers = result.answers.filter((a) => a.question_type === 'knockout');
  const qualificationAnswers = result.answers.filter((a) => a.question_type === 'qualification');

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      {/* Agent card header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center shrink-0">
              <ChannelIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Pre-screening</p>
              <p className="text-xs text-gray-500">
                {result.channel === 'voice' ? 'Telefonisch' : result.channel === 'whatsapp' ? 'WhatsApp' : 'CV'} gesprek
              </p>
            </div>
          </div>
          <StatusBadge
            label={result.qualified ? 'Gekwalificeerd' : 'Afgekeurd'}
            variant={result.qualified ? 'green' : 'red'}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Knockout</p>
            <p className="text-lg font-semibold text-gray-900">
              {result.knockout_passed}/{result.knockout_total}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Score</p>
            <p className="text-lg font-semibold text-gray-900">
              {result.open_questions_score !== undefined ? `${result.open_questions_score}%` : '-'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Duur</p>
            <p className="text-sm font-medium text-gray-900">
              {result.interaction_seconds > 0
                ? `${Math.floor(result.interaction_seconds / 60)}m ${result.interaction_seconds % 60}s`
                : '-'}
            </p>
          </div>
        </div>

        {/* AI Summary */}
        {result.summary && isCompleted && (
          <p className="text-sm text-gray-600 mt-3 italic leading-relaxed">
            {result.summary}
          </p>
        )}

        {/* In-progress state */}
        {!isCompleted && (
          <div className="flex items-center gap-2 mt-3 text-sm text-orange-600">
            <Clock className="w-4 h-4" />
            <span>Screening is nog bezig...</span>
          </div>
        )}
      </div>

      {/* Expandable Q&A section */}
      {isCompleted && result.answers.length > 0 && (
        <div className="border-t border-gray-200">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-100/50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              Vragen & Antwoorden ({result.answers.length})
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-500 transition-transform duration-200',
                showAnswers && 'rotate-180'
              )}
            />
          </button>

          {showAnswers && (
            <div className="px-4 pb-4 space-y-4">
              {/* Knockout questions */}
              {knockoutAnswers.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Knockout vragen
                  </p>
                  <div className="space-y-3">
                    {knockoutAnswers.map((answer) => (
                      <AnswerRow key={answer.question_id} answer={answer} />
                    ))}
                  </div>
                </div>
              )}

              {/* Qualification questions */}
              {qualificationAnswers.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Kwalificatie vragen
                  </p>
                  <div className="space-y-3">
                    {qualificationAnswers.map((answer) => (
                      <AnswerRow key={answer.question_id} answer={answer} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnswerRow({ answer }: { answer: ScreeningAnswer }) {
  const isKnockout = answer.question_type === 'knockout';

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 flex-1">
          {answer.question_text}
        </p>
        {isKnockout && answer.passed !== undefined && answer.passed !== null && (
          answer.passed ? (
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          )
        )}
        {!isKnockout && answer.rating && (
          <span className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0',
            ratingStyles[answer.rating].bg,
            ratingStyles[answer.rating].text
          )}>
            {ratingStyles[answer.rating].label}
          </span>
        )}
      </div>
      {answer.answer && (
        <p className="text-sm text-gray-600 mt-1.5">{answer.answer}</p>
      )}
      {!isKnockout && answer.score !== undefined && (
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                answer.score >= 70 ? 'bg-green-500' : answer.score >= 40 ? 'bg-orange-400' : 'bg-red-400'
              )}
              style={{ width: `${answer.score}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500">{answer.score}%</span>
        </div>
      )}
      {answer.motivation && (
        <p className="text-xs text-gray-500 mt-1.5 italic">{answer.motivation}</p>
      )}
    </div>
  );
}

// ─── Document collection artifact ────────────────────────────────────────────

function DocumentCollectionArtifact({ collection }: { collection: DocumentCollectionSummary }) {
  const collectionStatusConfig: Record<string, { label: string; variant: 'green' | 'orange' | 'red' | 'gray' | 'blue' }> = {
    completed: { label: 'Voltooid', variant: 'green' },
    active: { label: 'Bezig', variant: 'blue' },
    needs_review: { label: 'Review nodig', variant: 'orange' },
    abandoned: { label: 'Verlaten', variant: 'gray' },
  };

  const statusInfo = collectionStatusConfig[collection.status] ?? collectionStatusConfig.active;
  const progressPercent = collection.documents_total > 0
    ? Math.round((collection.documents_collected / collection.documents_total) * 100)
    : 0;

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      {/* Agent card header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Documentcollectie</p>
              <p className="text-xs text-gray-500">Verzamelt documenten van kandidaten</p>
            </div>
          </div>
          <StatusBadge label={statusInfo.label} variant={statusInfo.variant} />
        </div>

        {/* Progress */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              {collection.documents_collected}/{collection.documents_total} documenten
            </span>
            <span className="text-xs text-gray-500">{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-dark-blue rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Document checklist */}
      {collection.documents.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-3 space-y-2">
          {collection.documents.map((doc) => (
            <DocumentRow key={doc.document_type_id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentRow({ doc }: { doc: DocumentCollectionItem }) {
  const status = docStatusConfig[doc.status] ?? docStatusConfig.pending;
  const isCollected = doc.status === 'verified';

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        {isCollected ? (
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
        )}
        <span className={cn(
          'text-sm truncate',
          isCollected ? 'text-gray-900' : 'text-gray-500'
        )}>
          {doc.document_type_name}
        </span>
      </div>
      <StatusBadge label={status.label} variant={status.variant} />
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export interface CandidacyArtifactsProps {
  candidacies: CandidacySummary[];
}

export function CandidacyArtifacts({ candidacies }: CandidacyArtifactsProps) {
  // Filter candidacies that have at least one artifact
  const candidaciesWithArtifacts = candidacies.filter(
    (c) => c.screening_result || c.document_collection
  );

  if (candidaciesWithArtifacts.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        Geen resultaten
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {candidaciesWithArtifacts.map((candidacy) => (
        <div key={candidacy.id}>
          {/* Vacancy header */}
          {candidaciesWithArtifacts.length > 1 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {candidacy.vacancy_title ?? 'Onbekende vacature'}
              </span>
              {candidacy.vacancy_company && (
                <span className="text-xs text-gray-400">
                  · {candidacy.vacancy_company}
                </span>
              )}
            </div>
          )}

          <div className="space-y-3">
            {candidacy.screening_result && (
              <ScreeningArtifact result={candidacy.screening_result} />
            )}
            {candidacy.document_collection && (
              <DocumentCollectionArtifact collection={candidacy.document_collection} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
