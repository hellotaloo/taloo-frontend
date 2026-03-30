'use client';

import Image from 'next/image';
import { Briefcase, Building2, MapPin, Landmark } from 'lucide-react';
import { APIVacancyListItem, VacancyStatus } from '@/lib/types';
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmpty,
  Column,
} from '@/components/kit/data-table';
import { AgentIcons } from '@/components/kit/status';
import { cn, formatRelativeDate } from '@/lib/utils';
import { useTranslations, useLocale } from '@/lib/i18n';

// Avatar color palette based on name hash
const avatarColors = [
  { bg: 'bg-blue-500', text: 'text-white' },
  { bg: 'bg-purple-500', text: 'text-white' },
  { bg: 'bg-pink-500', text: 'text-white' },
  { bg: 'bg-orange-500', text: 'text-white' },
  { bg: 'bg-emerald-500', text: 'text-white' },
  { bg: 'bg-cyan-500', text: 'text-white' },
  { bg: 'bg-rose-500', text: 'text-white' },
  { bg: 'bg-indigo-500', text: 'text-white' },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export interface VacanciesTableProps {
  vacancies: APIVacancyListItem[];
  selectedId?: string | null;
  onRowClick?: (vacancy: APIVacancyListItem) => void;
}

// Maps API status values to translation keys in vacancies.*
const statusTranslationKeys: Partial<Record<VacancyStatus, string>> = {
  concept: 'statusConcept',
  open: 'statusOpen',
  on_hold: 'statusOnHold',
  filled: 'statusFilled',
  new: 'statusConcept',
  draft: 'statusConcept',
  in_progress: 'statusOpen',
  agent_created: 'statusOpen',
  screening_active: 'statusOpen',
  archived: 'statusArchived',
};

// Status badge styling - supports both legacy and new API status values
const statusStyles: Partial<Record<VacancyStatus, { bg: string; text: string; dot: string }>> = {
  // New API statuses
  concept: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' },
  open: { bg: 'bg-white border border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
  on_hold: { bg: 'bg-white border border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  filled: { bg: 'bg-white border border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  // Legacy statuses (mapped to appropriate styles)
  new: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' },
  draft: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' },
  in_progress: { bg: 'bg-white border border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
  agent_created: { bg: 'bg-white border border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
  screening_active: { bg: 'bg-white border border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
  archived: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const defaultStyle = { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' };

function VacancyStatusBadge({ status, t }: { status: VacancyStatus; t: (key: string) => string }) {
  const styles = statusStyles[status] || defaultStyle;
  const key = statusTranslationKeys[status];
  const label = key ? t(key) : status;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
      styles.bg,
      styles.text
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
      {label}
    </span>
  );
}

export function VacanciesTable({ vacancies, selectedId, onRowClick }: VacanciesTableProps) {
  const t = useTranslations('vacancies');
  const { locale } = useLocale();
  const columns: Column<APIVacancyListItem>[] = [
    {
      key: 'title',
      header: t('title'),
      sortable: true,
      className: 'min-w-[280px] pl-0',
      accessor: (item) => item.title,
      render: (item) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{item.title}</span>
            <VacancyStatusBadge status={item.status} t={t} />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {item.company}
            </span>
            {item.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {item.location}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'kandidaten',
      header: t('candidates'),
      sortable: true,
      className: 'w-[110px]',
      accessor: (item) => item.candidates_count ?? 0,
      render: (item) => {
        const count = item.candidates_count ?? 0;
        return (
          <span className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
            count > 0 ? 'bg-brand-dark-blue text-white' : 'bg-gray-100 text-gray-400'
          )}>
            {count}
          </span>
        );
      },
    },
    {
      key: 'agents',
      header: t('agents'),
      sortable: false,
      className: 'w-[240px]',
      accessor: () => '',
      render: (item) => <AgentIcons agents={item.agents} vacancyId={item.id} />,
    },
    {
      key: 'office',
      header: t('office'),
      sortable: true,
      className: 'w-[160px]',
      accessor: (item) => item.office?.name || '',
      render: (item) => {
        if (!item.office) {
          return <span className="text-gray-400 text-sm">-</span>;
        }
        return (
          <div className="flex items-center gap-1.5 min-w-0">
            <Landmark className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-700 truncate">{item.office.name}</span>
          </div>
        );
      },
    },
    {
      key: 'recruiter',
      header: 'Recruiter',
      sortable: true,
      className: 'w-[180px]',
      accessor: (item) => item.recruiter?.name || '',
      render: (item) => {
        if (!item.recruiter) {
          return <span className="text-gray-500 text-sm">-</span>;
        }
        const color = getAvatarColor(item.recruiter.name);
        return (
          <div className="flex items-center gap-2 min-w-0">
            {item.recruiter.avatar_url ? (
              <img
                src={item.recruiter.avatar_url}
                alt={item.recruiter.name}
                className="w-6 h-6 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-medium',
                color.bg,
                color.text
              )}>
                {getInitials(item.recruiter.name)}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-sm text-gray-500 truncate block">{item.recruiter.name}</span>
              {item.recruiter.team && (
                <span className="text-xs text-gray-400 truncate block">{item.recruiter.team}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'synced',
      header: t('synced'),
      sortable: true,
      className: 'w-[140px]',
      accessor: (item) => item.last_activity_at || item.created_at || '',
      render: (item) => {
        const syncDate = item.last_activity_at || item.created_at;
        if (!syncDate) {
          return <span className="text-gray-400 text-sm">-</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            <Image
              src="/vendors/salesforce-logo-cloud.png"
              alt="Salesforce"
              width={14}
              height={10}
              className="shrink-0"
            />
            <span className="text-gray-500 text-sm">
              {formatRelativeDate(syncDate, locale)}
            </span>
          </div>
        );
      },
    },
  ];

  if (vacancies.length === 0) {
    return (
      <DataTableEmpty
        icon={Briefcase}
        title={t('noVacancies')}
        description={t('noVacanciesDesc')}
      />
    );
  }

  return (
    <DataTable
      data={vacancies}
      columns={columns}
      defaultSortKey="status"
      defaultSortDirection="asc"
      selectedId={selectedId}
      onRowClick={onRowClick}
    >
      <DataTableHeader />
      <DataTableBody />
    </DataTable>
  );
}
