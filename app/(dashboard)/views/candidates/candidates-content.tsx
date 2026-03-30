'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Archive, List } from 'lucide-react';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SearchInput } from '@/components/kit/search-input';
import { CandidatesTable, CandidateDetailPane } from '@/components/blocks/views';
import { APICandidateListItem, APICandidateDetail } from '@/lib/types';
import { getCandidates, getCandidate } from '@/lib/api';
import { useRealtimeTable } from '@/hooks/use-realtime-table';
import { useTranslations } from '@/lib/i18n';

const archivedStatuses = new Set(['inactive', 'placed']);

export function CandidatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('views');

  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'archived'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('candidates_view') as string;
      return stored === 'archived' ? 'archived' : 'list';
    }
    return 'list';
  });

  // Candidates state
  const [candidates, setCandidates] = useState<APICandidateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail sheet state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<APICandidateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Handle deep-link from other pages (e.g. ?selected=candidateId)
  useEffect(() => {
    const linked = searchParams.get('selected');
    if (linked) {
      setSelectedId(linked);
    }
  }, [searchParams]);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCandidates({ limit: 100 });
      setCandidates(response.items);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      setError('Kon kandidaten niet laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  useRealtimeTable({
    schema: 'ats',
    table: 'candidates',
    onUpdate: fetchCandidates,
  });

  // Detail fetch
  const refreshDetail = useCallback(async () => {
    if (!selectedId) return;
    try {
      const detail = await getCandidate(selectedId);
      setSelectedDetail(detail);
    } catch (err) {
      console.error('Failed to fetch candidate detail:', err);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }

    setDetailLoading(true);
    getCandidate(selectedId)
      .then(setSelectedDetail)
      .catch((err) => {
        console.error('Failed to fetch candidate detail:', err);
        setSelectedDetail(null);
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const handleRowClick = (candidate: APICandidateListItem) => {
    setSelectedId(candidate.id);
  };

  const handleCloseDetail = () => {
    setSelectedId(null);
    setSelectedDetail(null);
  };

  // Filtering
  const filteredCandidates = useMemo(() => {
    let result = view === 'archived'
      ? candidates.filter((c) => archivedStatuses.has(c.status))
      : candidates;
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
  }, [searchQuery, candidates, view]);

  const totalCount = candidates.length;
  const archivedCount = candidates.filter((c) => archivedStatuses.has(c.status)).length;

  return (
    <>
      <PageLayout>
        <PageLayoutHeader />
        <PageLayoutContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <Tabs
              value={view}
              onValueChange={(v) => {
                const next = v as 'list' | 'archived';
                setView(next);
                localStorage.setItem('candidates_view', next);
              }}
            >
              <TabsList variant="line">
                <TabsTrigger value="list">
                  <List className="w-3.5 h-3.5" />
                  {t('list')}
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                    {loading ? '...' : totalCount}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="archived">
                  <Archive className="w-3.5 h-3.5" />
                  {t('archived')}
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                    {loading ? '...' : archivedCount}
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('search')}
              className="w-64"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              {error}
            </div>
          ) : (
            <CandidatesTable
              candidates={filteredCandidates}
              selectedId={selectedId}
              onRowClick={handleRowClick}
            />
          )}
        </PageLayoutContent>
      </PageLayout>

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && handleCloseDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-[720px] p-0" showCloseButton={false}>
          <CandidateDetailPane
            candidate={selectedDetail}
            isLoading={detailLoading}
            onClose={handleCloseDetail}
            onRefresh={refreshDetail}
            onVacancyClick={(vacancyId) => {
              handleCloseDetail();
              router.push(`/views/vacancies?selected=${vacancyId}`);
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
