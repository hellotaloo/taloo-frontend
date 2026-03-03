'use client';

import { useState, useMemo } from 'react';
import { Building2, MapPin, ArrowRight, FileEdit, Send, ArrowUp, ArrowDown, ChevronsUpDown, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Vacancy } from '@/lib/types';
import { formatDateTime, cn } from '@/lib/utils';
import type { ImportVacancy } from '@/hooks/use-ats-import';
import { StatusBadge } from '@/components/kit/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type SortKey = 'title' | 'createdAt';
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

export interface ConceptVacanciesTableProps {
  vacancies: Vacancy[];
  generationStatus?: Map<string, ImportVacancy>;
  isImporting?: boolean;
  onSync?: () => void;
}

// Keep old name as alias for backwards compatibility
export type PendingVacanciesTableProps = ConceptVacanciesTableProps;

export function ConceptVacanciesTable({ vacancies, generationStatus, isImporting, onSync }: ConceptVacanciesTableProps) {
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
      let aValue: string | undefined;
      let bValue: string | undefined;

      if (sortKey === 'title') {
        aValue = a.title;
        bValue = b.title;
      } else if (sortKey === 'createdAt') {
        aValue = a.createdAt;
        bValue = b.createdAt;
      }

      if (!aValue) return sortDirection === 'asc' ? 1 : -1;
      if (!bValue) return sortDirection === 'asc' ? -1 : 1;

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [vacancies, sortKey, sortDirection, generationStatus]);

  if (vacancies.length === 0 && !isImporting) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
          <FileEdit className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">Geen concepten. Alle vacatures zijn gepubliceerd.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          onClick={() => onSync?.()}
        >
          <RefreshCw className="w-4 h-4" />
          Sync ATS
        </Button>
      </div>
    );
  }

  if (vacancies.length === 0 && isImporting) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">Vacatures</TableHead>
            <TableHead>Bron</TableHead>
            <TableHead>Geïmporteerd</TableHead>
            <TableHead className="w-[280px] text-right">Acties</TableHead>
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
              <TableCell>
                <div className="animate-pulse">
                  <div className="h-3 w-4 bg-gray-200 rounded mx-auto" />
                </div>
              </TableCell>
              <TableCell>
                <div className="animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-28" />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-100 rounded-lg w-24 ml-auto" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader
            label="Vacatures"
            sortKey="title"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            className="w-full"
          />
          <TableHead>Bron</TableHead>
          <SortableHeader
            label="Geïmporteerd"
            sortKey="createdAt"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TableHead className="w-[280px] text-right">Acties</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedVacancies.map((vacancy) => {
          const isGenerated = vacancy.hasScreening;
          const genStatus = generationStatus?.get(vacancy.id);

          return (
            <TableRow
              key={vacancy.id}
              data-testid={`concept-vacancy-row-${vacancy.id}`}
              className={cn(
                genStatus?.status === 'generating' && 'bg-brand-dark-blue/[0.03] animate-pulse-subtle',
              )}
            >
              <TableCell>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {vacancy.title}
                    </span>
                    {genStatus?.status === 'queued' && (
                      <StatusBadge label="Wachtrij" variant="blue" />
                    )}
                    {genStatus?.status === 'generating' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-dark-blue text-white">
                        <span className="thinking-dots inline-flex items-center gap-[3px]">
                          <span /><span /><span />
                        </span>
                        {(genStatus.activity || 'Genereren').replace(/\.{2,}$/, '')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {vacancy.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {vacancy.location}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Image
                  src="/salesforc-logo-cloud.png"
                  alt="Salesforce"
                  width={16}
                  height={11}
                  className="inline-block"
                />
              </TableCell>
              <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                {formatDateTime(vacancy.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                {genStatus?.status === 'queued' && (
                  <Link
                    href={`/pre-screening/detail/${vacancy.id}`}
                    data-testid={`generate-prescreening-btn-${vacancy.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Genereren
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                {genStatus?.status === 'generating' && (
                  <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-lg cursor-not-allowed">
                    Genereren
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
                {genStatus?.status === 'published' && (
                  <StatusBadge label={`${genStatus.questionsCount} vragen`} variant="green" icon={CheckCircle2} />
                )}
                {genStatus?.status === 'failed' && (
                  <StatusBadge label="Mislukt" variant="orange" icon={AlertTriangle} />
                )}
                {!genStatus && isGenerated && (
                  <Link
                    href={`/pre-screening/detail/${vacancy.id}?mode=edit`}
                    data-testid={`publish-prescreening-btn-${vacancy.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Publiceren
                  </Link>
                )}
                {!genStatus && !isGenerated && (
                  <Link
                    href={`/pre-screening/detail/${vacancy.id}`}
                    data-testid={`generate-prescreening-btn-${vacancy.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Genereren
                    <ArrowRight className="w-4 h-4" />
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
export const PendingVacanciesTable = ConceptVacanciesTable;
