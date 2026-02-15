'use client';

import Link from 'next/link';
import { Building2, ChevronRight, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Application status styles
const applicationStatusStyles = {
  applied: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Gesolliciteerd' },
  screening: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Screening' },
  submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Voorgesteld' },
  placed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Geplaatst' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Afgewezen' },
} as const;

export type ApplicationStatus = keyof typeof applicationStatusStyles;

export interface VacancyCardProps {
  /** Vacancy title */
  title: string;
  /** Company name */
  company: string;
  /** Application status */
  status: ApplicationStatus;
  /** Pre-screening score (0-100), null if not yet scored */
  score?: number | null;
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

export function VacancyCard({
  title,
  company,
  status,
  score,
  appliedAt,
  href,
  className,
}: VacancyCardProps) {
  const content = (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm truncate">{title}</span>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <Building2 className="w-3 h-3" />
          {company}
        </div>
        {appliedAt && (
          <div className="text-[10px] text-gray-400 mt-1">
            Gesolliciteerd: {formatRelativeDate(appliedAt)}
          </div>
        )}
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
