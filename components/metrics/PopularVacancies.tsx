'use client';

import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface VacancyItem {
  vacancyId: string;
  title: string;
  count: number;
}

interface PopularVacanciesProps {
  vacancies: VacancyItem[];
  className?: string;
}

export function PopularVacancies({ vacancies, className }: PopularVacanciesProps) {
  const maxCount = Math.max(...vacancies.map(v => v.count), 1);

  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl p-5', className)}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">Most Active Vacancies</h3>
      </div>
      
      <div className="space-y-3">
        {vacancies.map((vacancy, index) => (
          <div key={vacancy.vacancyId} className="group">
            <div className="flex items-center justify-between mb-1">
              <Link 
                href={`/interviews/generate/${vacancy.vacancyId}`}
                className="text-sm text-gray-700 group-hover:text-gray-900 truncate flex-1 pr-2"
              >
                <span className="text-gray-400 mr-2">{index + 1}.</span>
                {vacancy.title}
              </Link>
              <span className="text-sm font-semibold text-gray-900">{vacancy.count}</span>
            </div>
            <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all"
                style={{ width: `${(vacancy.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
