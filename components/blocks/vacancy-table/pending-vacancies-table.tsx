'use client';

import { Building2, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Vacancy } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface PendingVacanciesTableProps {
  vacancies: Vacancy[];
}

export function PendingVacanciesTable({ vacancies }: PendingVacanciesTableProps) {
  if (vacancies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <ArrowRight className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">Alle vacatures zijn ingesteld.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-full">Vacature</TableHead>
          <TableHead className="text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vacancies.map((vacancy) => (
          <TableRow key={vacancy.id} data-testid={`pending-vacancy-row-${vacancy.id}`}>
            <TableCell>
              <div className="min-w-0">
                <span className="font-medium text-gray-900 truncate block">
                  {vacancy.title}
                </span>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {vacancy.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {vacancy.location}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/pre-screening/edit/${vacancy.id}`}
                data-testid={`generate-prescreening-btn-${vacancy.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Pre-screening genereren
                <ArrowRight className="w-3 h-3" />
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
