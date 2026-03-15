'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagBadge } from '@/components/kit/tag-badge';

// Translate English step labels from API to Dutch
export const stepLabelNl: Record<string, string> = {
  'Waiting': 'Wachtend',
  'In Progress': 'Bezig',
  'Completed': 'Afgerond',
  'Failed': 'Mislukt',
  'Pending': 'In afwachting',
  'Scheduled': 'Ingepland',
  'Sent': 'Verstuurd',
  'Cancelled': 'Geannuleerd',
  'Generating Plan': 'Plan genereren',
  'Plan Generated': 'Plan opgesteld',
  'Collecting Documents': 'Documenten verzamelen',
  'Follow Up': 'Opvolging',
  'Follow-up': 'Opvolging',
  'Finished': 'Afgerond',
  'WhatsApp Conversation': 'WhatsApp gesprek',
  'Voice Call': 'Telefoongesprek',
  'Screening': 'Screening',
  'Review': 'Beoordeling',
  'Approved': 'Goedgekeurd',
  'Rejected': 'Afgewezen',
};

export function translateStepLabel(label: string): string {
  return stepLabelNl[label] || label;
}

export function ActivityStatusBadge({ status, isStuck }: { status: string; isStuck: boolean }) {
  if (isStuck || status === 'stuck') {
    return <TagBadge label="Geblokkeerd" variant="orange" />;
  }
  return <TagBadge label="Actief" variant="green" />;
}

export function SLABadge({ status, isStuck, timeRemainingSeconds: initialSeconds }: { status: string; isStuck: boolean; timeRemainingSeconds: number | null }) {
  const [seconds, setSeconds] = useState(initialSeconds);

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

  if (isStuck && seconds !== null) {
    const absSeconds = Math.abs(seconds);
    const days = Math.floor(absSeconds / 86400);
    const hours = Math.floor((absSeconds % 86400) / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    let formatted = '';
    if (days > 0) formatted = `${days}d ${hours}u ${minutes}m`;
    else if (hours > 0) formatted = `${hours}u ${minutes}m`;
    else formatted = `${minutes} min`;

    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums text-red-600">
        <Clock className="w-3.5 h-3.5" />
        {formatted} te laat
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
  if (days > 0) formatted = `${days}d ${hours}u ${minutes}m ${secs}s`;
  else if (hours > 0) formatted = `${hours}u ${minutes}m ${secs}s`;
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
