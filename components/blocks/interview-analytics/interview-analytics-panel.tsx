'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  BarChart3,
  Clock,
  Users,
  ListChecks,
  Lightbulb,
  CheckCircle,
  ThumbsUp,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { type GeneratedQuestion } from '@/components/blocks/interview-editor';
import { TagBadge } from '@/components/kit/tag-badge';
import { cn } from '@/lib/utils';
import {
  getInterviewAnalysis,
  type InterviewAnalysisResponse,
  type AnalysisQuestionResult,
  type Verdict,
  type DropOffRisk,
} from '@/lib/interview-api';

// -- Verdict config --

const VERDICT_CONFIG: Record<Verdict, { color: string; bgColor: string; borderColor: string; icon: typeof CheckCircle; label: string }> = {
  excellent: { color: 'text-green-500', bgColor: 'bg-green-500', borderColor: 'border-green-500', icon: CheckCircle, label: 'Uitstekend' },
  good: { color: 'text-blue-500', bgColor: 'bg-blue-500', borderColor: 'border-blue-500', icon: ThumbsUp, label: 'Goed' },
  needs_work: { color: 'text-orange-500', bgColor: 'bg-orange-500', borderColor: 'border-orange-500', icon: AlertTriangle, label: 'Aandachtspunten' },
  poor: { color: 'text-red-500', bgColor: 'bg-red-500', borderColor: 'border-red-500', icon: AlertCircle, label: 'Onvoldoende' },
};

const DROP_OFF_LABELS: Record<DropOffRisk, string> = {
  low: 'Laag risico',
  medium: 'Medium risico',
  high: 'Hoog risico',
};

// -- Helpers --

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function getQuestionIdPrefix(id: string): 'knockout' | 'qualifying' {
  return id.startsWith('ko_') ? 'knockout' : 'qualifying';
}

// -- Chart tooltip --

interface FunnelPoint {
  step: string;
  shortLabel: string;
  candidates: number;
}

function ChartTooltip({
  active,
  payload,
  label,
  funnelData,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  funnelData: FunnelPoint[];
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const idx = funnelData.findIndex((d) => d.shortLabel === label);
  const prev = idx > 0 ? funnelData[idx - 1].candidates : value;
  const dropOff = prev - value;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
      <p className="text-xs font-medium text-gray-900">
        {funnelData[idx]?.step}
      </p>
      <p className="text-sm font-bold text-brand-dark-blue">
        {value} kandidaten
      </p>
      {dropOff > 0 && (
        <p className="text-xs text-red-500">-{dropOff} drop-off</p>
      )}
    </div>
  );
}

// -- Main component --

interface InterviewAnalyticsPanelProps {
  questions: GeneratedQuestion[];
  vacancyId: string;
}

export function InterviewAnalyticsPanel({
  questions,
  vacancyId,
}: InterviewAnalyticsPanelProps) {
  const [analysis, setAnalysis] = useState<InterviewAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);

  const fetchAnalysis = useCallback(async () => {
    try {
      const data = await getInterviewAnalysis(vacancyId);
      if (data) {
        setAnalysis(data);
        setIsLoading(false);
        setError(null);
        return true; // Got data, stop polling
      }
      return false; // 404, keep polling
    } catch {
      setError('Analyse kon niet worden geladen.');
      setIsLoading(false);
      return true; // Error, stop polling
    }
  }, [vacancyId]);

  // Initial fetch + polling when 404
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    pollCountRef.current = 0;

    const poll = async () => {
      const done = await fetchAnalysis();
      if (!done && pollCountRef.current < 5) {
        pollCountRef.current++;
        pollRef.current = setTimeout(poll, 2000);
      } else if (!done) {
        // Max retries reached, still no data
        setIsLoading(false);
      }
    };

    poll();

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [vacancyId, fetchAnalysis]);

  const totalQuestions = questions.length;
  const knockoutCount = questions.filter((q) => q.type === 'knockout').length;
  const qualifyingCount = totalQuestions - knockoutCount;

  // -- Loading state --
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 rounded-full bg-brand-dark-blue/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-brand-dark-blue animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Analyseren...</p>
          <p className="text-xs text-gray-500 mt-1">
            AI analyseert je interviewvragen
          </p>
        </div>
      </div>
    );
  }

  // -- Error state --
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">{error}</p>
          <p className="text-xs text-gray-500 mt-1">
            Sla je vragen opnieuw op om de analyse te herstarten.
          </p>
        </div>
      </div>
    );
  }

  // -- No analysis available (404 after max retries) --
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">
            Nog geen analyse beschikbaar
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {totalQuestions > 0
              ? 'De analyse wordt uitgevoerd... Dit kan enkele minuten duren.'
              : 'Genereer eerst interviewvragen om een analyse te krijgen.'}
          </p>
        </div>
      </div>
    );
  }

  // -- Build question-level data by merging API results with local questions --
  const { summary, funnel } = analysis;
  const verdictConfig = VERDICT_CONFIG[summary.verdict];
  const VerdictIcon = verdictConfig.icon;

  // Map analysis question results by questionId for lookup
  const analysisMap = new Map(
    analysis.questions.map((q) => [q.questionId, q])
  );

  // Build merged question list: match ko_N / qual_N to questions in order
  type MergedQuestion = AnalysisQuestionResult & {
    questionText: string;
    type: 'knockout' | 'qualifying';
    index: number;
  };

  const mergedQuestions: MergedQuestion[] = [];
  const knockoutQuestions = questions.filter((q) => q.type === 'knockout');
  const qualifyingQuestions = questions.filter((q) => q.type === 'qualifying');

  knockoutQuestions.forEach((q, i) => {
    const analysisQ = analysisMap.get(`ko_${i + 1}`);
    if (analysisQ) {
      mergedQuestions.push({
        ...analysisQ,
        questionText: q.text,
        type: 'knockout',
        index: mergedQuestions.length,
      });
    }
  });

  qualifyingQuestions.forEach((q, i) => {
    const analysisQ = analysisMap.get(`qual_${i + 1}`);
    if (analysisQ) {
      mergedQuestions.push({
        ...analysisQ,
        questionText: q.text,
        type: 'qualifying',
        index: mergedQuestions.length,
      });
    }
  });

  // Also include any analysis questions that didn't match (fallback)
  for (const aq of analysis.questions) {
    const already = mergedQuestions.some((mq) => mq.questionId === aq.questionId);
    if (!already) {
      mergedQuestions.push({
        ...aq,
        questionText: aq.questionId,
        type: getQuestionIdPrefix(aq.questionId),
        index: mergedQuestions.length,
      });
    }
  }

  // Build funnel chart data
  const funnelData: FunnelPoint[] = funnel.map((f, i) => {
    let shortLabel = f.step;
    if (f.step === 'Start') shortLabel = 'Start';
    else if (f.step === 'Afgerond') shortLabel = 'Einde';
    else {
      // Try to create a V1, V2 label from ko_1, qual_1
      const koMatch = f.step.match(/^ko_(\d+)$/);
      const qualMatch = f.step.match(/^qual_(\d+)$/);
      if (koMatch) {
        shortLabel = `V${parseInt(koMatch[1])}`;
      } else if (qualMatch) {
        const koCount = knockoutQuestions.length;
        shortLabel = `V${koCount + parseInt(qualMatch[1])}`;
      } else {
        shortLabel = `V${i}`;
      }
    }
    return { step: f.step, shortLabel, candidates: f.candidates };
  });

  // Find biggest drop-off
  let maxDropOff = 0;
  let maxDropOffLabel = '';
  let maxDropOffCount = 0;
  for (let i = 1; i < funnelData.length; i++) {
    const drop = funnelData[i - 1].candidates - funnelData[i].candidates;
    if (drop > maxDropOff) {
      maxDropOff = drop;
      maxDropOffLabel = funnelData[i].shortLabel;
      maxDropOffCount = drop;
    }
  }

  // Completion count from funnel (last step)
  const completedCandidates = funnel[funnel.length - 1]?.candidates ?? 0;
  const totalCandidates = funnel[0]?.candidates ?? 200;

  return (
    <div className="space-y-8">
      {/* Section 1: Header + Summary Metrics */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-dark-blue flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Virtual Candidate Report
            </h2>
            <p className="text-xs text-gray-500">
              AI-analyse van {totalCandidates} gesimuleerde kandidaten
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-sky-50 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-xs text-gray-600">Voltooiingsgraad</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {summary.completionRate}%
            </span>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {completedCandidates} van {totalCandidates}
            </p>
          </div>

          <div className="rounded-xl bg-orange-50 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-xs text-gray-600">Gem. doorlooptijd</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {formatDuration(summary.avgTimeSeconds)}
            </span>
            <p className="text-[10px] text-gray-500 mt-0.5">per kandidaat</p>
          </div>

          <div className="rounded-xl bg-purple-50 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ListChecks className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs text-gray-600">Aantal vragen</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {totalQuestions}
            </span>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {knockoutCount} knockout, {qualifyingCount} kwalificerend
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Overall Verdict Banner */}
      <section className="rounded-xl bg-brand-dark-blue p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <VerdictIcon className={cn('w-4 h-4', verdictConfig.color)} />
            <span
              className={cn(
                'text-[10px] font-medium uppercase tracking-wide',
                verdictConfig.color
              )}
            >
              {verdictConfig.label}
            </span>
          </div>

          <h3 className="text-xl font-serif text-white mb-2">
            {summary.verdictHeadline}
          </h3>

          <p className="text-sm text-brand-light-blue leading-relaxed">
            {summary.verdictDescription}
          </p>
        </div>
      </section>

      {/* Section 3: Candidate Flow Chart */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          Kandidaat doorstroom
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Verwacht aantal kandidaten dat elke vraag bereikt
        </p>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={funnelData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip
                  content={<ChartTooltip funnelData={funnelData} />}
                />
                <Area
                  type="monotone"
                  dataKey="candidates"
                  stroke="#022641"
                  strokeWidth={2}
                  fill="#022641"
                  fillOpacity={0.06}
                  dot={{ fill: '#022641', strokeWidth: 0, r: 3 }}
                  activeDot={{
                    fill: '#022641',
                    strokeWidth: 2,
                    stroke: '#fff',
                    r: 5,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {maxDropOffCount > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs text-gray-600">
                Grootste drop-off bij{' '}
                <span className="font-medium text-gray-900">
                  {maxDropOffLabel}
                </span>
                {' '}(-{maxDropOffCount} kandidaten)
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Section 4: Per-Question Analysis Cards */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          Analyse per vraag
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Beoordeling en aanbevelingen per interviewvraag
        </p>

        <div className="space-y-3">
          {mergedQuestions.map((q) => (
            <div
              key={q.questionId}
              className="rounded-xl border border-gray-200 bg-white p-4"
              style={{
                animation: `fade-in-up 0.3s ease-out ${q.index * 50}ms backwards`,
              }}
            >
              {/* Question header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-400">
                      V{q.index + 1}
                    </span>
                    <TagBadge
                      label={
                        q.type === 'knockout' ? 'Knockout' : 'Kwalificerend'
                      }
                      variant={q.type === 'knockout' ? 'red' : 'blue'}
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {q.questionText}
                  </p>
                </div>

                {/* Risk indicator */}
                <div
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border',
                    q.dropOffRisk === 'low' &&
                      'border-green-500 text-green-600',
                    q.dropOffRisk === 'medium' &&
                      'border-orange-500 text-orange-600',
                    q.dropOffRisk === 'high' && 'border-red-500 text-red-600'
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      q.dropOffRisk === 'low' && 'bg-green-500',
                      q.dropOffRisk === 'medium' && 'bg-orange-500',
                      q.dropOffRisk === 'high' && 'bg-red-500'
                    )}
                  />
                  {DROP_OFF_LABELS[q.dropOffRisk]}
                </div>
              </div>

              {/* Metrics row */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{q.completionRate}% voltooid</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{q.avgTimeSeconds}s gem.</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="shrink-0">Helderheid</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 max-w-[80px]">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        q.clarityScore >= 80
                          ? 'bg-green-500'
                          : q.clarityScore >= 60
                            ? 'bg-orange-400'
                            : 'bg-red-500'
                      )}
                      style={{ width: `${q.clarityScore}%` }}
                    />
                  </div>
                  <span className="font-medium text-gray-700">
                    {q.clarityScore}
                  </span>
                </div>
              </div>

              {/* AI Tip */}
              {q.tip && (
                <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 rounded-lg">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {q.tip}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
