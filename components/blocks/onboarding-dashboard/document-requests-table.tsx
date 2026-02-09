'use client';

import { FileText, CheckCircle2, Clock, AlertCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type RequestStatus = 'pending' | 'collecting' | 'complete' | 'incomplete';

export interface DocumentRequest {
  id: string;
  candidateName: string;
  requestSentAt: string;
  status: RequestStatus;
  documentsCollected: number;
  totalDocuments: number;
}

interface DocumentRequestsTableProps {
  requests: DocumentRequest[];
  onSelectRequest?: (requestId: string) => void;
  selectedRequestId?: string | null;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusBadge(status: RequestStatus) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case 'collecting':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          <FileText className="w-3 h-3" />
          Bezig
        </span>
      );
    case 'complete':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3" />
          Compleet
        </span>
      );
    case 'incomplete':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
          <AlertCircle className="w-3 h-3" />
          Incompleet
        </span>
      );
  }
}

export function DocumentRequestsTable({
  requests,
  onSelectRequest,
  selectedRequestId,
}: DocumentRequestsTableProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">Nog geen documenten verzocht.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kandidaat</TableHead>
          <TableHead>Verzonden</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Documenten</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow
            key={request.id}
            data-testid={`document-request-row-${request.id}`}
            className={cn(
              'cursor-pointer transition-colors',
              selectedRequestId === request.id && 'bg-gray-50'
            )}
            onClick={() => onSelectRequest?.(request.id)}
          >
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <span className="font-medium text-gray-900">{request.candidateName}</span>
              </div>
            </TableCell>
            <TableCell className="text-gray-500 text-sm">
              {formatDate(request.requestSentAt)}
            </TableCell>
            <TableCell>{getStatusBadge(request.status)}</TableCell>
            <TableCell className="text-right">
              <span className="text-sm font-medium text-gray-900">
                {request.documentsCollected}/{request.totalDocuments}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
