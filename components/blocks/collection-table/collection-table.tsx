'use client';

import { User } from 'lucide-react';
import { cn, formatTimestamp, formatRelativeDate, formatPhoneNumber } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CandidacyStage, CollectionProgress, DocumentCollectionResponse } from '@/lib/types';

const progressLabels: Record<CollectionProgress, string> = {
  pending:     'Wachtend',
  started:     'Gestart',
  in_progress: 'Bezig',
};

const stageLabels: Record<CandidacyStage, string> = {
  new:                'Nieuw',
  pre_screening:      'Pre-screening',
  qualified:          'Gekwalificeerd',
  interview_planned:  'Interview gepland',
  interview_done:     'Interview afgerond',
  offer:              'Aanbod',
  placed:             'Geplaatst',
  rejected:           'Afgewezen',
  withdrawn:          'Teruggetrokken',
};

interface CollectionTableProps {
  collections: DocumentCollectionResponse[];
  onSelectCollection?: (id: string) => void;
  selectedId?: string | null;
}

export function CollectionTable({
  collections,
  onSelectCollection,
  selectedId,
}: CollectionTableProps) {
  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="relative mb-6">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
          </div>
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-gray-300 animate-ping [animation-duration:2s]" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border border-gray-200 animate-ping [animation-duration:2s] [animation-delay:500ms]" />
        </div>
        <p className="text-sm text-gray-500">Luisteren naar nieuwe collecties</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kandidaat</TableHead>
          <TableHead>Vacature</TableHead>
          <TableHead>Fase</TableHead>
          <TableHead>Voortgang</TableHead>
          <TableHead>Gestart</TableHead>
          <TableHead>Bijgewerkt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {collections.map((collection) => (
            <TableRow
              key={collection.id}
              data-testid={`collection-row-${collection.id}`}
              className={cn(
                'cursor-pointer transition-colors',
                selectedId === collection.id && 'bg-gray-50'
              )}
              onClick={() => onSelectCollection?.(collection.id)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900 block truncate">
                      {collection.candidate_name}
                    </span>
                    {collection.candidate_phone && (
                      <span className="text-xs text-gray-500">{formatPhoneNumber(collection.candidate_phone)}</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                {collection.vacancy_title || '-'}
              </TableCell>
              <TableCell>
                {collection.candidacy_stage ? (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {stageLabels[collection.candidacy_stage] ?? collection.candidacy_stage}
                  </span>
                ) : '-'}
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600 block">
                  {collection.progress
                    ? progressLabels[collection.progress] ?? collection.progress
                    : 'In wachtrij'}
                </span>
                {collection.progress && (
                  <span className="text-xs text-gray-400">
                    {collection.documents_collected}/{collection.documents_total} documenten
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatTimestamp(collection.started_at)}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatRelativeDate(collection.updated_at)}
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
