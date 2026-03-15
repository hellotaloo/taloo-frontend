'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useClock } from '@/hooks/use-clock';
import {
  Loader2,
  FileText,
  CheckCircle2,
  Circle,
  MessageCircle,
  XCircle,
  SkipForward,
  Download,
  AlertTriangle,
  ArrowRight,
  User,
  ChevronLeft,
  ChevronDown,
  Plus,
  Camera,
  Mic,
  Check,
  CheckCheck,
  Eye,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import type { CollectionProgress } from '@/hooks/use-playground-chat';
import { cn, formatTimestamp } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/kit/status-badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IPhoneMockup } from '@/components/blocks/phone-simulator';
import { WhatsAppChat } from '@/components/testing/WhatsAppChat';
import { InAppBrowser } from '@/components/kit/in-app-browser';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import {
  getDocumentCollections,
  getDocumentCollection,
} from '@/lib/document-collection-api';
import { useRealtimeTable } from '@/hooks/use-realtime-table';
import type {
  DocumentCollectionResponse,
  DocumentCollectionFullDetailResponse,
  CollectionMessageResponse,
  CollectionItemStatusResponse,
} from '@/lib/types';

// =============================================================================
// Status configs
// =============================================================================

const statusConfig: Record<string, { label: string; variant: 'blue' | 'green' | 'orange' | 'red' }> = {
  active:       { label: 'Lopend',            variant: 'blue' },
  completed:    { label: 'Afgerond',          variant: 'green' },
  needs_review: { label: 'Beoordeling nodig', variant: 'orange' },
  abandoned:    { label: 'Verlaten',          variant: 'red' },
};

// =============================================================================
// Main Page
// =============================================================================

export default function DocumentCollectionPlayground() {
  const clock = useClock();
  const [collections, setCollections] = useState<DocumentCollectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);
  const [detail, setDetail] = useState<DocumentCollectionFullDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'view' | 'test'>('test');
  const [chatResetKey, setChatResetKey] = useState(0);
  const [collectionProgress, setCollectionProgress] = useState<CollectionProgress | null>(null);

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  // Fetch collections list
  const fetchCollections = useCallback(async () => {
    try {
      const data = await getDocumentCollections({ limit: 200 });
      setCollections(data.items);
      // Auto-select first active collection if none selected
      if (!selectedIdRef.current && data.items.length > 0) {
        const firstActive = data.items.find((c) => c.status === 'active');
        if (firstActive) setSelectedId(firstActive.id);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch detail for selected collection
  const fetchDetail = useCallback((id: string) => {
    setDetailLoading(true);
    getDocumentCollection(id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setCollectionProgress(null);
      return;
    }
    setCollectionProgress(null);
    fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  // Realtime: refresh on collection changes
  useRealtimeTable({
    schema: 'agents',
    table: 'document_collections',
    event: '*',
    onUpdate: () => {
      fetchCollections();
      if (selectedIdRef.current) fetchDetail(selectedIdRef.current);
    },
  });

  // Realtime: refresh on new messages
  useRealtimeTable({
    schema: 'agents',
    table: 'document_collection_session_turns',
    event: 'INSERT',
    onUpdate: () => {
      if (selectedIdRef.current) fetchDetail(selectedIdRef.current);
    },
  });

  // Realtime: refresh on uploads
  useRealtimeTable({
    schema: 'agents',
    table: 'document_collection_uploads',
    event: '*',
    onUpdate: () => {
      fetchCollections();
      if (selectedIdRef.current) fetchDetail(selectedIdRef.current);
    },
  });

  // Show active collections
  const filtered = useMemo(() => {
    return collections.filter((c) => c.status === 'active');
  }, [collections]);

  const selectedCollection = collections.find((c) => c.id === selectedId);

  return (
    <PageLayout>
      <PageLayoutHeader
        action={
          <Link href="/document-collection">
            <Button variant="outline" size="sm" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Terug naar overzicht
            </Button>
          </Link>
        }
      />
      <PageLayoutContent contentClassName="!p-0">
        <div className="flex h-full">
          {/* Left panel — Controls */}
          <div className="w-[480px] shrink-0 border-r border-gray-200 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-6 space-y-8">
              {/* Collection selector */}
              <section className="space-y-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Selecteer collectie</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Kies een collectie voor de demo</p>
                </div>

                {/* Dropdown */}
                {loading ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                    <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 text-gray-400">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm">Geen lopende collecties gevonden</span>
                  </div>
                ) : (
                  <Popover open={selectOpen} onOpenChange={setSelectOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-dark-blue flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            {selectedCollection ? (
                              <>
                                <span className="font-medium text-gray-900 text-sm">{selectedCollection.candidate_name}</span>
                                <p className="text-xs text-gray-500">
                                  {selectedCollection.vacancy_title || 'Documentcollectie'}
                                </p>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">Selecteer een collectie...</span>
                            )}
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                      <div className="space-y-1 max-h-[320px] overflow-y-auto">
                        {filtered.map((collection) => {
                          const progress = collection.documents_total > 0
                            ? Math.round((collection.documents_collected / collection.documents_total) * 100)
                            : 0;

                          return (
                            <button
                              key={collection.id}
                              type="button"
                              onClick={() => {
                                setSelectedId(collection.id);
                                setSelectOpen(false);
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors',
                                selectedId === collection.id
                                  ? 'bg-brand-dark-blue/5 border border-brand-dark-blue/30'
                                  : 'hover:bg-gray-50',
                              )}
                            >
                              <div className="w-8 h-8 rounded-full bg-brand-dark-blue/10 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-brand-dark-blue" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-gray-900 text-sm block truncate">
                                  {collection.candidate_name}
                                </span>
                                <p className="text-xs text-gray-500">
                                  {collection.vacancy_title || 'Documentcollectie'}
                                </p>
                              </div>
                              {selectedId === collection.id && (
                                <Check className="w-4 h-4 text-brand-dark-blue shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </section>

              {/* Detail: status + summary + items (swap item lists with live progress when available) */}
              {detail ? (
                <CollectionOverview
                  detail={detail}
                  liveProgress={chatMode === 'test' ? collectionProgress : null}
                  reviewFlags={chatMode === 'test' ? collectionProgress?.review_flags : undefined}
                />
              ) : null}
          </div>

          {/* Right content - WhatsApp mockup */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 min-h-0">
            {!selectedId ? (
              <div className="text-center text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">Selecteer een collectie</p>
                <p className="text-xs mt-1">Kies een collectie om het gesprek te bekijken</p>
              </div>
            ) : detailLoading && !detail ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            ) : chatMode === 'test' && selectedId ? (
              <div className="flex flex-col items-center" style={{ transform: 'scale(0.75)', transformOrigin: 'center center' }}>
                <IPhoneMockup>
                  <WhatsAppChat
                    scenario="manual"
                    agentType="document_collection"
                    contextId={selectedId}
                    candidateName={detail?.candidate_name || 'Kandidaat'}
                    resetKey={chatResetKey}
                    isActive={true}
                    onCollectionProgress={setCollectionProgress}
                  />
                </IPhoneMockup>

                {/* Mode toggle + reset */}
                <div className="flex items-center gap-2 mt-6">
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setChatMode('test')}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md transition-colors',
                        chatMode === 'test'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700',
                      )}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Test gesprek
                    </button>
                    <button
                      onClick={() => setChatMode('view')}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md transition-colors',
                        chatMode === 'view'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700',
                      )}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Bekijk gesprek
                    </button>
                  </div>
                  <button
                    onClick={() => setChatResetKey((k) => k + 1)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Reset gesprek"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : detail ? (
              <div className="flex flex-col items-center" style={{ transform: 'scale(0.75)', transformOrigin: 'center center' }}>
                <IPhoneMockup>
                  <CollectionWhatsApp
                    messages={detail.messages}
                    candidateName={detail.candidate_name}
                  />
                </IPhoneMockup>

                {/* Mode toggle + reset */}
                <div className="flex items-center gap-2 mt-6">
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setChatMode('test')}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md transition-colors',
                        chatMode === 'test'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700',
                      )}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Test gesprek
                    </button>
                    <button
                      onClick={() => setChatMode('view')}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md transition-colors',
                        chatMode === 'view'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700',
                      )}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Bekijk gesprek
                    </button>
                  </div>
                  <button
                    onClick={() => setChatResetKey((k) => k + 1)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Reset gesprek"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}

// =============================================================================
// Collection Overview (Documents / Gegevens / Taken)
// =============================================================================

const WORK_AUTH_SLUGS = new Set(['prato_5', 'prato_9', 'prato_20', 'prato_101', 'prato_102']);
const GROUP_LABELS: Record<string, string> = { identity: 'Identiteitsbewijs' };
const ID_FIELD_LABELS: Record<string, string> = {
  holder_name: 'Naam',
  date_of_birth: 'Geboortedatum',
  nationality: 'Nationaliteit',
  national_registry_number: 'Rijksregisternr',
  expiry_date: 'Vervaldatum',
  document_number: 'Documentnr',
};

// Step type → short label for stepper
const STEP_LABELS: Record<string, string> = {
  greeting_and_consent: 'Consent',
  identity_verification: 'Identiteit',
  address_collection: 'Adres',
  collect_attributes: 'Gegevens',
  collect_documents: 'Optioneel',
  medical_screening: 'Medisch',
  contract_signing: 'Contract',
  closing: 'Afsluiting',
};

function ConversationStepProgress({ steps }: { steps: { step: number; type: string; description: string; completed: boolean; current: boolean }[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="flex items-start w-full py-1">
      {steps.map((s, i) => {
        const label = STEP_LABELS[s.type] || s.description || s.type;
        const isLast = i === steps.length - 1;

        return (
          <div key={s.step} className="flex items-start flex-1 min-w-0">
            {/* Step dot + label */}
            <div className="flex flex-col items-center gap-1 w-full min-w-0">
              <div className="flex items-center w-full">
                {/* Left connector */}
                {i > 0 ? (
                  <div className={cn('h-0.5 flex-1', s.completed ? 'bg-green-400' : 'bg-gray-200')} />
                ) : (
                  <div className="flex-1" />
                )}
                {/* Dot */}
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors',
                    s.completed
                      ? 'bg-green-500'
                      : s.current
                        ? 'bg-brand-dark-blue ring-2 ring-brand-dark-blue/20'
                        : 'bg-gray-200',
                  )}
                >
                  {s.completed ? (
                    <Check className="w-3 h-3 text-white" />
                  ) : s.current ? (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  ) : null}
                </div>
                {/* Right connector */}
                {!isLast ? (
                  <div className={cn('h-0.5 flex-1', s.completed && steps[i + 1]?.completed ? 'bg-green-400' : s.completed ? 'bg-green-400' : 'bg-gray-200')} />
                ) : (
                  <div className="flex-1" />
                )}
              </div>
              <span
                className={cn(
                  'text-[9px] leading-tight text-center truncate w-full',
                  s.completed
                    ? 'text-green-600 font-medium'
                    : s.current
                      ? 'text-brand-dark-blue font-semibold'
                      : 'text-gray-400',
                )}
                title={s.description || label}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CollectionOverview({ detail, liveProgress, reviewFlags }: { detail: DocumentCollectionFullDetailResponse; liveProgress?: CollectionProgress | null; reviewFlags?: CollectionProgress['review_flags'] }) {
  const documents = detail.collection_items.filter((i) => i.type === 'document');
  const attributes = detail.collection_items.filter((i) => i.type === 'attribute');
  const tasks = detail.collection_items.filter((i) => i.type === 'task');

  // Build lookup from live SSE progress: slug -> {collected, value}
  // Also index by resolved_slug so individual doc items can be matched
  const collectedMap = useMemo(() => {
    if (!liveProgress) return null;
    const map = new Map<string, CollectedMapEntry>();
    for (const item of liveProgress.items) {
      map.set(item.slug, { collected: item.collected, value: item.value, name: item.name });
      if (item.resolved_slug) {
        map.set(item.resolved_slug, { collected: item.collected });
      }
    }
    return map;
  }, [liveProgress]);

  // Count collected items considering both static status and live SSE progress
  const isItemCollected = useCallback((item: CollectionItemStatusResponse) => {
    const liveEntry = collectedMap?.get(item.slug);
    return liveEntry?.collected === true || ['received', 'verified'].includes(item.status);
  }, [collectedMap]);

  return (
    <>
      <section className="space-y-4">
        {/* Conversation step progress */}
        {(() => {
          const steps = liveProgress?.steps ?? detail.conversation_steps;
          return steps && steps.length > 0 ? <ConversationStepProgress steps={steps} /> : null;
        })()}

        {/* Plan summary */}
        {detail.summary && (
          <div className="bg-brand-dark-blue rounded-lg p-3.5">
            <h4 className="text-[10px] font-semibold tracking-widest uppercase text-brand-light-blue/70 mb-1.5">
              Plan van aanpak
            </h4>
            <p className="text-sm text-white/90 leading-relaxed">
              {detail.summary}
            </p>
          </div>
        )}
      </section>

      {/* Review flags warning */}
      {reviewFlags && reviewFlags.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3.5 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
            <h4 className="text-xs font-semibold text-orange-800 uppercase tracking-wide">
              Recruiter verificatie nodig
            </h4>
          </div>
          {reviewFlags.map((flag, i) => (
            <p key={i} className="text-sm text-orange-700 leading-relaxed pl-6">
              {flag.reason}
            </p>
          ))}
        </div>
      )}

      {/* Documenten */}
      {documents.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Documenten ({documents.filter(isItemCollected).length}/{documents.length})
          </h3>
          <div className="space-y-1.5">
            {groupDocuments(documents).map((entry) =>
              entry.type === 'single' ? (
                <CollectionItemRow key={entry.items[0].slug} item={entry.items[0]} collectedMap={collectedMap} />
              ) : (
                <GroupedDocumentRow key={entry.group} group={entry.group} items={entry.items} collectedMap={collectedMap} />
              ),
            )}
          </div>
        </section>
      )}

      {/* Gegevens */}
      {attributes.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Gegevens ({attributes.filter(isItemCollected).length}/{attributes.length})
          </h3>
          <div className="space-y-1.5">
            {attributes.map((item) => (
              <CollectionItemRow key={item.slug} item={item} collectedMap={collectedMap} />
            ))}
          </div>
        </section>
      )}

      {/* Taken */}
      {tasks.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Taken ({tasks.filter(isItemCollected).length}/{tasks.length})
          </h3>
          <div className="space-y-1.5">
            {tasks.map((item) => (
              <CollectionItemRow key={item.slug} item={item} collectedMap={collectedMap} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// =============================================================================
// Document grouping (matches detail pane logic)
// =============================================================================

type DocumentGroupEntry =
  | { type: 'single'; group: string; items: [CollectionItemStatusResponse] }
  | { type: 'grouped'; group: string; items: CollectionItemStatusResponse[] };

function groupDocuments(documents: CollectionItemStatusResponse[]): DocumentGroupEntry[] {
  const entries: DocumentGroupEntry[] = [];
  const grouped: Record<string, CollectionItemStatusResponse[]> = {};
  const ungrouped: CollectionItemStatusResponse[] = [];

  for (const doc of documents) {
    if (doc.group) {
      if (!grouped[doc.group]) grouped[doc.group] = [];
      grouped[doc.group].push(doc);
    } else {
      ungrouped.push(doc);
    }
  }

  for (const [group, items] of Object.entries(grouped)) {
    if (items.length === 1) {
      entries.push({ type: 'single', group, items: [items[0]] });
    } else {
      entries.push({ type: 'grouped', group, items });
    }
  }

  for (const doc of ungrouped) {
    entries.push({ type: 'single', group: doc.slug, items: [doc] });
  }

  return entries;
}

// =============================================================================
// Grouped Document Row (identity + work authorization)
// =============================================================================

type CollectedMapEntry = { collected: boolean; value?: string | Record<string, string>; name?: string };
type CollectedMap = Map<string, CollectedMapEntry> | null | undefined;

function GroupedDocumentRow({ group, items, collectedMap }: { group: string; items: CollectionItemStatusResponse[]; collectedMap?: CollectedMap }) {
  const idDocs = items.filter((i) => !WORK_AUTH_SLUGS.has(i.slug));
  const workAuthDocs = items.filter((i) => WORK_AUTH_SLUGS.has(i.slug));

  // SSE live entry for identity_verification — has name (detected doc type) and value (extracted fields)
  const idLiveEntry = collectedMap?.get('identity_verification');

  // SSE uses "identity_verification" slug, static items use group "identity" and individual slugs like "id_card"
  const groupLiveCollected = collectedMap?.get(group)?.collected === true;
  const idLiveCollected = groupLiveCollected || idLiveEntry?.collected === true || idDocs.some((i) => collectedMap?.get(i.slug)?.collected === true);
  const idVerified = idDocs.some((i) => i.status === 'verified');
  const idReceived = idLiveCollected || idDocs.some((i) => ['received', 'verified'].includes(i.status));
  const workAuthLiveCollected = workAuthDocs.some((i) => collectedMap?.get(i.slug)?.collected === true);
  const workAuthReceived = workAuthLiveCollected || workAuthDocs.some((i) => ['received', 'verified'].includes(i.status));

  // Use detected document type from SSE (e.g. "Identiteitskaart") or fallback to static label
  const label = idLiveEntry?.name || GROUP_LABELS[group] || group;
  const idNames = idDocs.map((i) => i.name).join(' / ');

  // Extracted fields from identity document (from SSE value)
  const extractedFields = idLiveEntry?.value;
  const isStructured = extractedFields != null && typeof extractedFields === 'object';
  // Show extracted fields as soon as they exist (even if identity isn't fully verified yet)
  const hasExtractedFields = isStructured && Object.keys(extractedFields as Record<string, string>).length > 0;

  return (
    <div className="space-y-0.5">
      <div className={cn(
        'flex items-center justify-between py-1.5 px-2.5 rounded-md text-sm transition-colors',
        idReceived || hasExtractedFields ? 'bg-green-50/50' : 'bg-transparent',
      )}>
        <div className="flex items-center gap-2.5 min-w-0">
          {idLiveCollected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
          ) : hasExtractedFields ? (
            <CollectionItemIcon status="received" />
          ) : (
            <CollectionItemIcon status={idVerified ? 'verified' : idReceived ? 'received' : 'pending'} />
          )}
          <div className="min-w-0">
            <span className={cn('truncate', idReceived || hasExtractedFields ? 'text-gray-900' : 'text-gray-500')}>
              {label}
            </span>
            {idNames && (
              <span className="text-[10px] text-gray-400 ml-1.5">{idNames}</span>
            )}
          </div>
        </div>
        {idDocs.some((i) => i.verification_passed) && (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
        )}
      </div>

      {/* Extracted identity fields */}
      {hasExtractedFields && (
        <div className="ml-8 space-y-0.5 mt-0.5">
          {Object.entries(extractedFields as Record<string, string>).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 py-0.5 px-2.5 text-xs">
              <span className="text-gray-400 w-24 shrink-0">{ID_FIELD_LABELS[key] || key.replace(/_/g, ' ')}</span>
              <span className="text-gray-600 font-mono truncate">{val}</span>
            </div>
          ))}
        </div>
      )}

      {workAuthDocs.length > 0 && (
        <div className={cn(
          'flex items-center justify-between py-1 px-2.5 rounded-md text-sm transition-colors',
          workAuthReceived ? 'bg-green-50/50' : 'bg-transparent',
        )}>
          <div className="flex items-center gap-1.5 min-w-0 pl-8">
            <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
            <span className={cn('text-xs', workAuthReceived ? 'text-gray-900' : 'text-gray-400')}>
              Werkvergunning indien nodig
            </span>
          </div>
          {workAuthDocs.some((i) => i.verification_passed) && (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Single Collection Item Row
// =============================================================================

function CollectionItemRow({ item, collectedMap }: { item: CollectionItemStatusResponse; collectedMap?: CollectedMap }) {
  // If live progress says collected, override the status visually
  const liveEntry = collectedMap?.get(item.slug);
  const liveCollected = liveEntry?.collected === true;
  const isCollected = liveCollected || ['received', 'verified'].includes(item.status);

  // Resolve display value — prefer live value, fallback to stored value
  const displayValue = liveEntry?.value ?? item.value;
  const isStructured = displayValue != null && typeof displayValue === 'object';

  return (
    <div>
      <div className={cn(
        'flex items-center justify-between py-1.5 px-2.5 rounded-md text-sm transition-colors',
        isCollected ? 'bg-green-50/50' : 'bg-transparent',
      )}>
        <div className="flex items-center gap-2.5 min-w-0">
          {liveCollected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
          ) : (
            <CollectionItemIcon status={item.status} />
          )}
          <span className={cn('truncate', isCollected ? 'text-gray-900' : 'text-gray-500')}>
            {item.name}
          </span>
          {item.priority === 'recommended' && (
            <span className="text-[10px] text-gray-400 shrink-0">(optioneel)</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {displayValue && !isStructured && (
            <span className="text-xs text-gray-600 font-mono truncate max-w-[140px]">{displayValue as string}</span>
          )}
          {item.verification_passed && (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          )}
          {item.uploaded_at && (
            <span className="text-[10px] text-gray-400">{formatTimestamp(item.uploaded_at)}</span>
          )}
        </div>
      </div>
      {/* Structured fields — indented sub-fields */}
      {isStructured && isCollected && (
        <div className="ml-8 space-y-0.5 mt-0.5">
          {Object.entries(displayValue as Record<string, string>).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 py-0.5 px-2.5 text-xs">
              <span className="text-gray-400 w-20 shrink-0 capitalize">{key}</span>
              <span className="text-gray-600 font-mono truncate">{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Collection Item Status Icon
// =============================================================================

function CollectionItemIcon({ status }: { status: string }) {
  switch (status) {
    case 'verified': return <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />;
    case 'received': return <Download className="w-3.5 h-3.5 text-yellow-500 shrink-0" />;
    case 'asked':    return <MessageCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    case 'failed':   return <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
    case 'skipped':  return <SkipForward className="w-3.5 h-3.5 text-gray-400 shrink-0" />;
    default:         return <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />;
  }
}

// =============================================================================
// WhatsApp Chat for Document Collection
// =============================================================================

function CollectionWhatsApp({
  messages,
}: {
  messages: CollectionMessageResponse[];
  candidateName?: string;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [browserUrl, setBrowserUrl] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: '#efeae2',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cdc4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* iOS Status bar */}
      <div className="bg-[#f6f6f6] px-6 flex items-center justify-between text-black text-sm font-semibold h-[50px]">
        <span className="mt-1">{clock}</span>
        <div className="flex items-center gap-1 mt-1">
          <div className="flex gap-0.5 items-end">
            <div className="w-[3px] h-[4px] bg-black rounded-sm" />
            <div className="w-[3px] h-[6px] bg-black rounded-sm" />
            <div className="w-[3px] h-[8px] bg-black rounded-sm" />
            <div className="w-[3px] h-[10px] bg-black rounded-sm" />
          </div>
          <div className="ml-1 flex items-center">
            <div className="w-[22px] h-[11px] border border-black rounded-[3px] relative flex items-center p-px">
              <div className="bg-black rounded-sm h-full" style={{ width: '100%' }} />
            </div>
            <div className="w-px h-[4px] bg-black rounded-r-sm ml-px" />
          </div>
        </div>
      </div>

      {/* WhatsApp header */}
      <div className="bg-[#f6f6f6] px-1 py-1 flex items-center gap-2 border-b border-gray-200">
        <button className="flex items-center text-[#007AFF]">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden ml-1">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-black font-semibold text-sm truncate">Taloo</p>
          <p className="text-gray-500 text-[10px]">Documentcollectie</p>
        </div>
      </div>

      {/* Chat messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2 space-y-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style jsx>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-gray-500 bg-white/80 rounded-full px-3 py-1">
              Nog geen berichten
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            if (msg.role === 'system') {
              return (
                <div key={i} className="flex justify-center my-2">
                  <span className="text-[11px] text-gray-600 bg-white/90 rounded-lg px-3 py-1 shadow-sm">
                    {msg.message}
                  </span>
                </div>
              );
            }

            const isAgent = msg.role === 'agent';
            const time = new Date(msg.created_at);
            const timeStr = `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`;

            return (
              <div key={i} className={cn('flex mb-1', isAgent ? 'justify-start' : 'justify-end')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-[18px] px-3 py-2 relative',
                    isAgent ? 'bg-white' : 'bg-[#dcf8c6]',
                  )}
                  style={{ boxShadow: '0 1px 0.5px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="text-[15px] text-black leading-[20px] [&>p]:mb-1 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:list-inside [&>ul]:mb-1 [&>ol]:list-decimal [&>ol]:list-inside [&>ol]:mb-1 [&>li]:ml-0 [&_strong]:font-semibold [&_em]:italic [&_a]:text-[#007AFF] [&_a]:underline">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            onClick={(e) => {
                              e.preventDefault();
                              if (href) setBrowserUrl(href);
                            }}
                            className="text-[#007AFF] underline cursor-pointer"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {msg.message}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[11px] text-gray-500">{timeStr}</span>
                    {!isAgent && (
                      <CheckCheck className="w-[18px] h-[18px] text-[#53bdeb]" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area (read-only display) */}
      <div className="bg-[#f6f6f6] px-1.5 py-1.5 flex items-end gap-0.5 border-t border-gray-200">
        <button className="h-9 pr-1 flex items-center justify-center text-gray-500 shrink-0">
          <Plus className="w-6 h-6" />
        </button>
        <div className="flex-1 flex items-center bg-white rounded-[18px] border border-gray-300 min-h-[36px] pl-3 pr-2 py-1.5">
          <span className="text-sm text-gray-400">Bericht</span>
        </div>
        <button className="h-9 pl-1 flex items-center justify-center text-gray-500 shrink-0">
          <Camera className="w-5 h-5" />
        </button>
        <button className="h-9 pl-1 flex items-center justify-center text-gray-500 shrink-0">
          <Mic className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom safe area */}
      <div className="bg-[#f6f6f6] h-5 flex items-center justify-center">
        <div className="w-32 h-1 bg-black rounded-full" />
      </div>

      {/* In-app browser overlay */}
      {browserUrl && (
        <InAppBrowser url={browserUrl} onClose={() => setBrowserUrl(null)} />
      )}
    </div>
  );
}
