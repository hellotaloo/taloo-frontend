'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Smartphone, LayoutDashboard, Loader2 } from 'lucide-react';
import { Vacancy } from '@/lib/types';
import { getVacancy } from '@/lib/interview-api';
import {
  DocumentConfigurationPanel,
  DocumentAssistant,
  DocumentConfig,
} from '@/components/blocks/onboarding-editor';
import {
  DashboardMetrics,
  DocumentRequestsTable,
  RequestDetailPane,
  DashboardMetricsType,
  DocumentRequest,
  RequestDetail,
} from '@/components/blocks/onboarding-dashboard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Dummy data for documents
const DUMMY_DOCUMENTS: DocumentConfig[] = [
  {
    id: '1',
    type: 'id_card',
    displayName: 'ID Kaart',
    required: true,
    verificationMethod: 'auto',
    position: 1,
    enabled: true,
  },
  {
    id: '2',
    type: 'drivers_license',
    displayName: 'Rijbewijs',
    required: true,
    verificationMethod: 'manual',
    position: 2,
    enabled: true,
  },
  {
    id: '3',
    type: 'bank_card',
    displayName: 'Bankkaart',
    required: true,
    verificationMethod: 'auto',
    position: 3,
    enabled: true,
  },
];

// Dummy data for dashboard
const DUMMY_METRICS: DashboardMetricsType = {
  totalRequests: 12,
  completionRate: 75,
  verificationPending: 3,
  averageCollectionTime: 2.5,
};

const DUMMY_DOCUMENT_REQUESTS: DocumentRequest[] = [
  {
    id: '1',
    candidateName: 'Jan Janssen',
    requestSentAt: '2026-01-15T10:30:00',
    status: 'complete',
    documentsCollected: 3,
    totalDocuments: 3,
  },
  {
    id: '2',
    candidateName: 'Marie Peeters',
    requestSentAt: '2026-01-18T14:20:00',
    status: 'collecting',
    documentsCollected: 2,
    totalDocuments: 3,
  },
  {
    id: '3',
    candidateName: 'Tom De Vries',
    requestSentAt: '2026-01-20T09:15:00',
    status: 'pending',
    documentsCollected: 0,
    totalDocuments: 3,
  },
  {
    id: '4',
    candidateName: 'Lisa Van Damme',
    requestSentAt: '2026-01-22T16:45:00',
    status: 'incomplete',
    documentsCollected: 1,
    totalDocuments: 3,
  },
];

const DUMMY_REQUEST_DETAILS: Record<string, RequestDetail> = {
  '1': {
    id: '1',
    candidateName: 'Jan Janssen',
    candidateEmail: 'jan.janssen@example.com',
    candidatePhone: '+32 475 12 34 56',
    requestSentAt: '2026-01-15T10:30:00',
    documents: [
      {
        id: 'd1',
        type: 'id_card',
        displayName: 'ID Kaart',
        status: 'verified',
        uploadedAt: '2026-01-15T14:20:00',
        verifiedAt: '2026-01-15T14:25:00',
        downloadUrl: '#',
      },
      {
        id: 'd2',
        type: 'drivers_license',
        displayName: 'Rijbewijs',
        status: 'verified',
        uploadedAt: '2026-01-16T09:10:00',
        verifiedAt: '2026-01-16T09:30:00',
        downloadUrl: '#',
      },
      {
        id: 'd3',
        type: 'bank_card',
        displayName: 'Bankkaart',
        status: 'verified',
        uploadedAt: '2026-01-16T10:05:00',
        verifiedAt: '2026-01-16T10:10:00',
        downloadUrl: '#',
      },
    ],
    timeline: [
      { id: 't1', event: 'Verzoek verzonden', timestamp: '2026-01-15T10:30:00' },
      { id: 't2', event: 'ID Kaart geüpload', timestamp: '2026-01-15T14:20:00' },
      { id: 't3', event: 'ID Kaart geverifieerd', timestamp: '2026-01-15T14:25:00' },
      { id: 't4', event: 'Rijbewijs geüpload', timestamp: '2026-01-16T09:10:00' },
      { id: 't5', event: 'Rijbewijs geverifieerd', timestamp: '2026-01-16T09:30:00' },
      { id: 't6', event: 'Bankkaart geüpload', timestamp: '2026-01-16T10:05:00' },
      { id: 't7', event: 'Bankkaart geverifieerd', timestamp: '2026-01-16T10:10:00' },
      { id: 't8', event: 'Alle documenten compleet', timestamp: '2026-01-16T10:10:00' },
    ],
  },
  '2': {
    id: '2',
    candidateName: 'Marie Peeters',
    candidateEmail: 'marie.peeters@example.com',
    requestSentAt: '2026-01-18T14:20:00',
    documents: [
      {
        id: 'd1',
        type: 'id_card',
        displayName: 'ID Kaart',
        status: 'verified',
        uploadedAt: '2026-01-18T16:30:00',
        verifiedAt: '2026-01-18T16:35:00',
        downloadUrl: '#',
      },
      {
        id: 'd2',
        type: 'drivers_license',
        displayName: 'Rijbewijs',
        status: 'uploaded',
        uploadedAt: '2026-01-19T11:20:00',
      },
      {
        id: 'd3',
        type: 'bank_card',
        displayName: 'Bankkaart',
        status: 'pending',
      },
    ],
    timeline: [
      { id: 't1', event: 'Verzoek verzonden', timestamp: '2026-01-18T14:20:00' },
      { id: 't2', event: 'ID Kaart geüpload', timestamp: '2026-01-18T16:30:00' },
      { id: 't3', event: 'ID Kaart geverifieerd', timestamp: '2026-01-18T16:35:00' },
      { id: 't4', event: 'Rijbewijs geüpload', timestamp: '2026-01-19T11:20:00' },
    ],
  },
  '3': {
    id: '3',
    candidateName: 'Tom De Vries',
    candidateEmail: 'tom.devries@example.com',
    candidatePhone: '+32 476 98 76 54',
    requestSentAt: '2026-01-20T09:15:00',
    documents: [
      {
        id: 'd1',
        type: 'id_card',
        displayName: 'ID Kaart',
        status: 'pending',
      },
      {
        id: 'd2',
        type: 'drivers_license',
        displayName: 'Rijbewijs',
        status: 'pending',
      },
      {
        id: 'd3',
        type: 'bank_card',
        displayName: 'Bankkaart',
        status: 'pending',
      },
    ],
    timeline: [
      { id: 't1', event: 'Verzoek verzonden', timestamp: '2026-01-20T09:15:00' },
    ],
  },
  '4': {
    id: '4',
    candidateName: 'Lisa Van Damme',
    candidateEmail: 'lisa.vandamme@example.com',
    requestSentAt: '2026-01-22T16:45:00',
    documents: [
      {
        id: 'd1',
        type: 'id_card',
        displayName: 'ID Kaart',
        status: 'rejected',
        uploadedAt: '2026-01-23T10:15:00',
      },
      {
        id: 'd2',
        type: 'drivers_license',
        displayName: 'Rijbewijs',
        status: 'pending',
      },
      {
        id: 'd3',
        type: 'bank_card',
        displayName: 'Bankkaart',
        status: 'pending',
      },
    ],
    timeline: [
      { id: 't1', event: 'Verzoek verzonden', timestamp: '2026-01-22T16:45:00' },
      { id: 't2', event: 'ID Kaart geüpload', timestamp: '2026-01-23T10:15:00' },
      { id: 't3', event: 'ID Kaart afgekeurd - onduidelijke foto', timestamp: '2026-01-23T10:20:00' },
    ],
  },
};

type ViewMode = 'edit' | 'preview' | 'dashboard';

export default function PreOnboardingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const vacancyId = resolvedParams.id;

  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [documents, setDocuments] = useState<DocumentConfig[]>(DUMMY_DOCUMENTS);
  const [isLoading, setIsLoading] = useState(true);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Load vacancy data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const vacancyData = await getVacancy(vacancyId);
        setVacancy(vacancyData);
        // Simulate loading delay
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Failed to load vacancy:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [vacancyId]);

  const handleBack = () => {
    router.push('/pre-onboarding');
  };

  const handleToggleDocument = (documentId: string, enabled: boolean) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === documentId ? { ...doc, enabled } : doc))
    );
  };

  const handleReorder = (reorderedDocuments: DocumentConfig[]) => {
    setDocuments(reorderedDocuments);
  };

  const handlePublish = () => {
    // Simulate publish
    setPublishedAt(new Date().toISOString());
    // Navigate to dashboard view
    setViewMode('dashboard');
    console.log('Publishing pre-onboarding documents...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Pre-onboarding laden...</p>
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">Vacature niet gevonden</p>
          <Button onClick={handleBack} className="mt-4">
            Terug naar overzicht
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] -m-6">
      {/* Header - Fixed */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{vacancy.title}</h1>
            <p className="text-sm text-gray-500">
              {vacancy.company} • {vacancy.location}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="inline-flex items-center rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'dashboard'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overzicht
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'edit'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Pencil className="w-4 h-4" />
              Vragen
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'preview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Smartphone className="w-4 h-4" />
              Simulatie
            </button>
          </div>

          {/* Publish Button */}
          <Button
            onClick={handlePublish}
            className="gap-2 bg-green-500 hover:bg-green-600"
          >
            {publishedAt ? 'Gepubliceerd' : 'Publiceren'}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Edit View */}
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300 flex',
            viewMode === 'edit' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          )}
        >
          <DocumentConfigurationPanel
            documents={documents}
            readOnly={false}
            onToggleDocument={handleToggleDocument}
            onReorder={handleReorder}
          />

          {/* AI Assistant - 500px */}
          <div className="w-[500px] shrink-0 flex flex-col border-l border-gray-200 min-h-0">
            <DocumentAssistant vacancy={vacancy} />
          </div>
        </div>

        {/* Preview View */}
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300 flex items-center justify-center bg-white',
            viewMode === 'preview' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          )}
        >
          <div className="text-center text-gray-500">
            <Smartphone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Preview Mode</h3>
            <p className="text-sm">Document collection simulation coming soon...</p>
          </div>
        </div>

        {/* Dashboard View */}
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300 bg-gray-50 flex flex-col',
            viewMode === 'dashboard' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          )}
        >
          {/* Metrics */}
          <div className="px-6 pt-6 shrink-0">
            <DashboardMetrics metrics={DUMMY_METRICS} />
          </div>

          {/* Table and Detail Pane */}
          <div className="flex-1 flex gap-6 px-6 py-6 min-h-0">
            {/* Requests Table */}
            <div className="flex-1 bg-white rounded-lg border overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">Documentverzoeken</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {DUMMY_DOCUMENT_REQUESTS.length} actieve verzoeken
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <DocumentRequestsTable
                  requests={DUMMY_DOCUMENT_REQUESTS}
                  onSelectRequest={setSelectedRequestId}
                  selectedRequestId={selectedRequestId}
                />
              </div>
            </div>

            {/* Detail Pane */}
            <div className="w-[400px] bg-white rounded-lg border overflow-hidden shrink-0">
              <RequestDetailPane
                request={selectedRequestId ? DUMMY_REQUEST_DETAILS[selectedRequestId] : null}
                onClose={() => setSelectedRequestId(null)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
