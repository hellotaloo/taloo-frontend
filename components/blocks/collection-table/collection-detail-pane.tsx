'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Phone,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  MessageCircle,
  XCircle,
  SkipForward,
  Download,
  ArrowRight,
  User,
  ChevronRight,
} from 'lucide-react';
import { cn, formatTimestamp } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/kit/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCollectionActivities } from '@/lib/document-collection-api';
import type {
  DocumentCollectionFullDetailResponse,
  CollectionDocumentStatusResponse,
  WorkflowStepResponse,
  CollectionPlanStepResponse,
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

const documentStatusConfig: Record<DocumentStatus, { label: string; variant: 'blue' | 'green' | 'orange' | 'red' | 'gray'; icon: React.ReactNode }> = {
  pending:  { label: 'Wachtend',      variant: 'gray',   icon: <Clock className="w-4 h-4 text-gray-400" /> },
  asked:    { label: 'Gevraagd',      variant: 'blue',   icon: <MessageCircle className="w-4 h-4 text-blue-500" /> },
  received: { label: 'Ontvangen',     variant: 'orange',  icon: <Download className="w-4 h-4 text-yellow-500" /> },
  verified: { label: 'Geverifieerd',  variant: 'green',  icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
  failed:   { label: 'Mislukt',       variant: 'red',    icon: <XCircle className="w-4 h-4 text-red-500" /> },
  skipped:  { label: 'Overgeslagen',  variant: 'gray',   icon: <SkipForward className="w-4 h-4 text-gray-400" /> },
};

const documentStatusBg: Record<DocumentStatus, string> = {
  pending:  'bg-gray-50 border-gray-200',
  asked:    'bg-blue-50 border-blue-200',
  received: 'bg-yellow-50 border-yellow-200',
  verified: 'bg-green-50 border-green-200',
  failed:   'bg-red-50 border-red-200',
  skipped:  'bg-gray-50 border-gray-200',
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-900">{collection.candidate_name}</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Subtitle: vacancy + status + progress + channel */}
        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          {collection.vacancy_title && (
            <>
              <span className="truncate max-w-[200px]">{collection.vacancy_title}</span>
              <span className="text-gray-300">·</span>
            </>
          )}
          <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
          <span className="text-gray-300">·</span>
          <span>{collection.documents_collected}/{collection.documents_total} documenten</span>
          <span className="text-gray-300">·</span>
          <span className="capitalize">{collection.channel}</span>
        </div>

        {/* Contact + navigation links */}
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          {collection.candidate_phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{collection.candidate_phone}</span>
            </div>
          )}
          {collection.candidate_id && onNavigateToCandidate && (
            <button
              onClick={() => onNavigateToCandidate(collection.candidate_id!)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <User className="w-3 h-3" />
              Kandidaat
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          {collection.candidacy_id && onNavigateToCandidacy && (
            <button
              onClick={() => onNavigateToCandidacy(collection.candidacy_id!)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FileText className="w-3 h-3" />
              Kandidatuur
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Plan summary */}
        {collection.plan?.summary && (
          <p className="mt-3 text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
            {collection.plan.summary}
          </p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tijdlijn" className="flex-1 flex flex-col min-h-0">
        <TabsList variant="line" className="px-6 shrink-0">
          <TabsTrigger value="tijdlijn">Tijdlijn</TabsTrigger>
          <TabsTrigger value="documenten">Documenten</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="tijdlijn" className="px-6 py-5 space-y-6 mt-0">
            <TijdlijnTab
              workflowSteps={collection.workflow_steps}
              activities={activities}
              activitiesLoading={activitiesLoading}
            />
          </TabsContent>

          <TabsContent value="documenten" className="px-6 py-5 mt-0">
            <DocumentenTab documentStatuses={collection.document_statuses} />
          </TabsContent>

          <TabsContent value="plan" className="px-6 py-5 mt-0">
            <PlanTab steps={collection.plan?.conversation_steps ?? []} />
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
// Documenten Tab
// =============================================================================

function DocumentenTab({ documentStatuses }: { documentStatuses: CollectionDocumentStatusResponse[] }) {
  if (documentStatuses.length === 0) {
    return <p className="text-sm text-gray-400">Geen documenten vereist</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {documentStatuses.map((doc) => {
        const config = documentStatusConfig[doc.status] ?? documentStatusConfig.pending;
        const bg = documentStatusBg[doc.status] ?? documentStatusBg.pending;

        return (
          <div key={doc.slug} className={cn('flex items-center justify-between p-3 rounded-lg border', bg)}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 border border-gray-200">
                {config.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">{config.label}</span>
                  {doc.priority === 'recommended' && (
                    <span className="text-xs text-gray-400 ml-1">(optioneel)</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {doc.verification_passed && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
              {doc.uploaded_at && (
                <span className="text-xs text-gray-400">
                  {formatTimestamp(doc.uploaded_at)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Plan Tab
// =============================================================================

function PlanTab({ steps }: { steps: CollectionPlanStepResponse[] }) {
  if (steps.length === 0) {
    return <p className="text-sm text-gray-400">Geen plan beschikbaar</p>;
  }

  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div key={step.step} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
              {step.step}
            </span>
            <h4 className="text-sm font-semibold text-gray-900">{step.topic}</h4>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{step.message}</p>
          {step.items.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {step.items.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-200 text-gray-600"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
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
