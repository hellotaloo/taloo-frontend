'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, MapPin, ArrowRight, Zap, FileEdit, CheckCircle, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Vacancy } from '@/lib/types';
import { formatDateTime, cn } from '@/lib/utils';
import { publishPreScreening } from '@/lib/interview-api';
import { PublishDialog, PublishChannels } from '@/components/blocks/channel-management';
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
}

// Keep old name as alias for backwards compatibility
export type PendingVacanciesTableProps = ConceptVacanciesTableProps;

export function ConceptVacanciesTable({ vacancies }: ConceptVacanciesTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [publishingVacancy, setPublishingVacancy] = useState<Vacancy | null>(null);

  const handlePublish = async (channels: PublishChannels) => {
    if (!publishingVacancy) return;

    try {
      await publishPreScreening(publishingVacancy.id, {
        enable_voice: channels.voice,
        enable_whatsapp: channels.whatsapp,
        enable_cv: channels.cv,
      });

      toast.success(`"${publishingVacancy.title}" is gepubliceerd!`);
      router.push(`/pre-screening/edit/${publishingVacancy.id}?view=dashboard`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Publiceren mislukt. Probeer het opnieuw.');
      throw error;
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Toggle direction or clear sort
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      // New sort key, default to ascending
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedVacancies = useMemo(() => {
    if (!sortKey || !sortDirection) return vacancies;

    return [...vacancies].sort((a, b) => {
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
  }, [vacancies, sortKey, sortDirection]);

  if (vacancies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <FileEdit className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">Geen concepten. Alle vacatures zijn gepubliceerd.</p>
      </div>
    );
  }

  return (
    <>
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
          <TableHead>Bron</TableHead>
          <SortableHeader
            label="Geïmporteerd"
            sortKey="createdAt"
            currentSortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TableHead className="w-[280px]">Acties</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedVacancies.map((vacancy) => {
          const isGenerated = vacancy.hasScreening;

          return (
            <TableRow key={vacancy.id} data-testid={`concept-vacancy-row-${vacancy.id}`}>
              <TableCell>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {vacancy.title}
                    </span>
                    {isGenerated && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Zap className="w-2.5 h-2.5" />
                        Gegenereerd
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
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/pre-screening/edit/${vacancy.id}`}
                    data-testid={`edit-prescreening-btn-${vacancy.id}`}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors",
                      isGenerated ? "flex-1" : "w-full"
                    )}
                  >
                    {isGenerated ? 'Bewerken' : 'Pre-screening genereren'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  {isGenerated && (
                    <button
                      type="button"
                      data-testid={`publish-prescreening-btn-${vacancy.id}`}
                      onClick={() => setPublishingVacancy(vacancy)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Publiceren
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>

    <PublishDialog
      open={!!publishingVacancy}
      onOpenChange={(open) => !open && setPublishingVacancy(null)}
      onPublish={handlePublish}
    />
  </>
  );
}

// Keep old name as alias for backwards compatibility
export const PendingVacanciesTable = ConceptVacanciesTable;
