'use client';

import { FileCheck, CheckCircle2, Loader2, Plus, FileText, Archive, Users, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Vacancy } from '@/lib/types';
import { getPreOnboardingVacancies } from '@/lib/interview-api';
import { getOnboardingStats } from '@/lib/pre-onboarding-api';
import { MetricCard } from '@/components/kit/metric-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PendingOnboardingTable,
  GeneratedOnboardingTable,
  ArchivedOnboardingTable,
} from '@/components/blocks/onboarding-table';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PreOnboardingPage() {
  const [newVacancies, setNewVacancies] = useState<Vacancy[]>([]);
  const [generatedVacancies, setGeneratedVacancies] = useState<Vacancy[]>([]);
  const [archivedVacancies, setArchivedVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    completionRate: 0,
    fullyCollected: 0,
    verificationPending: 0
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [newData, generatedData, archivedData, statsData] = await Promise.all([
          getPreOnboardingVacancies('new'),
          getPreOnboardingVacancies('generated'),
          getPreOnboardingVacancies('archived'),
          getOnboardingStats()
        ]);

        setNewVacancies(newData.vacancies);
        setGeneratedVacancies(generatedData.vacancies);
        setArchivedVacancies(archivedData.vacancies);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Pre-onboarding laden...</span>
      </div>
    );
  }

  return (
    <PageLayout>
      <PageLayoutHeader
        title="Pre-onboarding"
        description="Verzamel documenten voor nieuwe medewerkers"
        action={
          <Link href="/pre-onboarding/settings">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Instellingen
            </Button>
          </Link>
        }
      />
      <PageLayoutContent>
        {/* Metrics - 4 cards in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Totaal verzoeken"
            value={stats.totalRequests}
            label="Deze week"
            icon={FileCheck}
            variant="blue"
          />
          <MetricCard
            title="Afrondingspercentage"
            value={`${stats.completionRate}%`}
            label="Deze week"
            icon={CheckCircle2}
            variant="dark"
            progress={stats.completionRate}
          />
          <MetricCard
            title="Volledig verzameld"
            value={stats.fullyCollected}
            label="Deze week"
            icon={Users}
            variant="lime"
          />
          <MetricCard
            title="Verificatie pending"
            value={stats.verificationPending}
            label="Wacht op verificatie"
            icon={FileText}
            variant="pink"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="new" className="space-y-2">
          <TabsList variant="line">
            <TabsTrigger value="new">
              <Plus className="w-3.5 h-3.5" />
              Nieuw
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {newVacancies.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="generated">
              <FileText className="w-3.5 h-3.5" />
              Gegenereerd
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {generatedVacancies.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="archived">
              <Archive className="w-3.5 h-3.5" />
              Gearchiveerd
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {archivedVacancies.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <PendingOnboardingTable vacancies={newVacancies} />
          </TabsContent>

          <TabsContent value="generated">
            <GeneratedOnboardingTable vacancies={generatedVacancies} />
          </TabsContent>

          <TabsContent value="archived">
            <ArchivedOnboardingTable vacancies={archivedVacancies} />
          </TabsContent>
        </Tabs>
      </PageLayoutContent>
    </PageLayout>
  );
}
