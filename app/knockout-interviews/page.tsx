'use client';

import { Phone, CheckCircle2, Users, MapPin, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Vacancy } from '@/lib/types';
import { getVacancies } from '@/lib/interview-api';
import { MetricCard, ChannelCard } from '@/components/metrics';

function PendingSetup({ vacancies }: { vacancies: Vacancy[] }) {
  if (vacancies.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recently Added Vacancies
        </h2>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No new vacancies to set up.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Recently Added Vacancies
        </h2>
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {vacancies.length}
        </span>
      </div>
      
      <div className="divide-y divide-gray-100">
        {vacancies.map((vacancy) => (
          <div 
            key={vacancy.id} 
            className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Link 
                  href={`/interviews/generate/${vacancy.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-gray-700 truncate"
                >
                  {vacancy.title}
                </Link>
                {vacancy.source === 'salesforce' && (
                  <span className="shrink-0" title="Synced from Salesforce">
                    <Image 
                      src="/salesforc-logo-cloud.png" 
                      alt="Salesforce" 
                      width={16} 
                      height={11}
                      className="opacity-70"
                    />
                  </span>
                )}
                {vacancy.source === 'bullhorn' && (
                  <span className="shrink-0" title="Synced from Bullhorn">
                    <Image 
                      src="/bullhorn-icon-small.png" 
                      alt="Bullhorn" 
                      width={16} 
                      height={16}
                      className="opacity-70"
                    />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
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
            
            <Link
              href={`/interviews/generate/${vacancy.id}`}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Generate pre-screening
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KnockoutInterviewsPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vacancies on mount
  useEffect(() => {
    async function fetchVacancies() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getVacancies();
        setVacancies(data.vacancies);
      } catch (err) {
        console.error('Failed to fetch vacancies:', err);
        setError('Failed to load vacancies');
      } finally {
        setIsLoading(false);
      }
    }

    fetchVacancies();
  }, []);

  // Filter vacancies with status 'new'
  const pendingVacancies = useMemo(() => 
    vacancies.filter(v => v.status === 'new'), [vacancies]);

  // Placeholder metrics
  const weeklyMetrics = {
    total: 0,
    completionRate: 0,
    qualified: 0,
    qualificationRate: 0,
    voice: 0,
    whatsapp: 0,
    dailyData: Array(7).fill({ value: 0 }),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading vacancies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 text-blue-500 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Pre-screening
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your conversational pre-screening
        </p>
      </div>

      {/* Weekly Pre-screening Metrics - 4 cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Pre-screening"
          value={weeklyMetrics.total}
          label="This week"
          icon={Phone}
          variant="blue"
          sparklineData={weeklyMetrics.dailyData}
        />
        
        <MetricCard
          title="Completion Rate"
          value={`${weeklyMetrics.completionRate}%`}
          label="This week"
          icon={CheckCircle2}
          variant="dark"
          progress={weeklyMetrics.completionRate}
        />
        
        <MetricCard
          title="Qualified"
          value={weeklyMetrics.qualified}
          label={`${weeklyMetrics.qualificationRate}% of completed`}
          icon={Users}
          variant="lime"
          sparklineData={weeklyMetrics.dailyData}
        />

        <ChannelCard
          voice={weeklyMetrics.voice}
          whatsapp={weeklyMetrics.whatsapp}
        />
      </div>

      {/* Create Conversational Pre-screening */}
      <PendingSetup vacancies={pendingVacancies} />
    </div>
  );
}
