'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import {
  InterviewQuestionsPanel,
  InterviewAssistant,
  GeneratedQuestion,
} from '@/components/blocks/interview-editor';
import {
  InterviewDashboard,
  ApplicationsTable,
  ApplicationDetailPane,
  Application
} from '@/components/blocks/application-dashboard';
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
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import {
  generateInterview,
  reorderQuestions, 
  SSEEvent, 
  Interview,
  PreScreening,
  getVacancy,
  getPreScreening,
  savePreScreening 
} from '@/lib/interview-api';
import { Vacancy } from '@/lib/types';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Mock application data for the approved state (will be replaced with real API later)
const mockApplications: Application[] = [];

export default function GenerateInterviewPage({ params }: PageProps) {
  const { id } = use(params);
  
  // Vacancy state
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [isLoadingVacancy, setIsLoadingVacancy] = useState(true);
  const [vacancyError, setVacancyError] = useState<string | null>(null);
  
  // Pre-screening state
  const [existingPreScreening, setExistingPreScreening] = useState<PreScreening | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
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
          
          // Set session ID for AI editing - always use vacancy ID since session_id === vacancy_id
          // The backend auto-creates the session when fetching pre-screening
          setSessionId(id);
          
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
        setVacancyError('Vacancy not found');
      } finally {
        setIsLoadingVacancy(false);
      }
    }

    fetchVacancyAndPreScreening();
  }, [id]);

  // Set document title when vacancy loads
  useEffect(() => {
    if (vacancy) {
      document.title = `${vacancy.title} - Taloo`;
    }
  }, [vacancy?.title]);
  
  // Get selected application for detail pane
  const selectedApplication = mockApplications.find(a => a.id === selectedApplicationId) || null;

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
        return; // Success, exit the function
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Generate interview attempt ${attempt + 1} failed:`, error);
        
        // If we have more retries, wait with exponential backoff before trying again
        if (attempt < maxRetries - 1) {
          const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          setCurrentStatus('Opnieuw proberen...');
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          setCurrentStatus('Data verzamelen...');
        }
      }
    }

    // All retries failed
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
    
    // Find changed or new questions
    const changedIds: string[] = [];
    
    newQuestions.forEach(newQ => {
      const prevQ = prevQuestions.find(p => p.id === newQ.id);
      // Highlight if it's new or if the text changed
      if (!prevQ || prevQ.text !== newQ.text) {
        changedIds.push(newQ.id);
      }
    });
    
    // Also highlight questions with new IDs (completely new questions)
    const newIds = newQuestions
      .filter(q => !prevQuestions.some(p => p.id === q.id))
      .map(q => q.id);
    
    const allChangedIds = [...new Set([...changedIds, ...newIds])];
    
    if (allChangedIds.length > 0) {
      setHighlightedIds(allChangedIds);
      
      // Clear any existing timeout
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      
      // Remove highlights after 5 seconds
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedIds([]);
      }, 5000);
    }
    
    // Update the ref for next comparison
    prevQuestionsRef.current = newQuestions;
    setQuestions(newQuestions);
  }, []);

  const handleQuestionsUpdate = (newQuestions: GeneratedQuestion[]) => {
    updateQuestionsWithHighlight(newQuestions);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const handleRegenerate = async () => {
    // Regenerate by calling the API again (without session to get fresh questions)
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
      
      await savePreScreening(vacancy.id, {
        intro,
        knockout_questions: knockoutQuestions,
        knockout_failed_action: knockoutFailedAction,
        qualification_questions: qualificationQuestions,
        final_action: finalAction,
        approved_ids: questions.map(q => q.id), // All current questions are approved
      });
      
      setIsApproved(true);
      setIsAgentOnline(true);
    } catch (error) {
      console.error('Failed to save pre-screening:', error);
      // Show error in UI - the component will stay in edit mode
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
    // Don't call API if no session yet
    if (!sessionId) {
      setQuestions(reorderedQuestions);
      prevQuestionsRef.current = reorderedQuestions;
      return;
    }

    // Save current state for rollback
    const previousQuestions = [...questions];
    const previousRef = [...prevQuestionsRef.current];

    // Optimistic update - update UI immediately
    setQuestions(reorderedQuestions);
    prevQuestionsRef.current = reorderedQuestions;

    // Extract the knockout and qualification order arrays
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
        return; // Success, exit the function
      } catch (error) {
        console.warn(`Reorder questions attempt ${attempt + 1} failed:`, error);
        
        // If we have more retries, wait with exponential backoff before trying again
        if (attempt < maxRetries - 1) {
          const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    // All retries failed - rollback
    console.error('Failed to reorder questions after all retries');
    setQuestions(previousQuestions);
    prevQuestionsRef.current = previousRef;
  };

  // Loading state
  if (isLoadingVacancy) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-40px)]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Vacature laden...</span>
      </div>
    );
  }

  // Error/not found state
  if (vacancyError || !vacancy) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-40px)]">
        <p className="text-gray-500 mb-4">Vacature niet gevonden</p>
        <Link href="/interviews" className="text-blue-500 hover:underline">
          Terug naar vacatures
        </Link>
      </div>
    );
  }

  // Approved state - Dashboard view
  if (isApproved) {
    return (
      <div className="flex h-[calc(100vh-40px)] -m-6">
        {/* Left column - Dashboard */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {/* Header with vacancy info */}
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

          {/* Offline confirmation dialog */}
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

          {/* Dashboard widgets */}
          <InterviewDashboard applications={mockApplications} />

          {/* Applications table */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Sollicitaties</h2>
            <ApplicationsTable 
              applications={mockApplications}
              selectedId={selectedApplicationId}
              onSelectApplication={handleSelectApplication}
            />
          </div>
        </div>

        {/* Right column - Detail pane (slides in when application selected) */}
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

  // Editing state - Flow builder view
  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center justify-between">
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
      </PageLayoutHeader>
      <PageLayoutContent
        sidebar={
          <InterviewAssistant
            vacancyTitle={vacancy.title}
            vacancyText={vacancy.description}
            isGenerated={isGenerated}
            isGenerating={isGenerating}
            isSaving={isSaving}
            sessionId={sessionId}
            currentStatus={currentStatus}
            generationThinkingContent={thinkingContent}
            initialMessage={initialMessage}
            onRegenerate={handleRegenerate}
            onQuestionsUpdate={handleQuestionsUpdate}
            externalPrompt={pendingPrompt}
            onExternalPromptConsumed={() => setPendingPrompt('')}
          />
        }
        sidebarWidth={500}
      >
        <div className="max-w-[720px] -mt-3">
            <InterviewQuestionsPanel 
              questions={questions} 
              isGenerating={isGenerating}
              highlightedIds={highlightedIds}
              onQuestionClick={handleQuestionClick}
              onReorder={handleReorder}
            />
          </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
