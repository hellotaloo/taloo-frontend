'use client';

import { FileText, User, RefreshCw } from 'lucide-react';
import { cn, formatTimestamp, formatRelativeDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CollectionProgress, DocumentCollectionResponse } from '@/lib/types';

const progressLabels: Record<CollectionProgress, string> = {
  pending:     'Wachtend',
  started:     'Gestart',
  in_progress: 'Bezig',
};

interface CollectionTableProps {
  collections: DocumentCollectionResponse[];
  onSelectCollection?: (id: string) => void;
  selectedId?: string | null;
  isImporting?: boolean;
  onSync?: () => void;
}

export function CollectionTable({
  collections,
  onSelectCollection,
  selectedId,
  isImporting,
  onSync,
}: CollectionTableProps) {
  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">Nog geen document collecties actief.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          onClick={() => onSync?.()}
          disabled={isImporting}
        >
          <RefreshCw className="w-4 h-4" />
          Trigger demo ATS import
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kandidaat</TableHead>
          <TableHead>Vacature</TableHead>
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
                      <span className="text-xs text-gray-500">{collection.candidate_phone}</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                {collection.vacancy_title || '-'}
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
