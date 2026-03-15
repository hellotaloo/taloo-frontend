'use client';

import Image from 'next/image';
import { Users } from 'lucide-react';
import { APICandidateListItem } from '@/lib/types';
import { formatPhoneNumber } from '@/lib/utils';
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
      className: 'min-w-[200px] pl-0',
      accessor: (item) => item.full_name,
      render: (item) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{item.full_name}</span>
            {item.is_test && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                Test
              </span>
            )}
          </div>
          {item.phone && <div className="text-xs text-gray-400 mt-0.5">{formatPhoneNumber(item.phone)}</div>}
        </div>
      ),
    },
    {
      key: 'vacancies',
      header: 'Vacatures',
      sortable: false,
      className: 'min-w-[200px]',
      accessor: () => '',
      render: (item) => {
        const vacancies = item.vacancies ?? [];
        if (vacancies.length === 0) {
          return <span className="text-xs text-gray-400">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {vacancies.map((v) => (
              <span
                key={v.id}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600 truncate max-w-[160px]"
                title={v.title}
              >
                {v.title}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'source',
      header: 'Bron',
      sortable: false,
      className: 'w-[60px] text-center',
      accessor: () => 'salesforce',
      render: () => (
        <span className="inline-flex items-center justify-center">
          <Image
            src="/salesforc-logo-cloud.png"
            alt="Salesforce"
            width={16}
            height={11}
          />
        </span>
      ),
    },
    {
      key: 'last_activity',
      header: 'Laatste activiteit',
      sortable: true,
      className: 'w-[160px]',
      accessor: (item) => item.last_activity || item.created_at || '',
      render: (item) => {
        const activityDate = item.last_activity;
        const fallbackDate = item.created_at;
        if (!activityDate && !fallbackDate) {
          return <span className="text-gray-500 text-sm">-</span>;
        }
        return (
          <span className="text-gray-500 text-sm">
            {formatRelativeDate(activityDate || fallbackDate)}
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
