'use client';

import { useState, useMemo } from 'react';
import { Building2, MapPin, Archive, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Vacancy } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChannelIcons } from '@/components/kit/status';

type SortKey = 'title' | 'candidatesCount' | 'completedCount' | 'qualifiedCount' | 'archivedAt';
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

export interface ArchivedVacanciesTableProps {
  vacancies: Vacancy[];
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ArchivedVacanciesTable({ vacancies }: ArchivedVacanciesTableProps) {
  const router = useRouter();
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
    if (!sortKey || !sortDirection) return vacancies;

    return [...vacancies].sort((a, b) => {
      let aValue: string | number | null | undefined;
      let bValue: string | number | null | undefined;

      switch (sortKey) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'candidatesCount':
          aValue = a.candidatesCount;
          bValue = b.candidatesCount;
          break;
        case 'completedCount':
          aValue = a.completedCount;
          bValue = b.completedCount;
          break;
        case 'qualifiedCount':
          aValue = a.qualifiedCount;
          bValue = b.qualifiedCount;
          break;
        case 'archivedAt':
          aValue = a.archivedAt;
          bValue = b.archivedAt;
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
  }, [vacancies, sortKey, sortDirection]);

  if (vacancies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <Archive className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">Geen gearchiveerde vacatures.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader
            label="Vacature"
            sortKey="title"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            className="w-full"
          />
          <TableHead>Kanalen</TableHead>
          <SortableHeader
            label="Kandidaten"
            sortKey="candidatesCount"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            className="text-center"
          />
          <SortableHeader
            label="Afgerond"
            sortKey="completedCount"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            className="text-center"
          />
          <SortableHeader
            label="Gekwalificeerd"
            sortKey="qualifiedCount"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            className="text-center"
          />
          <SortableHeader
            label="Gearchiveerd"
            sortKey="archivedAt"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedVacancies.map((vacancy) => {
          const hasActivity = vacancy.candidatesCount > 0;
          return (
            <TableRow
              key={vacancy.id}
              data-testid={`archived-vacancy-row-${vacancy.id}`}
              className="cursor-pointer"
              onClick={() => router.push(`/pre-screening/view/${vacancy.id}`)}
            >
              <TableCell>
                <div className="min-w-0">
                  <span className="font-medium text-gray-900 truncate block">
                    {vacancy.title}
                  </span>
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
              <TableCell>
                <ChannelIcons channels={vacancy.channels} />
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? vacancy.candidatesCount : '-'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? vacancy.completedCount : '-'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? vacancy.qualifiedCount : '-'}
                </span>
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {formatDate(vacancy.archivedAt)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
