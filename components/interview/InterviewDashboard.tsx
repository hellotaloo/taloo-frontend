'use client';

import { Users, CheckCircle, Award } from 'lucide-react';
import { MetricCard } from '@/components/metrics/MetricCard';

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

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
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
    </div>
  );
}
