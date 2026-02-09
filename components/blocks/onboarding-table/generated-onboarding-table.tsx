'use client';

import { Building2, FileCheck } from 'lucide-react';
import { Vacancy } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface GeneratedOnboardingTableProps {
  vacancies: Vacancy[];
}

export function GeneratedOnboardingTable({ vacancies }: GeneratedOnboardingTableProps) {
  if (vacancies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <FileCheck className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">
          Nog geen pre-onboarding ingesteld.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vacature</TableHead>
          <TableHead>Documenten</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Verzameld</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vacancies.map((vacancy) => (
          <TableRow key={vacancy.id} className="cursor-pointer hover:bg-gray-50">
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
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-500">
                📄 🚗 🏥 💳
              </span>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
                Actief
              </span>
            </TableCell>
            <TableCell className="text-sm text-gray-600">
              {Math.floor(Math.random() * 10)}/10
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
