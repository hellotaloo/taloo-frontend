'use client';

import { useState } from 'react';
import { List } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchInput } from '@/components/kit/search-input';
import { CandidatesPipeline } from '@/components/blocks/candidates-pipeline';
import { CandidateDetailPane } from '@/components/blocks/records';
import { APICandidateDetail, APIVacancyListItem } from '@/lib/types';
import { getCandidate } from '@/lib/api';

export default function PipelinePage() {
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

  return (
    <>
      <PageLayout>
        <PageLayoutHeader />
        <PageLayoutContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <Tabs value="alles">
              <TabsList variant="line">
                <TabsTrigger value="alles">
                  <List className="w-3.5 h-3.5" />
                  Alles
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
        <SheetContent side="right" className="w-full sm:max-w-xl p-0" showCloseButton={false}>
          <CandidateDetailPane
            candidate={selectedCandidateDetail}
            isLoading={candidateDetailLoading}
            onClose={() => {
              setSelectedCandidateId(null);
              setSelectedCandidateDetail(null);
            }}
            vacancies={[] as APIVacancyListItem[]}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
