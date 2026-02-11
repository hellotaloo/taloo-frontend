'use client';

import Image from 'next/image';
import { Briefcase, Building2, MapPin, ExternalLink } from 'lucide-react';
import { APIVacancyListItem, VacancyStatus } from '@/lib/types';
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmpty,
  Column,
} from '@/components/kit/data-table';
import { AgentIcons } from '@/components/kit/status';
import { cn } from '@/lib/utils';

// Avatar color palette based on name hash
const avatarColors = [
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-pink-100', text: 'text-pink-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
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

// Status display labels (Dutch) - supports both legacy and new API status values
const statusLabels: Partial<Record<VacancyStatus, string>> = {
  // New API statuses
  concept: 'Concept',
  open: 'Open',
  on_hold: 'On hold',
  filled: 'Ingevuld',
  closed: 'Gesloten',
  // Legacy statuses (mapped to display labels)
  new: 'Concept',
  draft: 'Concept',
  in_progress: 'Open',
  agent_created: 'Open',
  screening_active: 'Open',
  archived: 'Gesloten',
};

// Status badge styling - supports both legacy and new API status values
const statusStyles: Partial<Record<VacancyStatus, { bg: string; text: string; dot: string }>> = {
  // New API statuses
  concept: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  open: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  on_hold: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  filled: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  // Legacy statuses (mapped to appropriate styles)
  new: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  in_progress: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  agent_created: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  screening_active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  archived: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const defaultStyle = { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };

function VacancyStatusBadge({ status }: { status: VacancyStatus }) {
  const styles = statusStyles[status] || defaultStyle;
  const label = statusLabels[status] || status;

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

export function VacanciesTable({ vacancies, selectedId, onRowClick }: VacanciesTableProps) {
  const columns: Column<APIVacancyListItem>[] = [
    {
      key: 'title',
      header: 'Vacature',
      sortable: true,
      className: 'min-w-[280px]',
      accessor: (item) => item.title,
      render: (item) => (
        <div className="min-w-0">
          <span className="font-medium text-gray-900 truncate block">{item.title}</span>
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
      key: 'agents',
      header: 'Agents',
      sortable: false,
      className: 'w-[240px]',
      accessor: () => '',
      render: (item) => <AgentIcons agents={item.agents} vacancyId={item.id} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'w-[100px]',
      accessor: (item) => item.status,
      render: (item) => <VacancyStatusBadge status={item.status} />,
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
      className: 'w-[100px]',
      accessor: (item) => item.last_activity_at || item.created_at || '',
      render: (item) => {
        const syncDate = item.last_activity_at || item.created_at;
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
                <span className="text-sm text-gray-500 truncate block">{item.recruiter.team}</span>
              )}
            </div>
          </div>
        );
      },
    },
  ];

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
      <DataTableBody
        emptyState={
          <DataTableEmpty
            icon={Briefcase}
            title="Geen vacatures gevonden"
            description="Er zijn nog geen vacatures die voldoen aan je zoekopdracht."
          />
        }
      />
    </DataTable>
  );
}
