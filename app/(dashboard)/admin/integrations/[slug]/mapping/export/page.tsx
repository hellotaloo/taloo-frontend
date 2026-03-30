'use client';

import { ArrowUpFromLine } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

export default function MappingExportPage() {
  const t = useTranslations('integrations');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page description */}
      <div style={{ animation: 'fade-in-up 0.3s ease-out backwards' }}>
        <h2 className="text-base font-semibold text-gray-900">{t('exportTitle')}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {t('exportDesc')}
        </p>
      </div>

      {/* Placeholder */}
      <div
        className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 flex flex-col items-center justify-center text-center"
        style={{ animation: 'fade-in-up 0.3s ease-out 50ms backwards' }}
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <ArrowUpFromLine className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="font-medium text-gray-900">{t('comingSoon')}</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-md">
          {t('exportPlaceholder')}
        </p>
      </div>
    </div>
  );
}
