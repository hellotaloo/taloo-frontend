'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';

export default function PreOnboardingSettingsPage() {
  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center gap-3">
          <Link
            href="/pre-onboarding"
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Pre-onboarding instellingen</h1>
        </div>
      </PageLayoutHeader>
      <PageLayoutContent>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Coming soon...</p>
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
