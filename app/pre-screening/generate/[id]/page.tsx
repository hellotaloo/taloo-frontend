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
import { IPhoneMockup } from '@/components/testing/IPhoneMockup';
import { WhatsAppChat } from '@/components/testing/WhatsAppChat';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Loader2, Phone, MessageSquare } from 'lucide-react';
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
  PreScreening,
  getVacancy,
  getApplications,
  getPreScreening,
  savePreScreening 
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
    interactionTime: app.channel === 'cv' || app.status !== 'completed' ? '-' : formatInteractionTime(app.interactionSeconds),
    interactionSeconds: app.interactionSeconds,
    status: app.status,
    qualified: app.qualified,
    timestamp: app.startedAt,
    synced: app.synced,
    channel: app.channel,
    answers: app.answers.map(a => ({
      questionId: a.questionId,
      questionText: a.questionText,
      questionType: a.questionType,
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
  
  // Pre-screening state
  const [existingPreScreening, setExistingPreScreening] = useState<PreScreening | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
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
  const [thinkingContent, setThinkingContent] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState<string>('');
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string>('');
  const [rightPanelView, setRightPanelView] = useState<'assistant' | 'whatsapp'>('assistant');
  const prevQuestionsRef = useRef<GeneratedQuestion[]>([]);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch vacancy and check for existing pre-screening on mount
  useEffect(() => {
    async function fetchVacancyAndPreScreening() {
      try {
        setIsLoadingVacancy(true);
        setVacancyError(null);
        
        // Fetch vacancy and pre-screening in parallel
        const [vacancyData, preScreeningData] = await Promise.all([
          getVacancy(id),
          getPreScreening(id),
        ]);
        
        setVacancy(vacancyData);
        
        // If we have an existing pre-screening, load the questions from it
        if (preScreeningData) {
          setExistingPreScreening(preScreeningData);
          
          // Convert pre-screening questions to frontend format
          const loadedQuestions: GeneratedQuestion[] = [
            ...preScreeningData.knockout_questions.map(q => ({
              id: q.id,
              text: q.question_text,
              type: 'knockout' as const,
            })),
            ...preScreeningData.qualification_questions.map(q => ({
              id: q.id,
              text: q.question_text,
              type: 'qualifying' as const,
            })),
          ];
          
          setQuestions(loadedQuestions);
          prevQuestionsRef.current = loadedQuestions;
          setIsGenerated(true);
          setInitialMessage('Je hebt al een pre-screening configuratie opgeslagen. Je kunt de vragen hieronder bekijken en bewerken.');
          // If vacancy has pre-screening, it means it was approved before
          setIsApproved(true);
          setIsAgentOnline(vacancyData.status === 'agent_created');
        }
      } catch (err) {
        console.error('Failed to fetch vacancy:', err);
        setVacancyError('Vacature niet gevonden');
      } finally {
        setIsLoadingVacancy(false);
      }
    }

    fetchVacancyAndPreScreening();
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
        isModified: q.is_modified,
        changeStatus: q.change_status,
      })),
      ...interview.qualification_questions.map(q => ({
        id: q.id,
        text: q.question,
        type: 'qualifying' as const,
        idealAnswer: q.ideal_answer,
        isModified: q.is_modified,
        changeStatus: q.change_status,
      })),
    ];
  }, []);

  // Handle SSE events for status and thinking updates
  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'status') {
      // Only update status if we already have thinking content,
      // otherwise keep showing "Data verzamelen..."
      setThinkingContent(prev => {
        if (prev.length > 0) {
          // We have thinking content, update the status
          setCurrentStatus(event.message || 'Analyseren...');
        }
        return prev;
      });
    } else if (event.type === 'thinking') {
      // Append thinking content as it streams in
      setThinkingContent(prev => {
        const newContent = prev + (event.content || '');
        // When first thinking content arrives, update status to "Analyseren"
        if (prev.length === 0 && newContent.length > 0) {
          setCurrentStatus('Analyseren...');
        }
        return newContent;
      });
    }
  }, []);

  // Generate interview questions via backend API with retry logic
  const doGenerateInterview = useCallback(async (existingSessionId?: string) => {
    if (!vacancy) return;
    
    setIsGenerating(true);
    setCurrentStatus('Data verzamelen...');
    setThinkingContent(''); // Reset thinking content for new generation

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
        // Clear changeStatus on initial generation - we only want to show the effect after feedback
        const questionsWithoutChangeStatus = frontendQuestions.map(q => ({
          ...q,
          changeStatus: undefined,
        }));
        prevQuestionsRef.current = questionsWithoutChangeStatus;
        setQuestions(questionsWithoutChangeStatus);
        setIsGenerated(true);
        setIsGenerating(false);
        setCurrentStatus('');
        setThinkingContent(''); // Clear thinking content on success
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Generate interview attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries - 1) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          setCurrentStatus('Opnieuw proberen...');
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          setCurrentStatus('Data verzamelen...');
        }
      }
    }

    console.error('Failed to generate interview after all retries:', lastError);
    setInitialMessage('Er is een fout opgetreden bij het genereren van de vragen. Controleer of de backend draait en probeer het opnieuw.');
    setIsGenerated(true);
    setIsGenerating(false);
    setCurrentStatus('');
    setThinkingContent(''); // Clear thinking content on error
  }, [vacancy, handleSSEEvent, convertToFrontendQuestions]);

  // Auto-generate questions when vacancy loads (only if no existing pre-screening)
  useEffect(() => {
    if (vacancy && !isGenerated && !isGenerating && !existingPreScreening) {
      doGenerateInterview();
    }
  }, [vacancy, isGenerated, isGenerating, existingPreScreening, doGenerateInterview]);

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

  const handleApprove = async () => {
    if (!vacancy) return;
    
    setIsSaving(true);
    
    try {
      // Build the pre-screening config from current questions
      const knockoutQuestions = questions
        .filter(q => q.type === 'knockout')
        .map(q => ({ id: q.id, question: q.text }));
      
      const qualificationQuestions = questions
        .filter(q => q.type === 'qualifying')
        .map(q => ({ id: q.id, question: q.text }));
      
      // Get intro and actions from existing config or use defaults
      const intro = existingPreScreening?.intro || 
        "Hallo! Leuk dat je solliciteert. Ben je klaar voor een paar korte vragen?";
      const knockoutFailedAction = existingPreScreening?.knockout_failed_action || 
        "Helaas voldoe je niet aan de basisvereisten. Interesse in andere matches?";
      const finalAction = existingPreScreening?.final_action || 
        "Perfect! We plannen een gesprek met de recruiter.";
      
      console.log('Saving pre-screening to database...');
      
      await savePreScreening(vacancy.id, {
        intro,
        knockout_questions: knockoutQuestions,
        knockout_failed_action: knockoutFailedAction,
        qualification_questions: qualificationQuestions,
        final_action: finalAction,
        approved_ids: questions.map(q => q.id),
      });
      
      console.log('Pre-screening saved successfully!');
      
      setIsApproved(true);
      setIsAgentOnline(true);
    } catch (error) {
      console.error('Failed to save pre-screening:', error);
      alert(error instanceof Error ? error.message : 'Opslaan mislukt. Probeer het opnieuw.');
    } finally {
      setIsSaving(false);
    }
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
        <span className="ml-2 text-gray-500">Vacature laden...</span>
      </div>
    );
  }

  if (vacancyError || !vacancy) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-40px)]">
        <p className="text-gray-500 mb-4">Vacature niet gevonden</p>
        <Link href="/pre-screening" className="text-blue-500 hover:underline">
          Terug naar pre-screening
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
              <span className="ml-2 text-gray-500">Sollicitaties laden...</span>
            </div>
          ) : (
            <>
              <InterviewDashboard applications={applications} />
              <div>
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
        <div className="flex items-center gap-4">
          {/* Test interview toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Test sollicitatie:</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                onClick={() => setRightPanelView('assistant')}
                className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  rightPanelView === 'assistant'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Phone className="w-4 h-4" />
                Bellen
              </button>
              <button
                onClick={() => setRightPanelView('whatsapp')}
                className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  rightPanelView === 'whatsapp'
                    ? 'bg-[#25D366] text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </button>
            </div>
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
      </div>

      <div className="border-t border-gray-200" />

      <div className="flex flex-1 min-h-0">
        {/* Questions panel - 50% */}
        <div className="w-1/2 overflow-y-auto p-6 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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

        {/* Phone mockup - 50% */}
        <div className="hidden lg:flex w-1/2 flex-col border-l border-gray-200 min-h-0 items-center justify-center bg-gray-50 p-6">
          <div className="transform scale-[0.85] origin-center">
            <IPhoneMockup>
              <WhatsAppChat />
            </IPhoneMockup>
          </div>
        </div>
      </div>
    </div>
  );
}
