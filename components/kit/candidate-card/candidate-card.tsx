'use client';

import Link from 'next/link';
import { Mail, Phone, ChevronRight, Clock, TrendingUp, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

// Application status styles
const applicationStatusStyles = {
  applied: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Gesolliciteerd' },
  screening: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Screening' },
  submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Voorgesteld' },
  placed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Geplaatst' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Afgewezen' },
} as const;

// Channel icons and labels
const channelConfig = {
  voice: { label: 'Voice' },
  whatsapp: { label: 'WhatsApp' },
  cv: { label: 'CV' },
} as const;

export type ApplicationStatus = keyof typeof applicationStatusStyles;
export type Channel = keyof typeof channelConfig;

export interface CandidateCardProps {
  /** Candidate name */
  name: string;
  /** Contact email */
  email?: string;
  /** Contact phone */
  phone?: string;
  /** Application status */
  status: ApplicationStatus;
  /** Pre-screening score (0-100), null if not yet scored */
  score?: number | null;
  /** Channel used to apply */
  channel?: Channel;
  /** When the candidate applied (ISO date string) */
  appliedAt?: string;
  /** Link href - if provided, card becomes clickable */
  href?: string;
  /** Additional className */
  className?: string;
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 1) return 'Vandaag';
  if (diffDays === 1) return 'Gisteren';
  if (diffDays < 7) return `${diffDays} dagen geleden`;
  return date.toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const style = applicationStatusStyles[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium',
        style.bg,
        style.text
      )}
    >
      {style.label}
    </span>
  );
}

function ScoreDisplay({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return (
      <span className="text-xs text-gray-400 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Geen score
      </span>
    );
  }

  let colorClass = 'text-red-600';
  if (score >= 80) colorClass = 'text-green-600';
  else if (score >= 60) colorClass = 'text-lime-600';
  else if (score >= 40) colorClass = 'text-orange-600';

  return (
    <span className={cn('text-sm font-semibold flex items-center gap-1', colorClass)}>
      <TrendingUp className="w-3.5 h-3.5" />
      {score}/100
    </span>
  );
}

export function CandidateCard({
  name,
  email,
  phone,
  status,
  score,
  channel,
  appliedAt,
  href,
  className,
}: CandidateCardProps) {
  const content = (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm truncate">{name}</span>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          {email && (
            <span className="flex items-center gap-1 truncate">
              <Mail className="w-3 h-3 shrink-0" />
              <span className="truncate">{email}</span>
            </span>
          )}
          {phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 shrink-0" />
              {phone}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
          {appliedAt && (
            <span>Gesolliciteerd: {formatRelativeDate(appliedAt)}</span>
          )}
          {channel && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {channelConfig[channel].label}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <ScoreDisplay score={score} />
        {href && (
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
        )}
      </div>
    </div>
  );

  const baseStyles = cn(
    'block bg-white border border-gray-200 rounded-lg p-3 transition-colors',
    href && 'hover:border-gray-300 group',
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseStyles}>
        {content}
      </Link>
    );
  }

  return <div className={baseStyles}>{content}</div>;
}
