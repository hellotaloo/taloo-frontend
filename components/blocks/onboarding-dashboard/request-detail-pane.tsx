'use client';

import { CheckCircle2, Clock, AlertCircle, X, Download, FileText, User, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type DocumentStatus = 'pending' | 'uploaded' | 'verified' | 'rejected';

export interface DocumentDetail {
  id: string;
  type: string;
  displayName: string;
  status: DocumentStatus;
  uploadedAt?: string;
  verifiedAt?: string;
  downloadUrl?: string;
}

export interface RequestDetail {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  requestSentAt: string;
  documents: DocumentDetail[];
  timeline: Array<{
    id: string;
    event: string;
    timestamp: string;
  }>;
}

interface RequestDetailPaneProps {
  request: RequestDetail | null;
  onClose?: () => void;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDocumentStatusIcon(status: DocumentStatus) {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-gray-400" />;
    case 'uploaded':
      return <FileText className="w-4 h-4 text-blue-500" />;
    case 'verified':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'rejected':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
  }
}

function getDocumentStatusLabel(status: DocumentStatus) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'uploaded':
      return 'Geüpload';
    case 'verified':
      return 'Geverifieerd';
    case 'rejected':
      return 'Afgekeurd';
  }
}

export function RequestDetailPane({ request, onClose }: RequestDetailPaneProps) {
  if (!request) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Selecteer een verzoek om details te bekijken</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-l">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{request.candidateName}</h2>
          <p className="text-sm text-gray-500">Verzonden {formatDate(request.requestSentAt)}</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Candidate Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Contactgegevens</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{request.candidateEmail}</span>
            </div>
            {request.candidatePhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{request.candidatePhone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Documents Checklist */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Documenten</h3>
          <div className="space-y-2">
            {request.documents.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-colors',
                  doc.status === 'verified' && 'bg-green-50 border-green-200',
                  doc.status === 'uploaded' && 'bg-blue-50 border-blue-200',
                  doc.status === 'rejected' && 'bg-red-50 border-red-200',
                  doc.status === 'pending' && 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getDocumentStatusIcon(doc.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.displayName}</p>
                    <p className="text-xs text-gray-500">{getDocumentStatusLabel(doc.status)}</p>
                  </div>
                </div>
                {doc.downloadUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => window.open(doc.downloadUrl, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Tijdlijn</h3>
          <div className="space-y-3">
            {request.timeline.map((event, index) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0 mt-1.5" />
                  {index < request.timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-gray-900">{event.event}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
