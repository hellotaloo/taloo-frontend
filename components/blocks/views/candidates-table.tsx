'use client';

import Image from 'next/image';
import { Users } from 'lucide-react';
import { APICandidateListItem } from '@/lib/types';
import { formatPhoneNumber, formatRelativeDate } from '@/lib/utils';
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmpty,
  Column,
} from '@/components/kit/data-table';
import { useTranslations, useLocale } from '@/lib/i18n';

export interface CandidatesTableProps {
  candidates: APICandidateListItem[];
  selectedId?: string | null;
  onRowClick?: (candidate: APICandidateListItem) => void;
}

export function CandidatesTable({ candidates, selectedId, onRowClick }: CandidatesTableProps) {
  const t = useTranslations('candidates');
  const { locale } = useLocale();
  const columns: Column<APICandidateListItem>[] = [
    {
      key: 'name',
      header: t('title'),
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
      header: t('vacancies'),
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
      header: t('source'),
      sortable: false,
      className: 'w-[60px] text-center',
      accessor: () => 'salesforce',
      render: () => (
        <span className="inline-flex items-center justify-center">
          <Image
            src="/vendors/salesforce-logo-cloud.png"
            alt="Salesforce"
            width={16}
            height={11}
          />
        </span>
      ),
    },
    {
      key: 'last_activity',
      header: t('lastActivity'),
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
            {formatRelativeDate(activityDate || fallbackDate, locale)}
          </span>
        );
      },
    },
  ];

  if (candidates.length === 0) {
    return (
      <DataTableEmpty
        icon={Users}
        title={t('noCandidates')}
        description={t('noCandidatesDesc')}
      />
    );
  }

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
      <DataTableBody />
    </DataTable>
  );
}
