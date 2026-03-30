'use client';

import { useState, useCallback } from 'react';
import { List } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchInput } from '@/components/kit/search-input';
import { CandidatesPipeline } from '@/components/blocks/candidates-pipeline';
import { CandidateDetailPane } from '@/components/blocks/views';
import { APICandidateDetail } from '@/lib/types';
import { getCandidate } from '@/lib/api';
import { useTranslations } from '@/lib/i18n';

export default function PipelinePage() {
  const t = useTranslations('views');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<APICandidateDetail | null>(null);
  const [candidateDetailLoading, setCandidateDetailLoading] = useState(false);

  const handleCandidateClick = async (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setCandidateDetailLoading(true);
    try {
      const detail = await getCandidate(candidateId);
      setSelectedCandidateDetail(detail);
    } catch {
      setSelectedCandidateDetail(null);
    } finally {
      setCandidateDetailLoading(false);
    }
  };

  const refreshCandidateDetail = useCallback(async () => {
    if (!selectedCandidateId) return;
    try {
      const detail = await getCandidate(selectedCandidateId);
      setSelectedCandidateDetail(detail);
    } catch {
      // silent refresh failure
    }
  }, [selectedCandidateId]);

  return (
    <>
      <PageLayout>
        <PageLayoutHeader />
        <PageLayoutContent contentClassName="flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
            <Tabs value="alle">
              <TabsList variant="line">
                <TabsTrigger value="alle">
                  <List className="w-3.5 h-3.5" />
                  {t('all')}
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
          <CandidatesPipeline
            searchQuery={searchQuery}
            onCandidateClick={handleCandidateClick}
          />
        </PageLayoutContent>
      </PageLayout>

      <Sheet
        open={!!selectedCandidateId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCandidateId(null);
            setSelectedCandidateDetail(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-[720px] p-0" showCloseButton={false}>
          <CandidateDetailPane
            candidate={selectedCandidateDetail}
            isLoading={candidateDetailLoading}
            onClose={() => {
              setSelectedCandidateId(null);
              setSelectedCandidateDetail(null);
            }}
            onRefresh={refreshCandidateDetail}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
