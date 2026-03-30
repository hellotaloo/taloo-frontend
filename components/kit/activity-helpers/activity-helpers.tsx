'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagBadge } from '@/components/kit/tag-badge';
import { useTranslations, useLocale } from '@/lib/i18n';

// Map English step labels from API to translation keys
const stepLabelKeyMap: Record<string, string> = {
  'Waiting': 'waiting',
  'In Progress': 'inProgress',
  'Completed': 'completed',
  'Failed': 'failed',
  'Pending': 'pending',
  'Scheduled': 'scheduled',
  'Sent': 'sent',
  'Cancelled': 'cancelled',
  'Generating Plan': 'generatingPlan',
  'Plan Generated': 'planGenerated',
  'Collecting Documents': 'collectingDocuments',
  'Follow Up': 'followUp',
  'Follow-up': 'followUp',
  'Finished': 'finished',
  'WhatsApp Conversation': 'whatsappConversation',
  'Voice Call': 'voiceCall',
  'Screening': 'screening',
  'Review': 'review',
  'Approved': 'approved',
  'Rejected': 'rejected',
};

export function useTranslateStepLabel() {
  const t = useTranslations('activitySteps');
  return (label: string): string => {
    const key = stepLabelKeyMap[label];
    return key ? t(key) : label;
  };
}

/** @deprecated Use useTranslateStepLabel() hook instead */
export function translateStepLabel(label: string): string {
  const key = stepLabelKeyMap[label];
  // Fallback for non-hook contexts — returns English label as-is
  return key ? label : label;
}

export function ActivityStatusBadge({ status, isStuck }: { status: string; isStuck: boolean }) {
  const t = useTranslations('activitySteps');
  if (isStuck || status === 'stuck') {
    return <TagBadge label={t('blocked')} variant="orange" />;
  }
  return <TagBadge label={t('active')} variant="green" />;
}

export function SLABadge({ status, isStuck, timeRemainingSeconds: initialSeconds }: { status: string; isStuck: boolean; timeRemainingSeconds: number | null }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const { locale } = useLocale();

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds === null || status === 'completed' || isStuck) return;
    const interval = setInterval(() => {
      setSeconds(prev => prev !== null ? prev - 1 : null);
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds !== null, status, isStuck]);

  const hourUnit = locale === 'en' ? 'h' : 'u';
  const overdueLabel = locale === 'en' ? 'overdue' : 'te laat';

  if (isStuck && seconds !== null) {
    const absSeconds = Math.abs(seconds);
    const days = Math.floor(absSeconds / 86400);
    const hours = Math.floor((absSeconds % 86400) / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    let formatted = '';
    if (days > 0) formatted = `${days}d ${hours}${hourUnit} ${minutes}m`;
    else if (hours > 0) formatted = `${hours}${hourUnit} ${minutes}m`;
    else formatted = `${minutes} min`;

    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums text-red-600">
        <Clock className="w-3.5 h-3.5" />
        {formatted} {overdueLabel}
      </span>
    );
  }

  if (seconds === null) {
    return <span className="text-gray-400">-</span>;
  }

  const absSeconds = Math.abs(seconds);
  const days = Math.floor(absSeconds / 86400);
  const hours = Math.floor((absSeconds % 86400) / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;
  let formatted = '';
  if (days > 0) formatted = `${days}d ${hours}${hourUnit} ${minutes}m ${secs}s`;
  else if (hours > 0) formatted = `${hours}${hourUnit} ${minutes}m ${secs}s`;
  else if (minutes > 0) formatted = `${minutes}m ${secs}s`;
  else formatted = `${secs}s`;

  const isOverdue = seconds < 0;
  const isUrgent = seconds >= 0 && seconds < 30 * 60;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-sm font-medium tabular-nums',
      isOverdue && 'text-red-600',
      isUrgent && !isOverdue && 'text-orange-600',
      !isOverdue && !isUrgent && 'text-green-600'
    )}>
      <Clock className="w-3.5 h-3.5" />
      {formatted}
    </span>
  );
}
