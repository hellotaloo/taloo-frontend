'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Archive, List, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/kit/search-input';
import { VacanciesTable, VacancyDetailPane } from '@/components/blocks/views';
import { APIVacancyListItem, APIVacancyDetail } from '@/lib/types';
import { getVacanciesFromAPI, getVacancyDetail } from '@/lib/api';
import { startSync, getSyncStatus } from '@/lib/integrations-api';
import { useRealtimeTable } from '@/hooks/use-realtime-table';
import { cn } from '@/lib/utils';

const archivedStatuses = new Set(['archived', 'closed', 'filled']);

export function VacanciesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [subTab, setSubTab] = useState<'active' | 'archived'>('active');

  // Vacancies state
  const [vacancies, setVacancies] = useState<APIVacancyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail sheet state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<APIVacancyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Track whether initial fetch has completed (to avoid spinner on realtime refetches)
  const initialLoadDone = useRef(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  // Handle deep-link from other pages (e.g. ?selected=vacancyId)
  useEffect(() => {
    const linked = searchParams.get('selected');
    if (linked) {
      setSelectedId(linked);
    }
  }, [searchParams]);

  const fetchVacancies = useCallback(async () => {
    if (!initialLoadDone.current) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await getVacanciesFromAPI({ limit: 100 });
      setVacancies(response.items);
      initialLoadDone.current = true;
    } catch (err) {
      console.error('Failed to fetch vacancies:', err);
      setError('Kon vacatures niet laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVacancies(); }, [fetchVacancies]);

  useRealtimeTable({
    schema: 'ats',
    table: 'vacancies',
    onUpdate: fetchVacancies,
  });

  // Sync handler
  const handleSync = useCallback(async () => {
    try {
      setSyncing(true);
      setSyncMessage('Starten...');
      await startSync();

      pollRef.current = setInterval(async () => {
        try {
          const status = await getSyncStatus();

          if (status.status === 'syncing') {
            const parts: string[] = [];
            if (status.total_fetched > 0) parts.push(`${status.total_fetched} opgehaald`);
            if (status.inserted > 0) parts.push(`${status.inserted} nieuw`);
            if (status.updated > 0) parts.push(`${status.updated} bijgewerkt`);
            setSyncMessage(parts.length > 0 ? parts.join(', ') : 'Bezig...');
          } else if (status.status === 'complete') {
            stopPolling();
            setSyncing(false);
            setSyncMessage('');
            toast.success('Sync voltooid', {
              description: `${status.inserted} nieuw, ${status.updated} bijgewerkt, ${status.skipped} overgeslagen`,
            });
            fetchVacancies();
          } else if (status.status === 'error') {
            stopPolling();
            setSyncing(false);
            setSyncMessage('');
            toast.error('Sync mislukt', { description: status.message });
          }
        } catch {
          stopPolling();
          setSyncing(false);
          setSyncMessage('');
          toast.error('Kon sync status niet ophalen');
        }
      }, 2000);
    } catch (err) {
      setSyncing(false);
      setSyncMessage('');
      toast.error('Sync starten mislukt', {
        description: err instanceof Error ? err.message : 'Onbekende fout',
      });
    }
  }, [fetchVacancies, stopPolling]);

  // Detail fetch
  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }

    setDetailLoading(true);
    getVacancyDetail(selectedId)
      .then(setSelectedDetail)
      .catch((err) => {
        console.error('Failed to fetch vacancy detail:', err);
        setSelectedDetail(null);
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const handleRowClick = (vacancy: APIVacancyListItem) => {
    setSelectedId(vacancy.id);
  };

  const handleCloseDetail = () => {
    setSelectedId(null);
    setSelectedDetail(null);
  };

  // Filtering
  const filteredVacancies = useMemo(() => {
    let result = subTab === 'archived'
      ? vacancies.filter((v) => archivedStatuses.has(v.status))
      : vacancies;
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
  }, [searchQuery, vacancies, subTab]);

  const totalCount = vacancies.length;
  const archivedCount = vacancies.filter((v) => archivedStatuses.has(v.status)).length;

  return (
    <>
      <PageLayout>
        <PageLayoutHeader
          action={
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
              {syncing ? syncMessage : 'Synchroniseren'}
            </Button>
          }
        />
        <PageLayoutContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <Tabs value={subTab} onValueChange={(v) => setSubTab(v as 'active' | 'archived')}>
              <TabsList variant="line">
                <TabsTrigger value="active">
                  <List className="w-3.5 h-3.5" />
                  Alle
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                    {loading ? '...' : totalCount}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="archived">
                  <Archive className="w-3.5 h-3.5" />
                  Gearchiveerd
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                    {loading ? '...' : archivedCount}
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Zoeken..."
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
            <VacanciesTable
              vacancies={filteredVacancies}
              selectedId={selectedId}
              onRowClick={handleRowClick}
            />
          )}
        </PageLayoutContent>
      </PageLayout>

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && handleCloseDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-[720px] p-0" showCloseButton={false}>
          <VacancyDetailPane
            vacancy={selectedDetail}
            isLoading={detailLoading}
            onClose={handleCloseDetail}
            onCandidateClick={(candidateId) => {
              handleCloseDetail();
              router.push(`/views/candidates?selected=${candidateId}`);
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
