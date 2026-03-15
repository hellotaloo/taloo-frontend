'use client';

import { useState, useEffect } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  Circle,
  Loader2,
  MessageCircle,
  XCircle,
  SkipForward,
  Download,
  ArrowRight,
  User,
  ChevronRight,
  Briefcase,
  Play,
} from 'lucide-react';
import { cn, formatTimestamp, formatDate, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/kit/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCollectionActivities, triggerCollectionTask } from '@/lib/document-collection-api';
import { toast } from 'sonner';
import type {
  DocumentCollectionFullDetailResponse,
  CollectionItemStatusResponse,
  CollectionGoal,
  WorkflowStepResponse,
  CollectionMessageResponse,
  DocumentStatus,
  GlobalActivity,
} from '@/lib/types';

// =============================================================================
// Props
// =============================================================================

interface CollectionDetailPaneProps {
  collection: DocumentCollectionFullDetailResponse | null;
  isLoading?: boolean;
  onClose?: () => void;
  onNavigateToCandidate?: (candidateId: string) => void;
  onNavigateToCandidacy?: (candidacyId: string) => void;
}

// =============================================================================
// Status configs
// =============================================================================

const collectionStatusConfig: Record<string, { label: string; variant: 'blue' | 'green' | 'orange' | 'red' }> = {
  active:       { label: 'Lopend',            variant: 'blue' },
  completed:    { label: 'Afgerond',          variant: 'green' },
  needs_review: { label: 'Beoordeling nodig', variant: 'orange' },
  abandoned:    { label: 'Verlaten',          variant: 'red' },
};

const goalConfig: Record<CollectionGoal, { label: string; variant: 'blue' | 'green' | 'orange' | 'red' | 'gray' }> = {
  collect_basic:     { label: 'Documenten & gegevens',     variant: 'blue' },
  collect_and_sign:  { label: 'Verzamelen & ondertekenen', variant: 'green' },
  document_renewal:  { label: 'Document vernieuwing',      variant: 'orange' },
};

const stageLabels: Record<string, string> = {
  new: 'Nieuw',
  pre_screening: 'Pre-screening',
  qualified: 'Gekwalificeerd',
  interview_planned: 'Gesprek gepland',
  interview_done: 'Gesprek afgerond',
  offer: 'Aanbod',
  placed: 'Geplaatst',
  rejected: 'Afgewezen',
  withdrawn: 'Teruggetrokken',
};

const itemStatusConfig: Record<DocumentStatus, { label: string; variant: 'blue' | 'green' | 'orange' | 'red' | 'gray'; icon: React.ReactNode }> = {
  pending:  { label: 'Wachtend',      variant: 'gray',   icon: <Circle className="w-3.5 h-3.5 text-gray-300" /> },
  asked:    { label: 'Gevraagd',      variant: 'blue',   icon: <MessageCircle className="w-3.5 h-3.5 text-blue-500" /> },
  received: { label: 'Ontvangen',     variant: 'orange',  icon: <Download className="w-3.5 h-3.5 text-yellow-500" /> },
  verified: { label: 'Geverifieerd',  variant: 'green',  icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> },
  failed:   { label: 'Mislukt',       variant: 'red',    icon: <XCircle className="w-3.5 h-3.5 text-red-500" /> },
  skipped:  { label: 'Overgeslagen',  variant: 'gray',   icon: <SkipForward className="w-3.5 h-3.5 text-gray-400" /> },
};

const workflowStepStyle: Record<string, { icon: React.ReactNode; ring: string }> = {
  completed: { icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, ring: 'ring-green-200 bg-green-50' },
  current:   { icon: <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />, ring: 'ring-blue-200 bg-blue-50' },
  pending:   { icon: <div className="w-2 h-2 rounded-full bg-gray-300" />, ring: 'ring-gray-200 bg-gray-50' },
  failed:    { icon: <XCircle className="w-4 h-4 text-red-500" />, ring: 'ring-red-200 bg-red-50' },
};

// =============================================================================
// Main Component
// =============================================================================

export function CollectionDetailPane({
  collection,
  isLoading,
  onClose,
  onNavigateToCandidate,
  onNavigateToCandidacy,
}: CollectionDetailPaneProps) {
  const [activities, setActivities] = useState<GlobalActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Fetch activities when collection changes (for Tijdlijn tab)
  useEffect(() => {
    if (!collection?.candidate_id || !collection?.vacancy_id) {
      setActivities([]);
      return;
    }

    setActivitiesLoading(true);
    getCollectionActivities(collection.candidate_id, collection.vacancy_id, { limit: 50 })
      .then((res) => setActivities(res.items))
      .catch(() => setActivities([]))
      .finally(() => setActivitiesLoading(false));
  }, [collection?.candidate_id, collection?.vacancy_id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Selecteer een collectie om details te bekijken</p>
        </div>
      </div>
    );
  }

  const statusCfg = collectionStatusConfig[collection.status] ?? collectionStatusConfig.active;
  const documents = collection.collection_items.filter((i) => i.type === 'document');
  const attributes = collection.collection_items.filter((i) => i.type === 'attribute');
  const tasks = collection.collection_items.filter((i) => i.type === 'task');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-900">
            <span className="text-gray-400 font-normal">Document collectie</span>{' '}
            {collection.candidate_name}
          </h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
          {collection.goal && (
            <>
              <span className="text-gray-300">·</span>
              <StatusBadge
                label={goalConfig[collection.goal]?.label ?? collection.goal}
                variant={goalConfig[collection.goal]?.variant ?? 'gray'}
              />
            </>
          )}
        </div>

        {/* Plan summary */}
        {collection.summary && (
          <div className="mt-3 bg-brand-dark-blue rounded-lg p-3.5">
            <h4 className="text-[10px] font-semibold tracking-widest uppercase text-brand-light-blue/70 mb-1.5">
              Plan van aanpak
            </h4>
            <p className="text-sm text-white/90 leading-relaxed">
              {collection.summary}
            </p>
          </div>
        )}

        {/* Candidate + Vacancy cards */}
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          {collection.candidate_id && onNavigateToCandidate ? (
            <button
              onClick={() => onNavigateToCandidate(collection.candidate_id!)}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{collection.candidate_name}</p>
                {collection.candidate_phone && (
                  <p className="text-xs text-gray-400 truncate">{collection.candidate_phone}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 ml-auto" />
            </button>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">{collection.candidate_name}</p>
                {collection.candidate_phone && (
                  <p className="text-xs text-gray-400 truncate">{collection.candidate_phone}</p>
                )}
              </div>
            </div>
          )}

          {collection.vacancy_id ? (
            <button
              onClick={() => collection.candidacy_id && onNavigateToCandidacy?.(collection.candidacy_id)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border text-left',
                collection.candidacy_id && onNavigateToCandidacy
                  ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors'
                  : 'border-gray-100 bg-gray-50/50 cursor-default',
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{collection.vacancy_title || 'Vacature'}</p>
                {collection.candidacy_stage && (
                  <p className="text-xs text-gray-400 truncate">
                    {stageLabels[collection.candidacy_stage] ?? collection.candidacy_stage}
                  </p>
                )}
              </div>
              {collection.candidacy_id && onNavigateToCandidacy && (
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 ml-auto" />
              )}
            </button>
          ) : null}
        </div>

        {/* Progress bars */}
        {collection.collection_items.length > 0 && (
          <div className="flex gap-3 mt-3">
            {documents.length > 0 && (
              <ProgressBar
                label="Documenten"
                collected={documents.filter((d) => d.status === 'verified').length}
                total={documents.length}
              />
            )}
            {attributes.length > 0 && (
              <ProgressBar
                label="Gegevens"
                collected={attributes.filter((a) => ['received', 'verified'].includes(a.status)).length}
                total={attributes.length}
              />
            )}
            {tasks.length > 0 && (
              <ProgressBar
                label="Taken"
                collected={tasks.filter((t) => ['received', 'verified'].includes(t.status)).length}
                total={tasks.length}
              />
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tijdlijn" className="flex-1 flex flex-col min-h-0">
        <TabsList variant="line" className="px-6 shrink-0">
          <TabsTrigger value="tijdlijn">Tijdlijn</TabsTrigger>
          <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="overzicht" className="px-6 py-5 space-y-5 mt-0">
            <OverzichtTab documents={documents} attributes={attributes} tasks={tasks} collectionId={collection.id} />
          </TabsContent>

          <TabsContent value="tijdlijn" className="px-6 py-5 space-y-6 mt-0">
            <TijdlijnTab
              workflowSteps={collection.workflow_steps}
              activities={activities}
              activitiesLoading={activitiesLoading}
            />
          </TabsContent>

          <TabsContent value="chat" className="px-6 py-5 mt-0">
            <ChatTab messages={collection.messages} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// =============================================================================
// Collection Item Row
// =============================================================================

// =============================================================================
// Progress Bar (compact, for header)
// =============================================================================

function ProgressBar({ label, collected, total }: { label: string; collected: number; total: number }) {
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className="text-xs text-gray-400">{collected}/{total}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-gray-200',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Document grouping helpers
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

  // Grouped items first
  for (const [group, items] of Object.entries(grouped)) {
    if (items.length === 1) {
      entries.push({ type: 'single', group, items: [items[0]] });
    } else {
      entries.push({ type: 'grouped', group, items });
    }
  }

  // Then ungrouped
  for (const doc of ungrouped) {
    entries.push({ type: 'single', group: doc.slug, items: [doc] });
  }

  return entries;
}

const GROUP_LABELS: Record<string, string> = {
  identity: 'Identiteitsbewijs',
};

const WORK_AUTH_SLUGS = new Set(['prato_5', 'prato_9', 'prato_20', 'prato_101', 'prato_102']);

function GroupedDocumentRow({ group, items }: { group: string; items: CollectionItemStatusResponse[] }) {
  // Split into ID docs and work authorization docs
  const idDocs = items.filter((i) => !WORK_AUTH_SLUGS.has(i.slug));
  const workAuthDocs = items.filter((i) => WORK_AUTH_SLUGS.has(i.slug));

  // ID row status
  const idVerified = idDocs.some((i) => i.status === 'verified');
  const idReceived = idDocs.some((i) => ['received', 'verified'].includes(i.status));
  const idConfig = idVerified ? itemStatusConfig.verified : idReceived ? itemStatusConfig.received : itemStatusConfig.pending;

  // Work auth row status
  const workAuthReceived = workAuthDocs.some((i) => ['received', 'verified'].includes(i.status));

  const label = GROUP_LABELS[group] ?? group;
  const idNames = idDocs.map((i) => i.name).join(' / ');

  return (
    <div className="space-y-0.5">
      {/* Main row: identity document */}
      <div className={cn(
        'flex items-center justify-between py-1.5 px-2.5 rounded-md text-sm',
        idReceived ? 'bg-green-50/50' : 'bg-transparent',
      )}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0">{idConfig.icon}</div>
          <div className="min-w-0">
            <span className={cn('truncate', idReceived ? 'text-gray-900' : 'text-gray-500')}>
              {label}
            </span>
            {idNames && (
              <span className="text-[10px] text-gray-400 ml-1.5">{idNames}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {idDocs.some((i) => i.verification_passed) && (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          )}
        </div>
      </div>

      {/* Sub-row: work authorization */}
      {workAuthDocs.length > 0 && (
        <div className={cn(
          'flex items-center justify-between py-1 px-2.5 rounded-md text-sm',
          workAuthReceived ? 'bg-green-50/50' : 'bg-transparent',
        )}>
          <div className="flex items-center gap-1.5 min-w-0 pl-8">
            <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
            <span className={cn('text-xs', workAuthReceived ? 'text-gray-900' : 'text-gray-400')}>
              Werkvergunning indien nodig
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {workAuthDocs.some((i) => i.verification_passed) && (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Overzicht Tab
// =============================================================================

function OverzichtTab({
  documents,
  attributes,
  tasks,
  collectionId,
}: {
  documents: CollectionItemStatusResponse[];
  attributes: CollectionItemStatusResponse[];
  tasks: CollectionItemStatusResponse[];
  collectionId: string;
}) {
  return (
    <>
      {documents.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Documenten ({documents.filter((d) => d.status === 'verified').length}/{documents.length})
          </h3>
          <div className="space-y-1.5">
            {groupDocuments(documents).map((entry) =>
              entry.type === 'single' ? (
                <CollectionItemRow key={entry.items[0].slug} item={entry.items[0]} />
              ) : (
                <GroupedDocumentRow key={entry.group} group={entry.group} items={entry.items} />
              ),
            )}
          </div>
        </div>
      )}

      {attributes.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Gegevens ({attributes.filter((a) => ['received', 'verified'].includes(a.status)).length}/{attributes.length})
          </h3>
          <div className="space-y-1.5">
            {attributes.map((item) => (
              <CollectionItemRow key={item.slug} item={item} />
            ))}
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Taken ({tasks.filter((t) => ['received', 'verified'].includes(t.status)).length}/{tasks.length})
          </h3>
          <div className="space-y-1.5">
            {tasks.map((item) => (
              <TaskItemRow key={item.slug} item={item} collectionId={collectionId} />
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && attributes.length === 0 && tasks.length === 0 && (
        <p className="text-sm text-gray-400">Nog geen items om te verzamelen</p>
      )}
    </>
  );
}

// =============================================================================
// Collection Item Row
// =============================================================================

function CollectionItemRow({ item }: { item: CollectionItemStatusResponse }) {
  const config = itemStatusConfig[item.status] ?? itemStatusConfig.pending;
  const isCollected = ['received', 'verified'].includes(item.status);
  const isStructured = item.value != null && typeof item.value === 'object';

  return (
    <div>
      <div className={cn(
        'flex items-center justify-between py-1.5 px-2.5 rounded-md text-sm',
        isCollected ? 'bg-green-50/50' : 'bg-transparent',
      )}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0">{config.icon}</div>
          <span className={cn(
            'truncate',
            isCollected ? 'text-gray-900' : 'text-gray-500',
          )}>
            {item.name}
          </span>
          {item.priority === 'recommended' && (
            <span className="text-[10px] text-gray-400 shrink-0">(optioneel)</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {item.value && !isStructured && (
            <span className="text-xs text-gray-600 font-mono truncate max-w-[140px]">{item.value as string}</span>
          )}
          {item.verification_passed && (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          )}
          {item.uploaded_at && (
            <span className="text-[10px] text-gray-400">{formatTimestamp(item.uploaded_at)}</span>
          )}
        </div>
      </div>
      {isStructured && isCollected && (
        <div className="ml-8 space-y-0.5 mt-0.5">
          {Object.entries(item.value as Record<string, string>).map(([key, val]) => (
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

function TaskItemRow({ item, collectionId }: { item: CollectionItemStatusResponse; collectionId: string }) {
  const config = itemStatusConfig[item.status] ?? itemStatusConfig.pending;
  const isCompleted = ['received', 'verified', 'triggered'].includes(item.status);
  const isScheduled = !!item.scheduled_at && !isCompleted;
  const [triggering, setTriggering] = useState(false);

  async function handleTriggerNow() {
    setTriggering(true);
    try {
      await triggerCollectionTask(collectionId, item.slug);
      toast.success(`${item.name} wordt nu uitgevoerd`);
    } catch {
      toast.error('Kon taak niet starten');
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className={cn(
      'flex items-center justify-between py-1.5 px-2.5 rounded-md text-sm',
      isCompleted ? 'bg-green-50/50' : 'bg-transparent',
    )}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="shrink-0">{config.icon}</div>
        <span className={cn(
          'truncate',
          isCompleted ? 'text-gray-900' : 'text-gray-500',
        )}>
          {item.name}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {isScheduled && (
          <>
            <span className="text-xs text-gray-400">
              Gepland op {formatDate(item.scheduled_at)} om {formatTime(item.scheduled_at)}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={handleTriggerNow}
              disabled={triggering}
            >
              {triggering ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Play className="w-3 h-3 mr-1" />Nu starten</>}
            </Button>
          </>
        )}
        {item.status === 'triggered' && (
          <span className="text-[10px] text-orange-500 font-medium">Gestart</span>
        )}
        {isCompleted && item.value && typeof item.value === 'string' && (
          <span className="text-xs text-gray-600 font-mono truncate max-w-[140px]">{item.value}</span>
        )}
        {item.verification_passed && (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Tijdlijn Tab
// =============================================================================

function TijdlijnTab({
  workflowSteps,
  activities,
  activitiesLoading,
}: {
  workflowSteps: WorkflowStepResponse[];
  activities: GlobalActivity[];
  activitiesLoading: boolean;
}) {
  return (
    <>
      {/* Workflow progress bar */}
      {workflowSteps.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Voortgang</h3>
          <div className="flex items-center gap-1">
            {workflowSteps.map((step, i) => {
              const style = workflowStepStyle[step.status] ?? workflowStepStyle.pending;
              return (
                <div key={step.id} className="flex items-center gap-1 flex-1 min-w-0">
                  <div className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 ring-1 flex-1 min-w-0',
                    style.ring,
                  )}>
                    <div className="shrink-0 flex items-center justify-center w-5 h-5">
                      {style.icon}
                    </div>
                    <span className={cn(
                      'text-xs font-medium truncate',
                      step.status === 'current' ? 'text-blue-700' :
                      step.status === 'completed' ? 'text-green-700' :
                      step.status === 'failed' ? 'text-red-700' : 'text-gray-500'
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {i < workflowSteps.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity timeline */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gebeurtenissen</h3>
        {activitiesLoading ? (
          <div className="flex items-center gap-2 py-4 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Laden...</span>
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">Nog geen gebeurtenissen</p>
        ) : (
          <div className="space-y-0">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0 mt-1.5" />
                  {index < activities.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-gray-900">{activity.summary || activity.event_type}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatTimestamp(activity.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// =============================================================================
// Chat Tab
// =============================================================================

function ChatTab({ messages }: { messages: CollectionMessageResponse[] }) {
  if (messages.length === 0) {
    return <p className="text-sm text-gray-400">Nog geen berichten</p>;
  }

  return (
    <div className="space-y-3">
      {messages.map((msg, i) => {
        if (msg.role === 'system') {
          return (
            <div key={i} className="flex justify-center">
              <span className="text-xs text-gray-500 bg-yellow-50 border border-yellow-100 rounded-full px-3 py-1">
                {msg.message}
              </span>
            </div>
          );
        }

        const isAgent = msg.role === 'agent';

        return (
          <div key={i} className={cn('flex', isAgent ? 'justify-start' : 'justify-end')}>
            <div className={cn(
              'max-w-[85%] rounded-xl px-3.5 py-2.5',
              isAgent
                ? 'bg-gray-100 text-gray-900 rounded-tl-sm'
                : 'bg-blue-600 text-white rounded-tr-sm'
            )}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
              <p className={cn(
                'text-[10px] mt-1',
                isAgent ? 'text-gray-400' : 'text-blue-200'
              )}>
                {isAgent ? 'Agent' : 'Kandidaat'} · {formatTimestamp(msg.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
