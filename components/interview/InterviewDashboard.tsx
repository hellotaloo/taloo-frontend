'use client';

import { Users, CheckCircle, Award } from 'lucide-react';
import { MetricCard } from '@/components/metrics/MetricCard';

export type AnswerRating = 'excellent' | 'good' | 'average' | 'poor';

export interface Application {
  id: string;
  candidateName: string;
  interactionTime: string; // e.g., "2m 34s"
  interactionSeconds: number;
  completed: boolean;
  qualified: boolean;
  overallScore?: number;
  knockoutPassed?: number;
  knockoutTotal?: number;
  qualificationCount?: number;
  summary?: string;
  timestamp: string;
  synced?: boolean;
  channel: 'voice' | 'whatsapp';
  answers: {
    questionId: string;
    questionText: string;
    answer: string;
    passed?: boolean;
    score?: number;
    rating?: AnswerRating;
  }[];
}

interface InterviewDashboardProps {
  applications: Application[];
}

export function InterviewDashboard({ applications }: InterviewDashboardProps) {
  const totalApplications = applications.length;
  const completedCount = applications.filter(a => a.completed).length;
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
