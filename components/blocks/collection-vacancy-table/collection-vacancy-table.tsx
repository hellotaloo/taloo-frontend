'use client';

import { useState, useMemo, useCallback } from 'react';
import { Building2, MapPin, FileText, ArrowUp, ArrowDown, ChevronsUpDown, Power, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Vacancy } from '@/lib/types';
import { cn } from '@/lib/utils';
import { updateVacancyAgentStatus } from '@/lib/document-collection-api';
import { StatusBadge } from '@/components/kit/status-badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

type SortKey = 'title' | 'active' | 'completed' | 'needsReview' | 'lastActivityAt';
type SortDirection = 'asc' | 'desc' | null;

export interface CollectionStats {
  active: number;
  completed: number;
  needsReview: number;
  total: number;
  lastActivityAt?: string | null;
}

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

export interface CollectionVacancyTableProps {
  vacancies: Vacancy[];
  collectionStats: Map<string, CollectionStats>;
}

function formatRelativeDate(dateString: string | null | undefined) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Zojuist';
  if (diffMins < 60) return `${diffMins}m geleden`;
  if (diffHours < 24) return `${diffHours}u geleden`;
  if (diffDays < 7) return `${diffDays}d geleden`;
  return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
}

export function CollectionVacancyTable({ vacancies, collectionStats }: CollectionVacancyTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [activatedIds, setActivatedIds] = useState<Set<string>>(new Set());

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

  const handleActivateAgent = useCallback(async (e: React.MouseEvent, vacancyId: string) => {
    e.stopPropagation();
    setActivatingId(vacancyId);
    try {
      await updateVacancyAgentStatus(vacancyId, 'document_collection', { is_online: true });
      setActivatedIds(prev => new Set(prev).add(vacancyId));
      toast.success('Agent is geactiveerd');
    } catch {
      toast.error('Kon agent niet activeren');
    } finally {
      setActivatingId(null);
    }
  }, []);

  const sortedVacancies = useMemo(() => {
    if (!sortKey || !sortDirection) return vacancies;

    return [...vacancies].sort((a, b) => {
      let aValue: string | number | null | undefined;
      let bValue: string | number | null | undefined;

      const aStats = collectionStats.get(a.id);
      const bStats = collectionStats.get(b.id);

      switch (sortKey) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'active':
          aValue = aStats?.active ?? 0;
          bValue = bStats?.active ?? 0;
          break;
        case 'completed':
          aValue = aStats?.completed ?? 0;
          bValue = bStats?.completed ?? 0;
          break;
        case 'needsReview':
          aValue = aStats?.needsReview ?? 0;
          bValue = bStats?.needsReview ?? 0;
          break;
        case 'lastActivityAt':
          aValue = aStats?.lastActivityAt ?? null;
          bValue = bStats?.lastActivityAt ?? null;
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
  }, [vacancies, collectionStats, sortKey, sortDirection]);

  if (vacancies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">Geen vacatures met documentcollectie.</p>
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
          <SortableHeader
            label="Actief"
            sortKey="active"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            className="text-center"
          />
          <SortableHeader
            label="Afgerond"
            sortKey="completed"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            className="text-center"
          />
          <SortableHeader
            label="Review"
            sortKey="needsReview"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            className="text-center"
          />
          <SortableHeader
            label="Laatste activiteit"
            sortKey="lastActivityAt"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedVacancies.map((vacancy) => {
          const stats = collectionStats.get(vacancy.id);
          const hasActivity = (stats?.total ?? 0) > 0;
          const agentOnline = vacancy.agents?.preonboarding?.status === 'online' || activatedIds.has(vacancy.id);

          return (
            <TableRow
              key={vacancy.id}
              className="cursor-pointer"
              onClick={() => router.push(`/document-collection/vacancy/${vacancy.id}`)}
            >
              <TableCell>
                <div className="min-w-0">
                  <span className="font-medium text-gray-900 truncate">
                    {vacancy.title}
                  </span>
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
                  {hasActivity ? (stats?.active ?? 0) : '-'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? (stats?.completed ?? 0) : '-'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${(stats?.needsReview ?? 0) > 0 ? 'text-orange-600' : hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? (stats?.needsReview ?? 0) : '-'}
                </span>
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {formatRelativeDate(stats?.lastActivityAt)}
              </TableCell>
              <TableCell className="text-right">
                {agentOnline ? (
                  <StatusBadge label="Online" variant="green" />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    disabled={activatingId === vacancy.id}
                    onClick={(e) => handleActivateAgent(e, vacancy.id)}
                  >
                    {activatingId === vacancy.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Power className="w-3.5 h-3.5" />
                    )}
                    Activeer
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
