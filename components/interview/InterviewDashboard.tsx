'use client';

import { Users, CheckCircle, Award, BarChart3 } from 'lucide-react';
import { MetricCard } from '@/components/metrics/MetricCard';
import { cn } from '@/lib/utils';

export type AnswerRating = 'excellent' | 'good' | 'average' | 'poor';
export type ApplicationStatus = 'active' | 'processing' | 'completed';

export interface Application {
  id: string;
  candidateName: string;
  interactionTime: string; // e.g., "2m 34s"
  interactionSeconds: number;
  status: ApplicationStatus;
  qualified: boolean;
  overallScore?: number;
  knockoutPassed?: number;
  knockoutTotal?: number;
  qualificationCount?: number;
  summary?: string;
  timestamp: string;
  synced?: boolean;
  channel: 'voice' | 'whatsapp' | 'cv';
  interviewSlot?: string | null;
  isTest?: boolean;
  answers: {
    questionId: string;
    questionText: string;
    questionType: 'knockout' | 'qualification';
    answer: string;
    passed?: boolean;
    score?: number;
    rating?: AnswerRating;
    motivation?: string;
  }[];
}

interface InterviewDashboardProps {
  applications: Application[];
}

export function InterviewDashboard({ applications }: InterviewDashboardProps) {
  const totalApplications = applications.length;
  const completedCount = applications.filter(a => a.status === 'completed').length;
  const qualifiedCount = applications.filter(a => a.qualified).length;
  
  const completionRate = totalApplications > 0 
    ? Math.round((completedCount / totalApplications) * 100) 
    : 0;
  
  const qualificationRate = completedCount > 0 
    ? Math.round((qualifiedCount / completedCount) * 100) 
    : 0;

  const dropOffRate = totalApplications > 0
    ? Math.round(((totalApplications - completedCount) / totalApplications) * 100)
    : 0;

  const difficultyLabel = totalApplications === 0
    ? '—'
    : qualificationRate >= 70
      ? 'Laag'
      : qualificationRate >= 40
        ? 'Gemiddeld'
        : 'Hoog';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Totaal sollicitaties"
        value={totalApplications}
        icon={Users}
        variant="blue"
        label="kandidaten"
      />
      <MetricCard
        title="Afgerond"
        value={`${completionRate}%`}
        icon={CheckCircle}
        variant="lime"
        progress={completionRate}
        label={`${completedCount} van ${totalApplications}`}
      />
      <MetricCard
        title="Gekwalificeerd"
        value={`${qualificationRate}%`}
        icon={Award}
        variant="dark"
        progress={qualificationRate}
        label={`${qualifiedCount} van ${completedCount}`}
      />
      <div
        className={cn(
          'rounded-xl p-5 min-h-[140px] flex flex-col',
          'bg-purple-100 text-gray-900'
        )}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <BarChart3 className="w-4 h-4" />
          Insights
        </div>
        <div className="my-3 flex-1 flex flex-col gap-2 justify-center">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Drop-off risico</span>
            <span className="font-semibold text-gray-900">{dropOffRate}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-purple-200">
            <div
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${Math.min(100, dropOffRate)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Moeilijkheid</span>
            <span className="font-semibold text-gray-900">{difficultyLabel}</span>
          </div>
        </div>
        <div className="text-xs text-gray-600 mt-auto">
          {totalApplications > 0
            ? `${totalApplications - completedCount} afgehaakt · gebaseerd op kwalificatie`
            : 'Geen data'}
        </div>
      </div>
    </div>
  );
}
