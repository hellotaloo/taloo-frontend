'use client';

import { FileCheck, CheckCircle2, Loader2, FileText, AlertCircle, ArrowLeft, List } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type {
  CollectionStatus,
  DocumentCollectionFullDetailResponse,
  DocumentCollectionResponse,
  Vacancy,
} from '@/lib/types';
import {
  getDocumentCollections,
  getDocumentCollection,
  getVacancyAgentStatus,
  updateVacancyAgentStatus,
} from '@/lib/document-collection-api';
import { getVacancy } from '@/lib/interview-api';
import { useRealtimeTable } from '@/hooks/use-realtime-table';
import { MetricCard } from '@/components/kit/metric-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CollectionTable, CollectionDetailPane } from '@/components/blocks/collection-table';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

type FilterTab = 'all' | CollectionStatus;

export default function VacancyDocumentCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const vacancyId = params.id as string;

  // Core state
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [collections, setCollections] = useState<DocumentCollectionResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Agent status state
  const [hasAgent, setHasAgent] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Detail state
  const [activeTab, setActiveTab] = useState<FilterTab>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DocumentCollectionFullDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const fetchCollections = useCallback(async () => {
    try {
      const data = await getDocumentCollections({ vacancy_id: vacancyId, limit: 200 });
      setCollections(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load document collections:', error);
    }
  }, [vacancyId]);

  const fetchAgentStatus = useCallback(async () => {
    try {
      const status = await getVacancyAgentStatus(vacancyId);
      setHasAgent(true);
      setIsOnline(status.is_online);
    } catch {
      setHasAgent(false);
    }
  }, [vacancyId]);

  const fetchDetail = useCallback((id: string) => {
    setDetailLoading(true);
    getDocumentCollection(id)
      .then(setSelectedDetail)
      .catch(() => setSelectedDetail(null))
      .finally(() => setDetailLoading(false));
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [vacancyData] = await Promise.all([
          getVacancy(vacancyId),
          fetchCollections(),
          fetchAgentStatus(),
        ]);
        setVacancy(vacancyData);
      } catch (error) {
        console.error('Failed to load vacancy:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [vacancyId, fetchCollections, fetchAgentStatus]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }
    fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  // Realtime listeners
  useRealtimeTable({
    schema: 'agents',
    table: 'document_collections',
    event: '*',
    onUpdate: () => {
      fetchCollections();
      if (selectedIdRef.current) fetchDetail(selectedIdRef.current);
    },
  });

  useRealtimeTable({
    schema: 'agents',
    table: 'document_collection_session_turns',
    event: 'INSERT',
    onUpdate: () => {
      if (selectedIdRef.current) fetchDetail(selectedIdRef.current);
    },
  });

  useRealtimeTable({
    schema: 'agents',
    table: 'document_collection_uploads',
    event: '*',
    onUpdate: () => {
      fetchCollections();
      if (selectedIdRef.current) fetchDetail(selectedIdRef.current);
    },
  });

  const handleCloseDetail = useCallback(() => {
    setSelectedId(null);
  }, []);

  // --- Online/Offline toggle ---
  const handleStatusToggle = useCallback((newOnlineStatus: boolean) => {
    if (!newOnlineStatus) {
      setShowOfflineDialog(true);
    } else {
      performStatusUpdate(true);
    }
  }, []);

  const performStatusUpdate = useCallback(async (online: boolean) => {
    const previousOnline = isOnline;
    setIsOnline(online); // Optimistic
    setIsTogglingStatus(true);

    try {
      const updated = await updateVacancyAgentStatus(vacancyId, 'document_collection', { is_online: online });
      setIsOnline(updated.is_online);
      toast.success(online ? 'Agent is nu online' : 'Agent is offline gezet');
    } catch (error) {
      setIsOnline(previousOnline); // Rollback
      toast.error('Kon status niet bijwerken');
      console.error('Failed to update agent status:', error);
    } finally {
      setIsTogglingStatus(false);
    }
  }, [vacancyId, isOnline]);

  // --- Stats ---
  const stats = useMemo(() => {
    const active = collections.filter(c => c.status === 'active').length;
    const completed = collections.filter(c => c.status === 'completed').length;
    const needsReview = collections.filter(c => c.status === 'needs_review').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { active, completed, needsReview, completionRate };
  }, [collections, total]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return collections;
    return collections.filter(c => c.status === activeTab);
  }, [collections, activeTab]);

  const countByStatus = useMemo(() => ({
    active: collections.filter(c => c.status === 'active').length,
    completed: collections.filter(c => c.status === 'completed').length,
    needs_review: collections.filter(c => c.status === 'needs_review').length,
    abandoned: collections.filter(c => c.status === 'abandoned').length,
  }), [collections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Laden...</span>
      </div>
    );
  }

  return (
    <>
      <PageLayout>
        <PageLayoutHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/document-collection')}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {vacancy?.title ?? 'Documentcollectie'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Online/Offline toggle */}
              {hasAgent && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm">
                  <span className="text-gray-500">Agent online</span>
                  <Switch
                    checked={isOnline}
                    disabled={isTogglingStatus}
                    onCheckedChange={handleStatusToggle}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              )}
            </div>
          </div>
        </PageLayoutHeader>
        <PageLayoutContent>
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Actieve collecties"
              value={stats.active}
              label="Lopend"
              icon={FileText}
              variant="blue"
            />
            <MetricCard
              title="Afrondingspercentage"
              value={`${stats.completionRate}%`}
              label="Alle collecties"
              icon={CheckCircle2}
              variant="dark"
              progress={stats.completionRate}
            />
            <MetricCard
              title="Volledig verzameld"
              value={stats.completed}
              label="Afgerond"
              icon={FileCheck}
              variant="lime"
            />
            <MetricCard
              title="Review nodig"
              value={stats.needsReview}
              label="Wacht op verificatie"
              icon={AlertCircle}
              variant="pink"
            />
          </div>

          {/* Status filter tabs */}
          <Tabs
            defaultValue="active"
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as FilterTab)}
            className="space-y-2"
          >
            <TabsList variant="line">
              <TabsTrigger value="active">
                Actief
                <CountBadge count={countByStatus.active} />
              </TabsTrigger>
              <TabsTrigger value="completed">
                Compleet
                <CountBadge count={countByStatus.completed} />
              </TabsTrigger>
              <TabsTrigger value="needs_review">
                Review nodig
                <CountBadge count={countByStatus.needs_review} />
              </TabsTrigger>
              <TabsTrigger value="abandoned">
                Afgebroken
                <CountBadge count={countByStatus.abandoned} />
              </TabsTrigger>
              <TabsTrigger value="all">
                <List className="w-3.5 h-3.5" />
                Alle
                <CountBadge count={total} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <CollectionTable
                collections={filtered}
                selectedId={selectedId}
                onSelectCollection={setSelectedId}
              />
            </TabsContent>
          </Tabs>
        </PageLayoutContent>
      </PageLayout>

      {/* Collection detail sheet */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && handleCloseDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-[720px] p-0" showCloseButton={false}>
          <CollectionDetailPane
            collection={selectedDetail}
            isLoading={detailLoading}
            onClose={handleCloseDetail}
          />
        </SheetContent>
      </Sheet>

      {/* Offline confirmation dialog */}
      <AlertDialog open={showOfflineDialog} onOpenChange={setShowOfflineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Agent offline zetten?</AlertDialogTitle>
            <AlertDialogDescription>
              Als je de agent offline zet, worden lopende documentcollecties gepauzeerd.
              Nieuwe collecties worden niet meer automatisch gestart voor deze vacature.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTogglingStatus}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await performStatusUpdate(false);
                setShowOfflineDialog(false);
              }}
              disabled={isTogglingStatus}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isTogglingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Bezig...
                </>
              ) : (
                'Offline zetten'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
      {count}
    </span>
  );
}
