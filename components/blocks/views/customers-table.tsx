'use client';

import Image from 'next/image';
import { Building2, MapPin } from 'lucide-react';
import { APIClient } from '@/lib/types';
import { formatRelativeDate } from '@/lib/utils';
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmpty,
  Column,
} from '@/components/kit/data-table';
import { useTranslations, useLocale } from '@/lib/i18n';

export interface CustomersTableProps {
  customers: APIClient[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const t = useTranslations('customers');
  const { locale } = useLocale();
  const columns: Column<APIClient>[] = [
    {
      key: 'name',
      header: t('title'),
      sortable: true,
      className: 'min-w-[240px] pl-0',
      accessor: (item) => item.name,
      render: (item) => (
        <div className="flex items-center gap-2.5 min-w-0">
          {item.logo ? (
            <div className="w-5 h-5 rounded bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              <Image
                src={item.logo}
                alt={item.name}
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-5 h-5 rounded bg-gray-50 flex items-center justify-center shrink-0">
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
      key: 'synced',
      header: t('synced'),
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
            {formatRelativeDate(syncDate, locale)}
          </span>
        );
      },
    },
  ];

  if (customers.length === 0) {
    return (
      <DataTableEmpty
        icon={Building2}
        title={t('noCustomers')}
        description={t('noCustomersDesc')}
      />
    );
  }

  return (
    <DataTable
      data={customers}
      columns={columns}
      defaultSortKey="updated_at"
      defaultSortDirection="desc"
    >
      <DataTableHeader />
      <DataTableBody />
    </DataTable>
  );
}
