'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Archive, List } from 'lucide-react';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SearchInput } from '@/components/kit/search-input';
import {
  CandidatesTable,
  VacanciesTable,
  CustomersTable,
  CandidateDetailPane,
  VacancyDetailPane,
} from '@/components/blocks/views';
import {
  APICandidateListItem,
  APICandidateDetail,
  APIVacancyListItem,
  APIVacancyDetail,
} from '@/lib/types';
import { getCandidates, getCandidate, getVacanciesFromAPI, getVacancyDetail } from '@/lib/api';
import { mockClients } from './mock-data';

export type ViewsTab = 'vacancies' | 'candidates' | 'customers';

interface ViewsContentProps {
  activeTab: ViewsTab;
}

export function ViewsContent({ activeTab }: ViewsContentProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [subTab, setSubTab] = useState<'active' | 'archived'>('active');
  const [candidatesView, setCandidatesView] = useState<'list' | 'archived'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('candidates_view') as string;
      return stored === 'archived' ? 'archived' : 'list';
    }
    return 'list';
  });

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

  // Reset state on tab change
  useEffect(() => {
    setSearchQuery('');
    setSubTab('active');
    setSelectedCandidateId(null);
    setSelectedCandidateDetail(null);
    setSelectedVacancyId(null);
    setSelectedVacancyDetail(null);
  }, [activeTab]);

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
        setApiVacancies(response.items);
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

  // Archived status sets per entity type
  const archivedVacancyStatuses = new Set(['archived', 'closed', 'filled']);
  const archivedCandidateStatuses = new Set(['inactive', 'placed']);

  // Filter vacancies based on sub-tab and search query
  const filteredVacancies = useMemo(() => {
    let result = subTab === 'archived'
      ? apiVacancies.filter((v) => archivedVacancyStatuses.has(v.status))
      : apiVacancies;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.company.toLowerCase().includes(query) ||
          (v.location && v.location.toLowerCase().includes(query))
      );
    }
    return result;
  }, [searchQuery, apiVacancies, subTab]);

  // Filter candidates based on view and search query
  const filteredCandidates = useMemo(() => {
    let result = candidatesView === 'archived'
      ? apiCandidates.filter((c) => archivedCandidateStatuses.has(c.status))
      : apiCandidates;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.full_name.toLowerCase().includes(query) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.phone && c.phone.includes(query)) ||
          c.skills.some((s) => s.skill_name.toLowerCase().includes(query))
      );
    }
    return result;
  }, [searchQuery, apiCandidates, subTab]);

  // Filter customers — no archived status, so 'archived' sub-tab returns empty
  const filteredCustomers = useMemo(() => {
    if (subTab === 'archived') return [];
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
  }, [searchQuery, subTab]);

  // Counts for sub-tab badges
  const allCounts: Record<string, number> = {
    vacancies: apiVacancies.length,
    candidates: apiCandidates.length,
    customers: mockClients.length,
  };
  const archivedCounts: Record<string, number> = {
    vacancies: apiVacancies.filter(v => archivedVacancyStatuses.has(v.status)).length,
    candidates: apiCandidates.filter(c => archivedCandidateStatuses.has(c.status)).length,
    customers: 0,
  };
  const isLoading = activeTab === 'vacancies' ? vacanciesLoading : activeTab === 'candidates' ? candidatesLoading : false;

  return (
    <>
      <PageLayout>
        <PageLayoutHeader />
        <PageLayoutContent>
          {/* Tab bar — candidates gets Pipeline/Lijst/Gearchiveerd; others get Alle/Gearchiveerd */}
          <div className="flex items-center justify-between gap-4 mb-4">
            {activeTab === 'candidates' ? (
              <Tabs
                value={candidatesView}
                onValueChange={(v) => {
                  const view = v as 'list' | 'archived';
                  setCandidatesView(view);
                  localStorage.setItem('candidates_view', view);
                }}
              >
                <TabsList variant="line">
                  <TabsTrigger value="list">
                    <List className="w-3.5 h-3.5" />
                    Lijst
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                      {candidatesLoading ? '...' : apiCandidates.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="archived">
                    <Archive className="w-3.5 h-3.5" />
                    Gearchiveerd
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                      {candidatesLoading ? '...' : archivedCounts.candidates}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            ) : (
              <Tabs value={subTab} onValueChange={(v) => setSubTab(v as 'active' | 'archived')}>
                <TabsList variant="line">
                  <TabsTrigger value="active">
                    <List className="w-3.5 h-3.5" />
                    Alle
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                      {isLoading ? '...' : allCounts[activeTab] ?? 0}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="archived">
                    <Archive className="w-3.5 h-3.5" />
                    Gearchiveerd
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                      {isLoading ? '...' : archivedCounts[activeTab] ?? 0}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Zoeken..."
              className="w-64"
            />
          </div>

          {/* Tab content */}
          {activeTab === 'vacancies' && (
            <>
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
            </>
          )}

          {activeTab === 'candidates' && (
            <>
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
            </>
          )}

          {activeTab === 'customers' && (
            <CustomersTable customers={filteredCustomers} />
          )}
        </PageLayoutContent>
      </PageLayout>

      {/* Candidate Detail Sheet */}
      <Sheet open={!!selectedCandidateId} onOpenChange={(open) => !open && handleCloseCandidateDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0" showCloseButton={false}>
          <CandidateDetailPane
            candidate={selectedCandidateDetail}
            isLoading={candidateDetailLoading}
            onClose={handleCloseCandidateDetail}
            vacancies={apiVacancies}
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
