'use client';

import { FileCheck, CheckCircle2, Loader2, FileText, AlertCircle, Settings, List } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CollectionStatus, DocumentCollectionDetailResponse, DocumentCollectionResponse } from '@/lib/types';
import { getDocumentCollections, getDocumentCollection } from '@/lib/document-collection-api';
import { MetricCard } from '@/components/kit/metric-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CollectionTable, CollectionDetailPane } from '@/components/blocks/collection-table';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { useAtsImport } from '@/hooks/use-ats-import';
import Link from 'next/link';

type FilterTab = 'all' | CollectionStatus;

export default function DocumentCollectionPage() {
  const [collections, setCollections] = useState<DocumentCollectionResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DocumentCollectionDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await getDocumentCollections({ limit: 200 });
      setCollections(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load document collections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }
    setDetailLoading(true);
    getDocumentCollection(selectedId)
      .then(setSelectedDetail)
      .catch(() => setSelectedDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const handleCloseDetail = useCallback(() => {
    setSelectedId(null);
  }, []);

  const atsImport = useAtsImport({
    module: 'document_collection',
    onRefetch: fetchData,
  });

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
        <span className="ml-2 text-gray-500">Document collecties laden...</span>
      </div>
    );
  }

  return (
  <>
    <PageLayout>
      <PageLayoutHeader
        action={
          <div className="flex items-center gap-2">
            {atsImport.isImporting && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                {atsImport.phase === 'importing' ? 'Importeren...' : `${atsImport.publishedCount}/${atsImport.totalCount || '...'}`}
              </Button>
            )}
            <Link href="/document-collection/settings">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Instellingen
              </Button>
            </Link>
          </div>
        }
      />
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
              isImporting={atsImport.isImporting}
              onSync={atsImport.startImport}
            />
          </TabsContent>
        </Tabs>
      </PageLayoutContent>
    </PageLayout>

    <Sheet open={!!selectedId} onOpenChange={(open) => !open && handleCloseDetail()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0" showCloseButton={false}>
        <CollectionDetailPane
          collection={selectedDetail}
          isLoading={detailLoading}
          onClose={handleCloseDetail}
        />
      </SheetContent>
    </Sheet>
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
