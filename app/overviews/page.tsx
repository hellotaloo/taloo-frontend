'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Users, Briefcase, Building2 } from 'lucide-react';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SearchInput } from '@/components/kit/search-input';
import {
  CandidatesTable,
  VacanciesTable,
  CustomersTable,
  CandidateDetailPane,
  VacancyDetailPane,
} from '@/components/blocks/overviews';
import {
  APICandidateListItem,
  APICandidateDetail,
  APIVacancyListItem,
  APIVacancyDetail,
} from '@/lib/types';
import { getCandidates, getCandidate, getVacanciesFromAPI, getVacancyDetail } from '@/lib/api';
import { mockClients } from './mock-data';

function OverviewsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get('tab') || 'vacancies';
  const [searchQuery, setSearchQuery] = useState('');

  // API candidates state
  const [apiCandidates, setApiCandidates] = useState<APICandidateListItem[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);

  // Selected candidate detail state
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<APICandidateDetail | null>(null);
  const [candidateDetailLoading, setCandidateDetailLoading] = useState(false);

  // API vacancies state
  const [apiVacancies, setApiVacancies] = useState<APIVacancyListItem[]>([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(true);
  const [vacanciesError, setVacanciesError] = useState<string | null>(null);

  // Selected vacancy detail state
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null);
  const [selectedVacancyDetail, setSelectedVacancyDetail] = useState<APIVacancyDetail | null>(null);
  const [vacancyDetailLoading, setVacancyDetailLoading] = useState(false);

  // Fetch candidates from API
  useEffect(() => {
    async function fetchCandidates() {
      setCandidatesLoading(true);
      setCandidatesError(null);
      try {
        const response = await getCandidates({ limit: 100 });
        setApiCandidates(response.items);
      } catch (error) {
        console.error('Failed to fetch candidates:', error);
        setCandidatesError('Kon kandidaten niet laden');
      } finally {
        setCandidatesLoading(false);
      }
    }

    fetchCandidates();
  }, []);

  // Fetch vacancies from API
  useEffect(() => {
    async function fetchVacancies() {
      setVacanciesLoading(true);
      setVacanciesError(null);
      try {
        const response = await getVacanciesFromAPI({ limit: 100 });
        setApiVacancies(response.vacancies);
      } catch (error) {
        console.error('Failed to fetch vacancies:', error);
        setVacanciesError('Kon vacatures niet laden');
      } finally {
        setVacanciesLoading(false);
      }
    }

    fetchVacancies();
  }, []);

  // Fetch candidate detail when selected
  useEffect(() => {
    async function fetchCandidateDetail() {
      if (!selectedCandidateId) {
        setSelectedCandidateDetail(null);
        return;
      }

      setCandidateDetailLoading(true);
      try {
        const detail = await getCandidate(selectedCandidateId);
        setSelectedCandidateDetail(detail);
      } catch (error) {
        console.error('Failed to fetch candidate detail:', error);
        setSelectedCandidateDetail(null);
      } finally {
        setCandidateDetailLoading(false);
      }
    }

    fetchCandidateDetail();
  }, [selectedCandidateId]);

  // Fetch vacancy detail when selected
  useEffect(() => {
    async function fetchVacancyDetail() {
      if (!selectedVacancyId) {
        setSelectedVacancyDetail(null);
        return;
      }

      setVacancyDetailLoading(true);
      try {
        const detail = await getVacancyDetail(selectedVacancyId);
        setSelectedVacancyDetail(detail);
      } catch (error) {
        console.error('Failed to fetch vacancy detail:', error);
        setSelectedVacancyDetail(null);
      } finally {
        setVacancyDetailLoading(false);
      }
    }

    fetchVacancyDetail();
  }, [selectedVacancyId]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`/overviews?${params.toString()}`, { scroll: false });
    setSearchQuery(''); // Reset search on tab change
    setSelectedCandidateId(null); // Close detail pane on tab change
    setSelectedCandidateDetail(null);
    setSelectedVacancyId(null); // Close vacancy detail pane on tab change
    setSelectedVacancyDetail(null);
  };

  const handleCandidateClick = (candidate: APICandidateListItem) => {
    setSelectedCandidateId(candidate.id);
  };

  const handleCloseCandidateDetail = () => {
    setSelectedCandidateId(null);
    setSelectedCandidateDetail(null);
  };

  const handleVacancyClick = (vacancy: APIVacancyListItem) => {
    setSelectedVacancyId(vacancy.id);
  };

  const handleCloseVacancyDetail = () => {
    setSelectedVacancyId(null);
    setSelectedVacancyDetail(null);
  };

  // Filter API candidates based on search query (inline search)
  const filteredCandidates = useMemo(() => {
    if (!searchQuery) return apiCandidates;
    const query = searchQuery.toLowerCase();
    return apiCandidates.filter(
      (c) =>
        c.full_name.toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query)) ||
        c.skills.some((s) => s.skill_name.toLowerCase().includes(query))
    );
  }, [searchQuery, apiCandidates]);

  // Filter API vacancies based on search query (inline search)
  const filteredVacancies = useMemo(() => {
    if (!searchQuery) return apiVacancies;
    const query = searchQuery.toLowerCase();
    return apiVacancies.filter(
      (v) =>
        v.title.toLowerCase().includes(query) ||
        v.company.toLowerCase().includes(query) ||
        (v.location && v.location.toLowerCase().includes(query))
    );
  }, [searchQuery, apiVacancies]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return mockClients;
    const query = searchQuery.toLowerCase();
    return mockClients.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.contact_name && c.contact_name.toLowerCase().includes(query)) ||
        (c.contact_email && c.contact_email.toLowerCase().includes(query)) ||
        (c.industry && c.industry.toLowerCase().includes(query)) ||
        (c.location && c.location.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  return (
    <>
      <PageLayout>
        <PageLayoutHeader
          title="Overzichten"
          description="Bekijk al je kandidaten, vacatures en klanten"
        />
        <PageLayoutContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <TabsList variant="line">
                <TabsTrigger value="vacancies" data-testid="tab-vacancies">
                  <Briefcase className="w-3.5 h-3.5" />
                  Vacatures
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                    {vacanciesLoading ? '...' : apiVacancies.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="candidates" data-testid="tab-candidates">
                  <Users className="w-3.5 h-3.5" />
                  Kandidaten
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                    {candidatesLoading ? '...' : apiCandidates.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="customers" data-testid="tab-customers">
                  <Building2 className="w-3.5 h-3.5" />
                  Klanten
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                    {mockClients.length}
                  </span>
                </TabsTrigger>
              </TabsList>

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Zoeken..."
                className="w-64"
              />
            </div>

            <TabsContent value="vacancies">
              {vacanciesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : vacanciesError ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  {vacanciesError}
                </div>
              ) : (
                <VacanciesTable
                  vacancies={filteredVacancies}
                  selectedId={selectedVacancyId}
                  onRowClick={handleVacancyClick}
                />
              )}
            </TabsContent>

            <TabsContent value="candidates">
              {candidatesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : candidatesError ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  {candidatesError}
                </div>
              ) : (
                <CandidatesTable
                  candidates={filteredCandidates}
                  selectedId={selectedCandidateId}
                  onRowClick={handleCandidateClick}
                />
              )}
            </TabsContent>

            <TabsContent value="customers">
              <CustomersTable customers={filteredCustomers} />
            </TabsContent>
          </Tabs>
        </PageLayoutContent>
      </PageLayout>

      {/* Candidate Detail Sheet */}
      <Sheet open={!!selectedCandidateId} onOpenChange={(open) => !open && handleCloseCandidateDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0" showCloseButton={false}>
          <CandidateDetailPane
            candidate={selectedCandidateDetail}
            isLoading={candidateDetailLoading}
            onClose={handleCloseCandidateDetail}
          />
        </SheetContent>
      </Sheet>

      {/* Vacancy Detail Sheet */}
      <Sheet open={!!selectedVacancyId} onOpenChange={(open) => !open && handleCloseVacancyDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0" showCloseButton={false}>
          <VacancyDetailPane
            vacancy={selectedVacancyDetail}
            isLoading={vacancyDetailLoading}
            onClose={handleCloseVacancyDetail}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function OverviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <OverviewsContent />
    </Suspense>
  );
}
