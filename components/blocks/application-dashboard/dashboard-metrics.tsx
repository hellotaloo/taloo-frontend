'use client';

import { Users, CheckCircle, Award, BarChart3 } from 'lucide-react';
import { MetricCard } from '@/components/kit/metric-card';
import { cn } from '@/lib/utils';

export type AnswerRating = 'excellent' | 'good' | 'average' | 'below_average' | 'weak';
export type ApplicationStatus = 'active' | 'processing' | 'completed' | 'abandoned';

export interface Application {
  id: string;
  candidateName: string;
  interactionTime: string; // e.g., "2m 34s"
  interactionSeconds: number;
  status: ApplicationStatus;
  qualified: boolean;
  openQuestionsScore?: number;
  knockoutPassed?: number;
  knockoutTotal?: number;
  openQuestionsTotal?: number;
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
        <div className="my-3 flex-1 flex items-center justify-center">
          <span className="text-sm text-gray-600">Niet genoeg data</span>
        </div>
      </div>
    </div>
  );
}
