'use client';

import Image from 'next/image';
import { Building2, MapPin } from 'lucide-react';
import { APIClient } from '@/lib/types';
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmpty,
  Column,
} from '@/components/kit/data-table';

export interface CustomersTableProps {
  customers: APIClient[];
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

export function CustomersTable({ customers }: CustomersTableProps) {
  const columns: Column<APIClient>[] = [
    {
      key: 'name',
      header: 'Klant',
      sortable: true,
      className: 'min-w-[240px]',
      accessor: (item) => item.name,
      render: (item) => (
        <div className="flex items-center gap-2.5 min-w-0">
          {item.logo ? (
            <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
              <Image
                src={item.logo}
                alt={item.name}
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center shrink-0">
              <Building2 className="w-3 h-3 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <span className="font-medium text-gray-900">{item.name}</span>
            {item.location && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin className="w-3 h-3" />
                {item.location}
              </div>
            )}
          </div>
        </div>
      ),
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
      key: 'synced',
      header: 'Synced',
      sortable: true,
      className: 'w-[140px]',
      accessor: (item) => item.updated_at || item.created_at || '',
      render: (item) => {
        const syncDate = item.updated_at || item.created_at;
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
      data={customers}
      columns={columns}
      defaultSortKey="updated_at"
      defaultSortDirection="desc"
    >
      <DataTableHeader />
      <DataTableBody
        emptyState={
          <DataTableEmpty
            icon={Building2}
            title="Geen klanten gevonden"
            description="Er zijn nog geen klanten die voldoen aan je zoekopdracht."
          />
        }
      />
    </DataTable>
  );
}
