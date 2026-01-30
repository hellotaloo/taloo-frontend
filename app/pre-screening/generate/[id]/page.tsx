'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { InterviewQuestionsPanel } from '@/components/chat/InterviewQuestionsPanel';
import { InterviewAssistant } from '@/components/chat/InterviewAssistant';
import { GeneratedQuestion } from '@/components/chat/QuestionListMessage';
import { 
  InterviewDashboard, 
  ApplicationsTable, 
  ApplicationDetailPane,
  Application 
} from '@/components/interview';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  generateInterview, 
  reorderQuestions, 
  SSEEvent, 
  Interview,
  getVacancy,
  getApplications 
} from '@/lib/interview-api';
import { Vacancy, Application as BackendApplication } from '@/lib/types';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Helper to format seconds to "Xm Ys" format
function formatInteractionTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs}s`;
  return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
}

// Convert backend Application to component Application format
function convertToComponentApplication(app: BackendApplication): Application {
  return {
    id: app.id,
    candidateName: app.candidateName,
    interactionTime: formatInteractionTime(app.interactionSeconds),
    interactionSeconds: app.interactionSeconds,
    completed: app.completed,
    qualified: app.qualified,
    timestamp: app.startedAt,
    synced: app.synced,
    channel: app.channel,
    answers: app.answers.map(a => ({
      questionId: a.questionId,
      questionText: a.questionText,
      answer: a.answer,
      passed: a.passed ?? undefined,
    })),
  };
}

export default function GeneratePreScreeningPage({ params }: PageProps) {
  const { id } = use(params);
  
  // Vacancy state
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [isLoadingVacancy, setIsLoadingVacancy] = useState(true);
  const [vacancyError, setVacancyError] = useState<string | null>(null);
  
  // Applications state (for dashboard view)
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  
  // Question generation state
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [isAgentOnline, setIsAgentOnline] = useState(false);
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState<string>('');
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string>('');
  const prevQuestionsRef = useRef<GeneratedQuestion[]>([]);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch vacancy on mount
  useEffect(() => {
    async function fetchVacancy() {
      try {
        setIsLoadingVacancy(true);
        setVacancyError(null);
        const data = await getVacancy(id);
        setVacancy(data);
      } catch (err) {
        console.error('Failed to fetch vacancy:', err);
        setVacancyError('Vacancy not found');
      } finally {
        setIsLoadingVacancy(false);
      }
    }

    fetchVacancy();
  }, [id]);

  // Fetch applications when entering approved state
  useEffect(() => {
    if (!isApproved || !vacancy) return;

    async function fetchApplications() {
      try {
        setIsLoadingApplications(true);
        const data = await getApplications(id);
        setApplications(data.applications.map(convertToComponentApplication));
      } catch (err) {
        console.error('Failed to fetch applications:', err);
        setApplications([]);
      } finally {
        setIsLoadingApplications(false);
      }
    }

    fetchApplications();
  }, [isApproved, vacancy, id]);

  // Set document title when vacancy loads
  useEffect(() => {
    if (vacancy) {
      document.title = `${vacancy.title} - Taloo`;
    }
  }, [vacancy?.title]);

  // Get selected application for detail pane
  const selectedApplication = applications.find(a => a.id === selectedApplicationId) || null;

  // Convert backend Interview to frontend GeneratedQuestion[]
  const convertToFrontendQuestions = useCallback((interview: Interview): GeneratedQuestion[] => {
    return [
      ...interview.knockout_questions.map(q => ({
        id: q.id,
        text: q.question,
        type: 'knockout' as const,
      })),
      ...interview.qualification_questions.map(q => ({
        id: q.id,
        text: q.question,
        type: 'qualifying' as const,
      })),
    ];
  }, []);

  // Handle SSE events for status updates
  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'status') {
      setCurrentStatus(event.message || '');
    }
  }, []);

  // Generate interview questions via backend API with retry logic
  const doGenerateInterview = useCallback(async (existingSessionId?: string) => {
    if (!vacancy) return;
    
    setIsGenerating(true);
    setCurrentStatus('Vacature analyseren...');

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const { interview, sessionId: newSessionId, message } = await generateInterview(
          vacancy.description,
          handleSSEEvent,
          existingSessionId
        );

        setSessionId(newSessionId);
        setInitialMessage(message);
        const frontendQuestions = convertToFrontendQuestions(interview);
        prevQuestionsRef.current = frontendQuestions;
        setQuestions(frontendQuestions);
        setIsGenerated(true);
        setIsGenerating(false);
        setCurrentStatus('');
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Generate interview attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries - 1) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          setCurrentStatus('Opnieuw proberen...');
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          setCurrentStatus('Vacature analyseren...');
        }
      }
    }

    console.error('Failed to generate interview after all retries:', lastError);
    setInitialMessage('Er is een fout opgetreden bij het genereren van de vragen. Controleer of de backend draait en probeer het opnieuw.');
    setIsGenerated(true);
    setIsGenerating(false);
    setCurrentStatus('');
  }, [vacancy, handleSSEEvent, convertToFrontendQuestions]);

  // Auto-generate questions when vacancy loads
  useEffect(() => {
    if (vacancy && !isGenerated && !isGenerating) {
      doGenerateInterview();
    }
  }, [vacancy, isGenerated, isGenerating, doGenerateInterview]);

  // Detect which questions changed and highlight them
  const updateQuestionsWithHighlight = useCallback((newQuestions: GeneratedQuestion[]) => {
    const prevQuestions = prevQuestionsRef.current;
    const changedIds: string[] = [];
    
    newQuestions.forEach(newQ => {
      const prevQ = prevQuestions.find(p => p.id === newQ.id);
      if (!prevQ || prevQ.text !== newQ.text) {
        changedIds.push(newQ.id);
      }
    });
    
    const newIds = newQuestions
      .filter(q => !prevQuestions.some(p => p.id === q.id))
      .map(q => q.id);
    
    const allChangedIds = [...new Set([...changedIds, ...newIds])];
    
    if (allChangedIds.length > 0) {
      setHighlightedIds(allChangedIds);
      
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedIds([]);
      }, 5000);
    }
    
    prevQuestionsRef.current = newQuestions;
    setQuestions(newQuestions);
  }, []);

  const handleQuestionsUpdate = (newQuestions: GeneratedQuestion[]) => {
    updateQuestionsWithHighlight(newQuestions);
  };

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const handleRegenerate = async () => {
    await doGenerateInterview();
  };

  const handleApprove = () => {
    setIsApproved(true);
    setIsAgentOnline(true);
  };

  const handleSelectApplication = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
  };

  const handleCloseDetail = () => {
    setSelectedApplicationId(null);
  };

  const handleQuestionClick = (question: GeneratedQuestion, index: number) => {
    const typeLabel = question.type === 'knockout' ? 'knockout vraag' : 'kwalificatie vraag';
    setPendingPrompt(`Ik heb een vraag over ${typeLabel} ${index}: `);
  };

  const handleReorder = async (reorderedQuestions: GeneratedQuestion[]) => {
    if (!sessionId) {
      setQuestions(reorderedQuestions);
      prevQuestionsRef.current = reorderedQuestions;
      return;
    }

    const previousQuestions = [...questions];
    const previousRef = [...prevQuestionsRef.current];

    setQuestions(reorderedQuestions);
    prevQuestionsRef.current = reorderedQuestions;

    const knockoutOrder = reorderedQuestions
      .filter(q => q.type === 'knockout')
      .map(q => q.id);
    const qualificationOrder = reorderedQuestions
      .filter(q => q.type === 'qualifying')
      .map(q => q.id);

    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await reorderQuestions(sessionId, knockoutOrder, qualificationOrder);
        return;
      } catch (error) {
        console.warn(`Reorder questions attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries - 1) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    console.error('Failed to reorder questions after all retries');
    setQuestions(previousQuestions);
    prevQuestionsRef.current = previousRef;
  };

  if (isLoadingVacancy) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-40px)]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading vacancy...</span>
      </div>
    );
  }

  if (vacancyError || !vacancy) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-40px)]">
        <p className="text-gray-500 mb-4">Vacancy not found</p>
        <Link href="/pre-screening" className="text-blue-500 hover:underline">
          Back to pre-screening
        </Link>
      </div>
    );
  }

  if (isApproved) {
    return (
      <div className="flex h-[calc(100vh-40px)] -m-6">
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900">{vacancy.title}</h1>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-500">{vacancy.company}</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-500">{vacancy.location}</span>
              <span className={`inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                isAgentOnline 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {isAgentOnline ? 'Actief' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsApproved(false)}
                className="gap-1.5 font-normal"
              >
                <Pencil className="w-3.5 h-3.5" />
                Vragen bewerken
              </Button>
              <div className="flex items-center gap-2">
                <label htmlFor="agent-online" className="text-sm text-gray-600">
                  Agent online
                </label>
                <Switch
                  id="agent-online"
                  checked={isAgentOnline}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      setShowOfflineDialog(true);
                    } else {
                      setIsAgentOnline(true);
                    }
                  }}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>
          </div>

          <AlertDialog open={showOfflineDialog} onOpenChange={setShowOfflineDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Agent offline zetten?</AlertDialogTitle>
                <AlertDialogDescription>
                  Als je de agent offline zet, worden nieuwe sollicitaties niet meer automatisch verwerkt. 
                  Kandidaten kunnen dan geen interview meer starten voor deze vacature.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setIsAgentOnline(false);
                    setShowOfflineDialog(false);
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Offline zetten
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {isLoadingApplications ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading applications...</span>
            </div>
          ) : (
            <>
              <InterviewDashboard applications={applications} />
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Sollicitaties</h2>
                <ApplicationsTable 
                  applications={applications}
                  selectedId={selectedApplicationId}
                  onSelectApplication={handleSelectApplication}
                />
              </div>
            </>
          )}
        </div>

        {selectedApplicationId && (
          <div className="hidden lg:flex w-[500px] flex-col border-l border-gray-200 min-h-0">
            <ApplicationDetailPane 
              application={selectedApplication}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] -m-6">
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900">{vacancy.title}</h1>
          <span className="text-sm text-gray-400">•</span>
          <span className="text-sm text-gray-500">{vacancy.company}</span>
          <span className="text-sm text-gray-400">•</span>
          <span className="text-sm text-gray-500">{vacancy.location}</span>
          <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            Concept
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="agent-online-edit" className="text-sm text-gray-400">
            Agent online
          </label>
          <Switch
            id="agent-online-edit"
            checked={isAgentOnline}
            disabled
            className="data-[state=checked]:bg-green-500"
          />
        </div>
      </div>

      <div className="border-t border-gray-200" />

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto p-6 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-[720px] -mt-3">
            <InterviewQuestionsPanel 
              questions={questions} 
              isGenerating={isGenerating}
              highlightedIds={highlightedIds}
              onQuestionClick={handleQuestionClick}
              onReorder={handleReorder}
            />
          </div>
        </div>

        <div className="hidden lg:flex w-[500px] flex-col border-l border-gray-200 min-h-0">
          <InterviewAssistant
            vacancyTitle={vacancy.title}
            vacancyText={vacancy.description}
            isGenerated={isGenerated}
            isGenerating={isGenerating}
            sessionId={sessionId}
            currentStatus={currentStatus}
            initialMessage={initialMessage}
            onRegenerate={handleRegenerate}
            onQuestionsUpdate={handleQuestionsUpdate}
            onApprove={handleApprove}
            externalPrompt={pendingPrompt}
            onExternalPromptConsumed={() => setPendingPrompt('')}
          />
        </div>
      </div>
    </div>
  );
}
