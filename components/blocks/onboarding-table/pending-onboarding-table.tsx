'use client';

import { Building2, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Vacancy } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PendingOnboardingTableProps {
  vacancies: Vacancy[];
}

export function PendingOnboardingTable({ vacancies }: PendingOnboardingTableProps) {
  const router = useRouter();

  if (vacancies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-gray-400" />
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
          <TableRow key={vacancy.id}>
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
              <button
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                onClick={() => router.push(`/pre-onboarding/edit/${vacancy.id}`)}
              >
                Pre-onboarding genereren
                <ArrowRight className="w-3 h-3" />
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
