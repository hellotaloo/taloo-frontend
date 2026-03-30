'use client';

import { useState, useMemo } from 'react';
import { Building2, MapPin, ArrowUp, ArrowDown, ChevronsUpDown, AlertTriangle, ArrowRight, Send, Phone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AgentVacancy } from '@/lib/types';
import { cn, formatRelativeDate } from '@/lib/utils';
import { getStatValue } from '@/lib/agent-utils';
import { useTranslations, useLocale } from '@/lib/i18n';
import type { ImportVacancy } from '@/hooks/use-ats-import';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/kit/status-badge';
import { ChannelIcons } from '@/components/kit/status';

type SortKey = 'title' | 'candidatesCount' | 'completedCount' | 'qualifiedCount' | 'lastActivityAt';
type SortDirection = 'asc' | 'desc' | null;

interface SortableHeaderProps {
  label: string;
  sortKey: SortKey;
  currentSortKey: SortKey | null;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  className?: string;
}

function SortableHeader({ label, sortKey, currentSortKey, sortDirection, onSort, className }: SortableHeaderProps) {
  const isSorted = currentSortKey === sortKey;

  return (
    <TableHead
      className={cn(
        'cursor-pointer select-none hover:bg-gray-50 transition-colors',
        isSorted && 'bg-gray-50',
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <span className="inline-flex items-center">
          {isSorted ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="w-4 h-4 text-gray-700" />
            ) : (
              <ArrowDown className="w-4 h-4 text-gray-700" />
            )
          ) : (
            <ChevronsUpDown className="w-4 h-4 text-gray-400" />
          )}
        </span>
      </div>
    </TableHead>
  );
}

export interface PublishedVacanciesTableProps {
  vacancies: AgentVacancy[];
  generationStatus?: Map<string, ImportVacancy>;
  isImporting?: boolean;
}

// Keep old name as alias for backwards compatibility
export type GeneratedVacanciesTableProps = PublishedVacanciesTableProps;

export function PublishedVacanciesTable({ vacancies, generationStatus, isImporting }: PublishedVacanciesTableProps) {
  const router = useRouter();
  const t = useTranslations('vacancyTable');
  const { locale } = useLocale();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedVacancies = useMemo(() => {
    const base = generationStatus ? [...vacancies].reverse() : vacancies;
    if (!sortKey || !sortDirection) return base;

    return [...base].sort((a, b) => {
      let aValue: string | number | null | undefined;
      let bValue: string | number | null | undefined;

      switch (sortKey) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'candidatesCount':
          aValue = getStatValue(a.stats, 'candidates_count');
          bValue = getStatValue(b.stats, 'candidates_count');
          break;
        case 'completedCount':
          aValue = getStatValue(a.stats, 'completed_count');
          bValue = getStatValue(b.stats, 'completed_count');
          break;
        case 'qualifiedCount':
          aValue = getStatValue(a.stats, 'qualified_count');
          bValue = getStatValue(b.stats, 'qualified_count');
          break;
        case 'lastActivityAt':
          aValue = a.last_activity_at;
          bValue = b.last_activity_at;
          break;
      }

      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [vacancies, generationStatus, sortKey, sortDirection]);

  // Skeleton loading state during import with no vacancies yet
  if (vacancies.length === 0 && isImporting) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">{t('vacancy')}</TableHead>
            <TableHead className="text-center">{t('candidates')}</TableHead>
            <TableHead className="text-center">{t('completed')}</TableHead>
            <TableHead className="text-center">{t('qualified')}</TableHead>
            <TableHead>{t('lastActivity')}</TableHead>
            <TableHead className="text-right">{t('status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="space-y-1.5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </TableCell>
              <TableCell><div className="animate-pulse"><div className="h-3 w-6 bg-gray-200 rounded mx-auto" /></div></TableCell>
              <TableCell><div className="animate-pulse"><div className="h-3 w-6 bg-gray-200 rounded mx-auto" /></div></TableCell>
              <TableCell><div className="animate-pulse"><div className="h-3 w-6 bg-gray-200 rounded mx-auto" /></div></TableCell>
              <TableCell><div className="animate-pulse"><div className="h-3 w-16 bg-gray-200 rounded" /></div></TableCell>
              <TableCell><div className="animate-pulse"><div className="h-8 bg-gray-100 rounded-lg w-20 ml-auto" /></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (vacancies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
          <Phone className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">{t('noVacancies')}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader
            label={t('vacancy')}
            sortKey="title"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            className="w-full"
          />
          <SortableHeader
            label={t('candidates')}
            sortKey="candidatesCount"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            className="text-center"
          />
          <SortableHeader
            label={t('completed')}
            sortKey="completedCount"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            className="text-center"
          />
          <SortableHeader
            label={t('qualified')}
            sortKey="qualifiedCount"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            className="text-center"
          />
          <SortableHeader
            label={t('lastActivity')}
            sortKey="lastActivityAt"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TableHead className="text-right">{t('status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedVacancies.map((vacancy) => {
          const candidatesCount = getStatValue(vacancy.stats, 'candidates_count');
          const completedCount = getStatValue(vacancy.stats, 'completed_count');
          const qualifiedCount = getStatValue(vacancy.stats, 'qualified_count');
          const hasActivity = candidatesCount > 0;
          const isOnline = vacancy.agent_online === true;
          const genStatus = generationStatus?.get(vacancy.id);
          const isGenerating = genStatus?.status === 'generating' || vacancy.agent_status === 'generating';

          return (
            <TableRow
              key={vacancy.id}
              data-testid={`published-vacancy-row-${vacancy.id}`}
              className={cn(
                'cursor-pointer',
                isGenerating && 'bg-brand-dark-blue/[0.03] animate-pulse-subtle',
              )}
              onClick={() => router.push(`/pre-screening/detail/${vacancy.id}?mode=dashboard`)}
            >
              <TableCell>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {vacancy.title}
                    </span>
                    {vacancy.channels && (vacancy.channels.voice || vacancy.channels.whatsapp || vacancy.channels.cv) && <ChannelIcons channels={vacancy.channels} />}
                    {genStatus?.status === 'queued' && (
                      <StatusBadge label="Wachtrij" variant="blue" />
                    )}
                    {isGenerating && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-dark-blue text-white">
                        <span className="thinking-dots inline-flex items-center gap-[3px]">
                          <span /><span /><span />
                        </span>
                        {(genStatus?.activity || 'Genereren').replace(/\.{2,}$/, '')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {vacancy.company}
                    </span>
                    {vacancy.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {vacancy.location}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? candidatesCount : '-'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? completedCount : '-'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? qualifiedCount : '-'}
                </span>
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {formatRelativeDate(vacancy.last_activity_at, locale)}
              </TableCell>
              <TableCell className="text-right">
                {genStatus?.status === 'published' ? (
                  <StatusBadge label={t('online')} variant="green" />
                ) : genStatus?.status === 'failed' ? (
                  <StatusBadge label={t('failed')} variant="orange" icon={AlertTriangle} />
                ) : isGenerating ? (
                  <span className="text-xs text-gray-400">{t('busy')}</span>
                ) : genStatus?.status === 'queued' ? (
                  <Link
                    href={`/pre-screening/detail/${vacancy.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {t('generate')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : isOnline || vacancy.agent_status === 'published' ? (
                  <StatusBadge label={t('online')} variant="green" />
                ) : vacancy.agent_status === 'generated' ? (
                  <Link
                    href={`/pre-screening/detail/${vacancy.id}?mode=edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {t('publish')}
                    <Send className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    href={`/pre-screening/detail/${vacancy.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {t('generate')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Keep old name as alias for backwards compatibility
export const GeneratedVacanciesTable = PublishedVacanciesTable;
