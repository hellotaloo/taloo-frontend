'use client';

import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { MetricCard } from '@/components/kit/metric-card';

export interface DashboardMetrics {
  totalRequests: number;
  completionRate: number;
  verificationPending: number;
  averageCollectionTime: number; // in days
}

interface DashboardMetricsProps {
  metrics: DashboardMetrics;
  isLoading?: boolean;
}

export function DashboardMetrics({ metrics, isLoading = false }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        variant="blue"
        title="Documentverzoeken"
        icon={FileText}
        label="Totaal verzonden"
        value={metrics.totalRequests.toString()}
      />
      <MetricCard
        variant="lime"
        title="Compleet"
        icon={CheckCircle2}
        label="Volledig ontvangen"
        value={`${metrics.completionRate}%`}
      />
      <MetricCard
        variant="orange"
        title="In behandeling"
        icon={AlertCircle}
        label="Verificatie pending"
        value={metrics.verificationPending.toString()}
      />
      <MetricCard
        variant="purple"
        title="Verzameltijd"
        icon={Clock}
        label="Gem. verzameltijd"
        value={`${metrics.averageCollectionTime.toFixed(1)} dagen`}
      />
    </div>
  );
}
