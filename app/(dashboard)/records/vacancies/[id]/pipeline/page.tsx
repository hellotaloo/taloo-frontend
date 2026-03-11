'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { VacancyKanban } from '@/components/blocks/vacancy-kanban';

interface PipelinePageProps {
  params: Promise<{ id: string }>;
}

export default function PipelinePage({ params }: PipelinePageProps) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="flex flex-col h-full overflow-hidden px-6 py-5">
      {/* Back nav */}
      <button
        onClick={() => router.push('/records/vacancies')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-5 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Vacatures
      </button>

      <VacancyKanban vacancyId={id} />
    </div>
  );
}
