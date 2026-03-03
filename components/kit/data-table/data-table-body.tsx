'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { TableBody, TableRow, TableCell } from '@/components/ui/table';
import { useDataTable } from './data-table';

export interface DataTableBodyProps {
  className?: string;
  rowClassName?: string | ((item: any, index: number) => string);
  emptyState?: React.ReactNode;
}

export function DataTableBody({
  className,
  rowClassName,
  emptyState,
}: DataTableBodyProps = {}) {
  const { data, columns, selectedId, onRowClick, keyExtractor } = useDataTable();

  if (data.length === 0 && emptyState) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={columns.length} className="h-24 text-center">
            {emptyState}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody className={className}>
      {data.map((item, index) => {
        const key = keyExtractor(item, index);
        const isSelected = selectedId === key;
        const resolvedRowClassName =
          typeof rowClassName === 'function' ? rowClassName(item, index) : rowClassName;

        return (
          <TableRow
            key={key}
            onClick={() => onRowClick?.(item, index)}
            className={cn(
              onRowClick && 'cursor-pointer hover:bg-gray-50 transition-colors',
              isSelected && 'bg-blue-50 hover:bg-blue-50',
              resolvedRowClassName
            )}
          >
            {columns.map((column) => (
              <TableCell key={column.key} className={column.className}>
                {column.render
                  ? column.render(item, index)
                  : column.accessor
                  ? String(column.accessor(item) ?? '')
                  : String((item as any)[column.key] ?? '')}
              </TableCell>
            ))}
          </TableRow>
        );
      })}
    </TableBody>
  );
}
