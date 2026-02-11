'use client';

import Image from 'next/image';
import { Users, ExternalLink, FlaskConical } from 'lucide-react';
import { APICandidateListItem } from '@/lib/types';
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmpty,
  Column,
} from '@/components/kit/data-table';

export interface CandidatesTableProps {
  candidates: APICandidateListItem[];
  selectedId?: string | null;
  onRowClick?: (candidate: APICandidateListItem) => void;
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

export function CandidatesTable({ candidates, selectedId, onRowClick }: CandidatesTableProps) {
  const columns: Column<APICandidateListItem>[] = [
    {
      key: 'name',
      header: 'Kandidaat',
      sortable: true,
      className: 'min-w-[200px]',
      accessor: (item) => item.full_name,
      render: (item) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{item.full_name}</span>
            {item.is_test && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                <FlaskConical className="w-3 h-3" />
                Test
              </span>
            )}
          </div>
          {item.phone && <div className="text-xs text-gray-400 mt-0.5">{item.phone}</div>}
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Bron',
      sortable: false,
      className: 'w-[140px]',
      accessor: () => 'salesforce',
      render: () => (
        <button
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          title="Brongegevens bekijken"
        >
          <Image
            src="/salesforc-logo-cloud.png"
            alt="Salesforce"
            width={16}
            height={11}
            className="opacity-70"
          />
          <span className="text-sm">Salesforce</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      ),
    },
    {
      key: 'synced',
      header: 'Synced',
      sortable: true,
      className: 'w-[140px]',
      accessor: (item) => item.last_activity || item.created_at || '',
      render: (item) => {
        const syncDate = item.last_activity || item.created_at;
        if (!syncDate) {
          return <span className="text-gray-500 text-sm">-</span>;
        }
        return (
          <span className="text-gray-500 text-sm">
            {formatRelativeDate(syncDate)}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      data={candidates}
      columns={columns}
      defaultSortKey="last_activity"
      defaultSortDirection="desc"
      selectedId={selectedId}
      onRowClick={onRowClick}
    >
      <DataTableHeader />
      <DataTableBody
        rowClassName={(item: APICandidateListItem) =>
          item.is_test ? 'bg-amber-50/50 hover:bg-amber-100/50' : ''
        }
        emptyState={
          <DataTableEmpty
            icon={Users}
            title="Geen kandidaten gevonden"
            description="Er zijn nog geen kandidaten die voldoen aan je zoekopdracht."
          />
        }
      />
    </DataTable>
  );
}
