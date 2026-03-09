'use client';

import { X, Phone, FileText, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { cn, formatTimestamp } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/kit/status-badge';
import { getLucideIcon } from '@/lib/ontology-utils';
import type {
  DocumentCollectionDetailResponse,
  DocumentTypeResponse,
  CollectionUploadResponse,
  UploadStatus,
} from '@/lib/types';

interface CollectionDetailPaneProps {
  collection: DocumentCollectionDetailResponse | null;
  isLoading?: boolean;
  onClose?: () => void;
}

const uploadStatusConfig: Record<UploadStatus, { label: string; variant: 'blue' | 'green' | 'orange' | 'red' | 'gray' }> = {
  pending:      { label: 'Wachtend',      variant: 'gray' },
  verified:     { label: 'Geverifieerd',   variant: 'green' },
  rejected:     { label: 'Afgekeurd',      variant: 'red' },
  needs_review: { label: 'Review nodig',   variant: 'orange' },
};

function getStatusIcon(status: UploadStatus) {
  switch (status) {
    case 'pending':      return <Clock className="w-4 h-4 text-gray-400" />;
    case 'verified':     return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'rejected':     return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'needs_review': return <AlertCircle className="w-4 h-4 text-orange-500" />;
  }
}

function getStatusBgColor(status: UploadStatus) {
  switch (status) {
    case 'pending':      return 'bg-gray-50 border-gray-200';
    case 'verified':     return 'bg-green-50 border-green-200';
    case 'rejected':     return 'bg-red-50 border-red-200';
    case 'needs_review': return 'bg-orange-50 border-orange-200';
  }
}

/** Get the best upload status for a document type (verified > needs_review > rejected > pending) */
function getDocumentStatus(uploads: CollectionUploadResponse[]): UploadStatus {
  if (uploads.some(u => u.status === 'verified')) return 'verified';
  if (uploads.some(u => u.status === 'needs_review')) return 'needs_review';
  if (uploads.some(u => u.status === 'rejected')) return 'rejected';
  return 'pending';
}

function buildTimeline(collection: DocumentCollectionDetailResponse) {
  const events: { id: string; event: string; timestamp: string }[] = [];

  // Build a lookup for document type names
  const docTypeMap = new Map(
    collection.documents_required.map(dt => [dt.id, dt.name])
  );

  // Start event
  events.push({
    id: 'started',
    event: 'Collectie gestart',
    timestamp: collection.started_at,
  });

  // Upload events with document names
  collection.uploads.forEach((upload) => {
    const docName = upload.document_type_id
      ? docTypeMap.get(upload.document_type_id) ?? 'Document'
      : 'Document';
    const side = upload.document_side === 'front' ? ' (voorzijde)' :
                 upload.document_side === 'back' ? ' (achterzijde)' : '';

    events.push({
      id: `upload-${upload.id}`,
      event: `${docName}${side} geüpload`,
      timestamp: upload.uploaded_at,
    });

    if (upload.status === 'verified') {
      events.push({
        id: `verified-${upload.id}`,
        event: `${docName}${side} geverifieerd`,
        timestamp: upload.uploaded_at,
      });
    } else if (upload.status === 'rejected') {
      events.push({
        id: `rejected-${upload.id}`,
        event: `${docName}${side} afgekeurd`,
        timestamp: upload.uploaded_at,
      });
    }
  });

  // Completion event
  if (collection.completed_at) {
    events.push({
      id: 'completed',
      event: 'Collectie voltooid',
      timestamp: collection.completed_at,
    });
  }

  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return events;
}

export function CollectionDetailPane({ collection, isLoading, onClose }: CollectionDetailPaneProps) {
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

  // Group uploads by document_type_id
  const uploadsByDocType = new Map<string, CollectionUploadResponse[]>();
  collection.uploads.forEach((upload) => {
    if (upload.document_type_id) {
      const existing = uploadsByDocType.get(upload.document_type_id) ?? [];
      existing.push(upload);
      uploadsByDocType.set(upload.document_type_id, existing);
    }
  });

  const timeline = buildTimeline(collection);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">{collection.candidate_name}</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {collection.candidate_phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{collection.candidate_phone}</span>
            </div>
          )}
          {collection.vacancy_title && (
            <span className="truncate">{collection.vacancy_title}</span>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Status</p>
            <div className="mt-1">
              <StatusBadge
                label={collection.status === 'active' ? 'Actief' :
                       collection.status === 'completed' ? 'Compleet' :
                       collection.status === 'needs_review' ? 'Review nodig' : 'Afgebroken'}
                variant={collection.status === 'active' ? 'blue' :
                         collection.status === 'completed' ? 'green' :
                         collection.status === 'needs_review' ? 'orange' : 'red'}
              />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Documenten</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {collection.documents_collected}/{collection.documents_total}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Berichten</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {collection.message_count}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Documents checklist */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Documenten</h3>
          {collection.documents_required.length === 0 ? (
            <p className="text-sm text-gray-400">Geen documenten vereist</p>
          ) : (
            <div className="space-y-2">
              {collection.documents_required.map((docType) => {
                const uploads = uploadsByDocType.get(docType.id) ?? [];
                const status = uploads.length > 0 ? getDocumentStatus(uploads) : 'pending';
                return (
                  <DocumentRow
                    key={docType.id}
                    docType={docType}
                    status={status}
                    uploads={uploads}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Tijdlijn</h3>
          <div className="space-y-3">
            {timeline.map((event, index) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0 mt-1.5" />
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-gray-900">{event.event}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatTimestamp(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentRow({
  docType,
  status,
  uploads,
}: {
  docType: DocumentTypeResponse;
  status: UploadStatus;
  uploads: CollectionUploadResponse[];
}) {
  const Icon = getLucideIcon(docType.icon);
  const config = uploadStatusConfig[status];
  const latestUpload = uploads.length > 0
    ? uploads.reduce((a, b) => new Date(a.uploaded_at) > new Date(b.uploaded_at) ? a : b)
    : null;

  return (
    <div className={cn('flex items-center justify-between p-3 rounded-lg border', getStatusBgColor(status))}>
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 border border-gray-200">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{docType.name}</p>
          <div className="flex items-center gap-1.5">
            {getStatusIcon(status)}
            <span className="text-xs text-gray-500">{config.label}</span>
            {docType.requires_front_back && (
              <span className="text-xs text-gray-400 ml-1">
                (voor- &amp; achterzijde)
              </span>
            )}
          </div>
        </div>
      </div>
      {latestUpload && (
        <span className="text-xs text-gray-400 shrink-0 ml-2">
          {formatTimestamp(latestUpload.uploaded_at)}
        </span>
      )}
    </div>
  );
}
