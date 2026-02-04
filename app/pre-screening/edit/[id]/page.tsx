'use client';

import { use, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InterviewQuestionsPanel } from '@/components/chat/InterviewQuestionsPanel';
import { InterviewAssistant } from '@/components/chat/InterviewAssistant';
import { GeneratedQuestion } from '@/components/chat/QuestionListMessage';
import { IPhoneMockup } from '@/components/testing/IPhoneMockup';
import { WhatsAppChat, ChatScenario } from '@/components/testing/WhatsAppChat';
import { 
  InterviewDashboard, 
  ApplicationsTable, 
  ApplicationDetailPane,
  Application 
} from '@/components/interview';
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
import { Loader2, ArrowLeft, CheckCircle, Pencil, Smartphone, RotateCcw, LayoutDashboard } from 'lucide-react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { 
  generateInterview, 
  reorderQuestions,
  addQuestion,
  deleteQuestion,
  SSEEvent, 
  Interview,
  PreScreening,
  PreScreeningInput,
  getVacancy,
  getPreScreening,
  getApplications,
  savePreScreening,
  publishPreScreening,
  updatePreScreeningStatus,
  updateChannelStatus,
} from '@/lib/interview-api';
import { PublishDialog, PublishChannels } from '@/components/pre-screening/PublishDialog';
import { TriggerInterviewDialog } from '@/components/pre-screening/TriggerInterviewDialog';
import { ChannelStatusPopover } from '@/components/pre-screening/ChannelStatusPopover';
import { toast } from 'sonner';
import { Vacancy } from '@/lib/types';
import { convertToComponentApplication } from '@/lib/pre-screening-utils';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPreScreeningPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Vacancy state
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [isLoadingVacancy, setIsLoadingVacancy] = useState(true);
  const [vacancyError, setVacancyError] = useState<string | null>(null);
  
  // Pre-screening state
  const [existingPreScreening, setExistingPreScreening] = useState<PreScreening | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Publishing state
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  
  // Channel status state (derived from agent IDs or channels object)
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [cvEnabled, setCvEnabled] = useState(false);
  
  // Question generation state
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [thinkingContent, setThinkingContent] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState<string>('');
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string>('');
  const [chatScenario, setChatScenario] = useState<ChatScenario>('manual');
  const [chatResetKey, setChatResetKey] = useState(0);
  const [viewMode, setViewMode] = useState<'dashboard' | 'edit' | 'preview'>('edit');
  
  // Dashboard state
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  
  // Dialog state
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [showTriggerInterviewDialog, setShowTriggerInterviewDialog] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  
  const prevQuestionsRef = useRef<GeneratedQuestion[]>([]);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Detect if there are unsaved changes by comparing current questions with saved pre-screening
  const hasUnsavedChanges = useMemo(() => {
    // If no existing pre-screening, any questions are "unsaved"
    if (!existingPreScreening) return questions.length > 0;
    
    const savedKnockout = existingPreScreening.knockout_questions;
    const savedQualifying = existingPreScreening.qualification_questions;
    
    const currentKnockout = questions.filter(q => q.type === 'knockout');
    const currentQualifying = questions.filter(q => q.type === 'qualifying');
    
    // Check knockout questions
    if (savedKnockout.length !== currentKnockout.length) return true;
    for (let i = 0; i < savedKnockout.length; i++) {
      if (savedKnockout[i].id !== currentKnockout[i].id) return true;
      if (savedKnockout[i].question_text !== currentKnockout[i].text) return true;
    }
    
    // Check qualifying questions
    if (savedQualifying.length !== currentQualifying.length) return true;
    for (let i = 0; i < savedQualifying.length; i++) {
      if (savedQualifying[i].id !== currentQualifying[i].id) return true;
      if (savedQualifying[i].question_text !== currentQualifying[i].text) return true;
      if (savedQualifying[i].ideal_answer !== currentQualifying[i].idealAnswer) return true;
    }
    
    return false;
  }, [existingPreScreening, questions]);

  // Handle navigation with unsaved changes check
  const handleNavigateAway = useCallback((navigateFn: () => void) => {
    if (hasUnsavedChanges) {
      pendingNavigationRef.current = navigateFn;
      setShowUnsavedChangesDialog(true);
    } else {
      navigateFn();
    }
  }, [hasUnsavedChanges]);

  // Confirm leaving without saving
  const confirmLeave = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
  }, []);

  // Warn user before closing/refreshing browser tab with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
              idealAnswer: q.ideal_answer,
            })),
          ];
          
          setQuestions(loadedQuestions);
          prevQuestionsRef.current = loadedQuestions;
          setIsGenerated(true);
          setInitialMessage('Laat me weten als je vragen hebt of iets wilt aanpassen of toevoegen!');
          
          // Set publishing state from pre-screening data
          setPublishedAt(preScreeningData.published_at ?? null);
          
          // Use vacancy object for is_online and channels (source of truth)
          setIsOnline(vacancyData.isOnline ?? false);
          
          // Set channel status from vacancy's channels object
          if (vacancyData.channels) {
            setVoiceEnabled(vacancyData.channels.voice ?? false);
            setWhatsappEnabled(vacancyData.channels.whatsapp ?? false);
            setCvEnabled(vacancyData.channels.cv ?? false);
          } else {
            // Fallback to agent IDs for backwards compatibility
            const hasVoice = !!preScreeningData.elevenlabs_agent_id;
            const hasWhatsapp = !!preScreeningData.whatsapp_agent_id;
            setVoiceEnabled(hasVoice);
            setWhatsappEnabled(hasWhatsapp);
            setCvEnabled(false);
          }
          
          // Default to dashboard view when loading existing pre-screening
          setViewMode('dashboard');
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
      document.title = `${vacancy.title} - Bewerken - Taloo`;
    }
  }, [vacancy?.title]);

  // Check for preloaded prompt from URL params (e.g., from Smart Insights)
  useEffect(() => {
    const promptParam = searchParams.get('prompt');
    if (promptParam && isGenerated && !isGenerating) {
      setPendingPrompt(promptParam);
      // Clear the URL param after consuming it
      const url = new URL(window.location.href);
      url.searchParams.delete('prompt');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, isGenerated, isGenerating]);

  // Check for mode parameter (e.g., from navigation)
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'preview' && isGenerated && questions.length > 0) {
      setViewMode('preview');
      // Clear the URL param after consuming it
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      window.history.replaceState({}, '', url.toString());
    } else if (modeParam === 'dashboard' && existingPreScreening) {
      setViewMode('dashboard');
      // Clear the URL param after consuming it
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, isGenerated, questions.length, existingPreScreening]);

  // Fetch applications when entering dashboard mode, with polling every 3 seconds
  useEffect(() => {
    if (viewMode !== 'dashboard' || !existingPreScreening || !vacancy) return;
    
    let isMounted = true;
    
    async function fetchApplications(isInitialLoad = false) {
      try {
        if (isInitialLoad) {
          setIsLoadingApplications(true);
        }
        const data = await getApplications(id);
        if (isMounted) {
          setApplications(data.applications.map(convertToComponentApplication));
        }
      } catch (err) {
        console.error('Failed to fetch applications:', err);
        if (isMounted && isInitialLoad) {
          setApplications([]);
        }
      } finally {
        if (isMounted && isInitialLoad) {
          setIsLoadingApplications(false);
        }
      }
    }

    // Initial fetch
    fetchApplications(true);
    
    // Poll every 3 seconds
    const pollInterval = setInterval(() => {
      fetchApplications(false);
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [viewMode, existingPreScreening, vacancy, id]);

  // Convert backend Interview to frontend GeneratedQuestion[]
  const convertToFrontendQuestions = useCallback((interview: Interview): GeneratedQuestion[] => {
    // Debug: Log what the backend sends for change_status
    console.log('[EditPage] Backend response - knockout_questions:', 
      interview.knockout_questions.map(q => ({ id: q.id, change_status: q.change_status }))
    );
    console.log('[EditPage] Backend response - qualification_questions:', 
      interview.qualification_questions.map(q => ({ id: q.id, change_status: q.change_status }))
    );
    
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

  // Handle SSE events for status updates
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

  // Build pre-screening config from provided questions
  const buildPreScreeningConfigFromQuestions = useCallback((questionsToSave: GeneratedQuestion[]): PreScreeningInput => {
    const knockoutQuestions = questionsToSave
      .filter(q => q.type === 'knockout')
      .map(q => ({ id: q.id, question: q.text }));
    
    const qualificationQuestions = questionsToSave
      .filter(q => q.type === 'qualifying')
      .map(q => ({ 
        id: q.id, 
        question: q.text,
        ideal_answer: q.idealAnswer,
      }));
    
    // Get intro and actions from existing config or use defaults
    const intro = existingPreScreening?.intro || 
      "Hallo! Leuk dat je solliciteert. Ben je klaar voor een paar korte vragen?";
    const knockoutFailedAction = existingPreScreening?.knockout_failed_action || 
      "Helaas voldoe je niet aan de basisvereisten. Interesse in andere matches?";
    const finalAction = existingPreScreening?.final_action || 
      "Perfect! We plannen een gesprek met de recruiter.";

    return {
      intro,
      knockout_questions: knockoutQuestions,
      knockout_failed_action: knockoutFailedAction,
      qualification_questions: qualificationQuestions,
      final_action: finalAction,
      approved_ids: questionsToSave.map(q => q.id),
    };
  }, [existingPreScreening]);

  // Build pre-screening config from current questions state
  const buildPreScreeningConfig = useCallback(() => {
    return buildPreScreeningConfigFromQuestions(questions);
  }, [questions, buildPreScreeningConfigFromQuestions]);

  // Auto-save questions to database (debounced)
  // Also updates ElevenLabs agent if one exists
  const autoSaveQuestions = useCallback((questionsToSave: GeneratedQuestion[]) => {
    if (!vacancy) return;
    
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Debounce by 500ms to avoid too many API calls during rapid changes
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (questionsToSave.length === 0) return;
      
      setIsAutoSaving(true);
      
      try {
        const config = buildPreScreeningConfigFromQuestions(questionsToSave);
        await savePreScreening(vacancy.id, config);
        
        // Update existingPreScreening state so hasUnsavedChanges becomes false
        setExistingPreScreening(prev => {
          const base = prev ?? {
            id: vacancy.id,
            vacancy_id: vacancy.id,
            intro: config.intro,
            knockout_questions: [],
            knockout_failed_action: config.knockout_failed_action,
            qualification_questions: [],
            final_action: config.final_action,
            status: 'draft' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_online: false,
          };
          
          return {
            ...base,
            knockout_questions: config.knockout_questions.map((q, idx) => ({
              id: q.id,
              question_text: q.question,
              question_type: 'knockout' as const,
              position: idx,
              is_approved: true,
            })),
            qualification_questions: config.qualification_questions.map((q, idx) => ({
              id: q.id,
              question_text: q.question,
              ideal_answer: q.ideal_answer,
              question_type: 'qualification' as const,
              position: idx,
              is_approved: true,
            })),
            updated_at: new Date().toISOString(),
          };
        });
        
        console.log('Auto-saved questions to database');
        
        // If an ElevenLabs agent exists, update it with the new questions
        // The agent is always "online" on ElevenLabs side - our is_online flag just controls UI visibility
        if (existingPreScreening?.elevenlabs_agent_id) {
          try {
            await publishPreScreening(vacancy.id, {
              enable_voice: voiceEnabled,
              enable_whatsapp: whatsappEnabled,
              enable_cv: cvEnabled,
            });
            console.log('ElevenLabs agent updated with new questions');
            toast.success('Wijzigingen opgeslagen en agent bijgewerkt');
          } catch (agentError) {
            console.error('Failed to update ElevenLabs agent:', agentError);
            // Still show success for database save, but warn about agent update
            toast.success('Wijzigingen opgeslagen');
            toast.error('Agent bijwerken mislukt. Publiceer opnieuw om te synchroniseren.');
          }
        } else {
          toast.success('Wijzigingen opgeslagen');
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast.error('Opslaan mislukt. Probeer het opnieuw.');
      } finally {
        setIsAutoSaving(false);
      }
    }, 500);
  }, [vacancy, buildPreScreeningConfigFromQuestions, existingPreScreening?.elevenlabs_agent_id, voiceEnabled, whatsappEnabled, cvEnabled]);

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
        
        // Auto-save newly generated questions to database
        autoSaveQuestions(questionsWithoutChangeStatus);
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
  }, [vacancy, handleSSEEvent, convertToFrontendQuestions, autoSaveQuestions]);

  // Auto-generate questions when vacancy loads (only if no existing pre-screening)
  useEffect(() => {
    if (vacancy && !isGenerated && !isGenerating && !existingPreScreening) {
      doGenerateInterview();
    }
  }, [vacancy, isGenerated, isGenerating, existingPreScreening, doGenerateInterview]);

  // Detect which questions changed and highlight them using change_status from API
  const updateQuestionsWithHighlight = useCallback((newQuestions: GeneratedQuestion[]) => {
    // Use the changeStatus flag from the API to determine which questions to highlight
    const changedIds = newQuestions
      .filter(q => q.changeStatus === 'new' || q.changeStatus === 'updated')
      .map(q => q.id);
    
    if (changedIds.length > 0) {
      setHighlightedIds(changedIds);
      
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedIds([]);
        // Clear changeStatus after timeout so labels don't persist
        setQuestions(prev => prev.map(q => ({
          ...q,
          changeStatus: undefined,
        })));
      }, 5000);
    }
    
    // Keep changeStatus in questions so the label can display, but clear isModified
    const questionsToStore = newQuestions.map(q => ({
      ...q,
      isModified: undefined,
    }));
    
    prevQuestionsRef.current = questionsToStore;
    setQuestions(questionsToStore);
  }, []);

  const handleQuestionsUpdate = (newQuestions: GeneratedQuestion[]) => {
    updateQuestionsWithHighlight(newQuestions);
    // Reset the WhatsApp chat simulation since questions have changed
    setChatResetKey(prev => prev + 1);
    // Auto-save updated questions to database
    autoSaveQuestions(newQuestions);
  };

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleRegenerate = async () => {
    await doGenerateInterview();
  };

  // Update existingPreScreening state after save/publish
  const updateExistingPreScreeningState = useCallback((
    publishResult: { published_at: string; is_online: boolean; elevenlabs_agent_id?: string; whatsapp_agent_id?: string },
    config: ReturnType<typeof buildPreScreeningConfig>
  ) => {
    setExistingPreScreening(prev => {
      const base: PreScreening = prev ?? {
        id: vacancy?.id ?? '',
        vacancy_id: vacancy?.id ?? '',
        intro: config.intro,
        knockout_questions: [],
        knockout_failed_action: config.knockout_failed_action,
        qualification_questions: [],
        final_action: config.final_action,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_online: false,
      };
      return {
        ...base,
        // Update questions to match current state so hasUnsavedChanges returns false
        knockout_questions: config.knockout_questions.map((q, idx) => ({
          id: q.id,
          question_text: q.question,
          question_type: 'knockout' as const,
          position: idx,
          is_approved: true,
        })),
        qualification_questions: config.qualification_questions.map((q, idx) => ({
          id: q.id,
          question_text: q.question,
          ideal_answer: q.ideal_answer,
          question_type: 'qualification' as const,
          position: idx,
          is_approved: true,
        })),
        published_at: publishResult.published_at,
        is_online: publishResult.is_online,
        elevenlabs_agent_id: publishResult.elevenlabs_agent_id ?? prev?.elevenlabs_agent_id ?? null,
        whatsapp_agent_id: publishResult.whatsapp_agent_id ?? prev?.whatsapp_agent_id ?? null,
      };
    });
  }, [vacancy?.id]);

  // Save and update agents when already online (no dialog needed)
  const handleSaveAndUpdate = async () => {
    if (!vacancy) return;
    
    setIsSaving(true);
    
    try {
      const config = buildPreScreeningConfig();
      
      console.log('Saving pre-screening to database...');
      await savePreScreening(vacancy.id, config);
      
      console.log('Pre-screening saved, now updating agents...');
      
      // Republish with the same channels that are already active
      const publishResult = await publishPreScreening(vacancy.id, {
        enable_voice: voiceEnabled,
        enable_whatsapp: whatsappEnabled,
        enable_cv: cvEnabled,
      });
      
      console.log('Agents updated successfully!', publishResult);
      
      // Update local state
      setPublishedAt(publishResult.published_at);
      setIsOnline(publishResult.is_online);
      updateExistingPreScreeningState(publishResult, config);
      
      toast.success(`Wijzigingen opgeslagen en agents bijgewerkt`);
      
    } catch (error) {
      console.error('Failed to save and update:', error);
      toast.error(error instanceof Error ? error.message : 'Opslaan mislukt. Probeer het opnieuw.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (channels: PublishChannels) => {
    if (!vacancy) return;
    
    const isFirstPublish = !publishedAt;
    
    setIsSaving(true);
    
    try {
      const config = buildPreScreeningConfig();
      
      console.log('Saving pre-screening to database...');
      await savePreScreening(vacancy.id, config);
      
      console.log('Pre-screening saved, now publishing...');
      
      // Then publish it
      const publishResult = await publishPreScreening(vacancy.id, {
        enable_voice: channels.voice,
        enable_whatsapp: channels.whatsapp,
        enable_cv: channels.cv,
      });
      
      console.log('Pre-screening published successfully!', publishResult);
      
      // Update local state with publish result
      setPublishedAt(publishResult.published_at);
      setIsOnline(publishResult.is_online);
      
      // Update channel states to match what was just published
      setVoiceEnabled(channels.voice);
      setWhatsappEnabled(channels.whatsapp);
      setCvEnabled(channels.cv);
      
      updateExistingPreScreeningState(publishResult, config);
      
      // Show success toast
      toast.success(`Pre-screening voor "${vacancy.title}" nu live`);
      
      // Redirect to dashboard on first publish
      if (isFirstPublish) {
        setViewMode('dashboard');
      }
      
    } catch (error) {
      console.error('Failed to publish pre-screening:', error);
      toast.error(error instanceof Error ? error.message : 'Publiceren mislukt. Probeer het opnieuw.');
      throw error; // Re-throw so the dialog knows it failed
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = async (newOnlineStatus: boolean) => {
    if (!vacancy || !publishedAt) return;
    
    // If going offline, show confirmation dialog
    if (!newOnlineStatus) {
      setShowOfflineDialog(true);
      return;
    }
    
    // Going online - just toggle the status (channels already configured)
    await performStatusUpdate(true);
  };

  const performStatusUpdate = async (newOnlineStatus: boolean) => {
    if (!vacancy) return;
    
    setIsTogglingStatus(true);
    
    try {
      const result = await updatePreScreeningStatus(vacancy.id, newOnlineStatus);
      setIsOnline(result.is_online);
      
      // Update existingPreScreening
      setExistingPreScreening(prev => prev ? {
        ...prev,
        is_online: result.is_online,
      } : null);
      
      toast.success(result.is_online 
        ? `Pre-screening voor "${vacancy.title}" is nu online` 
        : `Pre-screening voor "${vacancy.title}" is nu offline`
      );
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(error instanceof Error ? error.message : 'Status wijzigen mislukt. Probeer het opnieuw.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Individual channel toggle handlers
  // Note: These require backend support for individual channel control
  // For now, they update local state optimistically and call the API
  const handleVoiceToggle = async (enabled: boolean) => {
    if (!vacancy || !publishedAt) return;
    
    const previousState = voiceEnabled;
    setVoiceEnabled(enabled);
    
    try {
      const result = await updateChannelStatus(vacancy.id, { voice_enabled: enabled });
      // Update all channel states from response
      if (result.channels) {
        setVoiceEnabled(result.channels.voice);
        setWhatsappEnabled(result.channels.whatsapp);
        setCvEnabled(result.channels.cv);
      }
      // Update online status from response (enabling a channel may bring agent online)
      setIsOnline(result.is_online);
      toast.success(enabled 
        ? 'Voice kanaal geactiveerd' 
        : 'Voice kanaal gedeactiveerd'
      );
    } catch (error) {
      setVoiceEnabled(previousState);
      console.error('Failed to update voice channel:', error);
      toast.error('Kanaal wijzigen mislukt. Probeer het opnieuw.');
    }
  };

  const handleWhatsappToggle = async (enabled: boolean) => {
    if (!vacancy || !publishedAt) return;
    
    const previousState = whatsappEnabled;
    setWhatsappEnabled(enabled);
    
    try {
      const result = await updateChannelStatus(vacancy.id, { whatsapp_enabled: enabled });
      // Update all channel states from response
      if (result.channels) {
        setVoiceEnabled(result.channels.voice);
        setWhatsappEnabled(result.channels.whatsapp);
        setCvEnabled(result.channels.cv);
      }
      // Update online status from response (enabling a channel may bring agent online)
      setIsOnline(result.is_online);
      toast.success(enabled 
        ? 'WhatsApp kanaal geactiveerd' 
        : 'WhatsApp kanaal gedeactiveerd'
      );
    } catch (error) {
      setWhatsappEnabled(previousState);
      console.error('Failed to update whatsapp channel:', error);
      toast.error('Kanaal wijzigen mislukt. Probeer het opnieuw.');
    }
  };

  const handleCvToggle = async (enabled: boolean) => {
    if (!vacancy || !publishedAt) return;
    
    const previousState = cvEnabled;
    setCvEnabled(enabled);
    
    try {
      const result = await updateChannelStatus(vacancy.id, { cv_enabled: enabled });
      // Update all channel states from response
      if (result.channels) {
        setVoiceEnabled(result.channels.voice);
        setWhatsappEnabled(result.channels.whatsapp);
        setCvEnabled(result.channels.cv);
      }
      // Update online status from response (enabling a channel may bring agent online)
      setIsOnline(result.is_online);
      toast.success(enabled 
        ? 'Smart CV kanaal geactiveerd' 
        : 'Smart CV kanaal gedeactiveerd'
      );
    } catch (error) {
      setCvEnabled(previousState);
      console.error('Failed to update cv channel:', error);
      toast.error('Kanaal wijzigen mislukt. Probeer het opnieuw.');
    }
  };

  const handleQuestionClick = (question: GeneratedQuestion, index: number) => {
    const typeLabel = question.type === 'knockout' ? 'knockout vraag' : 'kwalificatie vraag';
    setPendingPrompt(`Ik heb een vraag over ${typeLabel} ${index}: `);
  };

  const handleReorder = async (reorderedQuestions: GeneratedQuestion[]) => {
    if (!sessionId) {
      setQuestions(reorderedQuestions);
      prevQuestionsRef.current = reorderedQuestions;
      // Still auto-save even without session (edge case)
      autoSaveQuestions(reorderedQuestions);
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
        // Auto-save reordered questions to database
        autoSaveQuestions(reorderedQuestions);
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

  const handleAddQuestion = async (
    text: string, 
    type: 'knockout' | 'qualifying', 
    idealAnswer?: string
  ) => {
    if (!sessionId) {
      toast.error('Sessie niet beschikbaar. Probeer de pagina te vernieuwen.');
      return;
    }

    // Generate temporary ID for optimistic update
    const tempId = `temp_${Date.now()}`;
    const tempQuestion: GeneratedQuestion = {
      id: tempId,
      text,
      type,
      idealAnswer: type === 'qualifying' ? idealAnswer : undefined,
      changeStatus: 'new',
      _stableKey: tempId, // Used for React key to prevent remount on ID change
    };

    // Store previous state for rollback
    const previousQuestions = [...questions];
    const previousRef = [...prevQuestionsRef.current];

    // Optimistic UI update - add to end of list
    const newQuestions = [...questions, tempQuestion];
    setQuestions(newQuestions);
    prevQuestionsRef.current = newQuestions;
    setHighlightedIds(prev => [...prev, tempId]);

    // Map frontend type to backend type
    const backendType = type === 'qualifying' ? 'qualification' : 'knockout';

    try {
      const result = await addQuestion(sessionId, backendType, text, idealAnswer);
      
      // Replace temp ID with real ID from backend
      // Keep _stableKey to prevent React remount, clear changeStatus since animation is already playing
      const updatedQuestions = newQuestions.map(q => 
        q.id === tempId 
          ? { 
              ...q, 
              id: result.question.id, 
              // Don't update changeStatus - animation already started with temp ID
            } 
          : q
      );
      setQuestions(updatedQuestions);
      prevQuestionsRef.current = updatedQuestions;
      
      // Update highlighted IDs with real ID
      setHighlightedIds(prev => prev.map(id => id === tempId ? result.question.id : id));
      
      // Reset the WhatsApp chat simulation since questions have changed
      setChatResetKey(prev => prev + 1);
      
      // Auto-save updated questions to database
      autoSaveQuestions(updatedQuestions);
      
    } catch (error) {
      console.error('Failed to add question:', error);
      // Rollback on error
      setQuestions(previousQuestions);
      prevQuestionsRef.current = previousRef;
      setHighlightedIds(prev => prev.filter(id => id !== tempId));
      toast.error(error instanceof Error ? error.message : 'Vraag toevoegen mislukt. Probeer het opnieuw.');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!sessionId) {
      toast.error('Sessie niet beschikbaar. Probeer de pagina te vernieuwen.');
      return;
    }

    // Store previous state for rollback
    const previousQuestions = [...questions];
    const previousRef = [...prevQuestionsRef.current];

    // Optimistic UI update - remove question immediately
    const filteredQuestions = questions.filter(q => q.id !== questionId);
    setQuestions(filteredQuestions);
    prevQuestionsRef.current = filteredQuestions;

    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await deleteQuestion(sessionId, questionId);
        
        // Reset the WhatsApp chat simulation since questions have changed
        setChatResetKey(prev => prev + 1);
        
        // Auto-save updated questions to database
        autoSaveQuestions(filteredQuestions);
        return;
      } catch (error) {
        console.warn(`Delete question attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries - 1) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    console.error('Failed to delete question after all retries');
    // Rollback on error
    setQuestions(previousQuestions);
    prevQuestionsRef.current = previousRef;
    toast.error('Vraag verwijderen mislukt. Probeer het opnieuw.');
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

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] -m-6">
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavigateAway(() => router.back())}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{vacancy.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Trigger Interview Button - only show when agent is online */}
          {publishedAt && isOnline && (
            <button
              type="button"
              onClick={() => setShowTriggerInterviewDialog(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-brand-lime-green hover:brightness-95 text-black transition-colors"
            >
              <img
                src="/dummy-client-logo.png"
                alt=""
                className="w-5 h-5 rounded-sm object-contain"
              />
              Sollicitatie testen
            </button>
          )}
          {/* Three-way Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              disabled={!existingPreScreening}
              onClick={() => handleNavigateAway(() => setViewMode('dashboard'))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !existingPreScreening
                  ? 'text-gray-300 cursor-not-allowed'
                  : viewMode === 'dashboard'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overzicht
            </button>
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'edit'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Pencil className="w-4 h-4" />
              Vragen
            </button>
            <button
              type="button"
              disabled={questions.length === 0 || isGenerating}
              onClick={() => handleNavigateAway(() => setViewMode('preview'))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                questions.length === 0 || isGenerating
                  ? 'text-gray-300 cursor-not-allowed'
                  : viewMode === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Simulatie
            </button>
          </div>
          
          {/* Agent Online Toggle or Publish Button */}
          {publishedAt ? (
            <ChannelStatusPopover
              isOnline={isOnline}
              voiceEnabled={voiceEnabled}
              whatsappEnabled={whatsappEnabled}
              cvEnabled={cvEnabled}
              onToggleMaster={handleStatusToggle}
              onToggleVoice={handleVoiceToggle}
              onToggleWhatsapp={handleWhatsappToggle}
              onToggleCv={handleCvToggle}
              disabled={isTogglingStatus}
            />
          ) : (
            <button
              type="button"
              disabled={questions.length === 0 || isGenerating || isSaving}
              onClick={() => setShowPublishDialog(true)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                questions.length === 0 || isGenerating || isSaving
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-sm'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {isSaving ? 'Bezig...' : 'Publiceren'}
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200" />

      <div className="flex-1 min-h-0 relative">
        {/* Edit Mode Layout */}
        <div 
          className={`absolute inset-0 flex transition-opacity duration-300 ease-out ${
            viewMode === 'edit' 
              ? 'opacity-100 z-10' 
              : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Questions panel - flexible width */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="max-w-[720px] mx-auto -mt-3">
                <InterviewQuestionsPanel 
                  questions={questions} 
                  isGenerating={isGenerating}
                  highlightedIds={highlightedIds}
                  onQuestionClick={handleQuestionClick}
                  onReorder={handleReorder}
                  onAddQuestion={handleAddQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                />
              </div>
            </div>
          </div>

          {/* AI Assistant - 500px */}
          <div className="w-[500px] shrink-0 flex flex-col border-l border-gray-200 min-h-0">
            <InterviewAssistant
              vacancyTitle={vacancy.title}
              vacancyText={vacancy.description}
              vacancySource={vacancy.source}
              vacancySourceId={vacancy.sourceId}
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
          </div>
        </div>

        {/* Preview Mode Layout */}
        <div 
          className={`absolute inset-0 flex transition-opacity duration-300 ease-out ${
            viewMode === 'preview' 
              ? 'opacity-100 z-10' 
              : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Questions panel - 600px fixed */}
          <div className="w-[600px] shrink-0 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="-mt-3">
                <InterviewQuestionsPanel 
                  questions={questions} 
                  isGenerating={isGenerating}
                  highlightedIds={highlightedIds}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Phone mockup - fills remaining space */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border-l border-gray-200 min-h-0">
            <div className="flex flex-col items-center" style={{ transform: 'scale(0.75)', transformOrigin: 'center center' }}>
              <IPhoneMockup>
                <WhatsAppChat 
                  scenario={chatScenario} 
                  resetKey={chatResetKey} 
                  vacancyId={vacancy.id}
                  candidateName="Laurijn"
                  isActive={viewMode === 'preview'}
                />
              </IPhoneMockup>
              
              {/* Scenario control buttons */}
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => {
                    setChatScenario('manual');
                    setChatResetKey(prev => prev + 1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    chatScenario === 'manual'
                      ? 'bg-gray-200 text-gray-800 border border-gray-300'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  Handmatig
                </button>
                <button
                  onClick={() => {
                    setChatScenario('pass');
                    setChatResetKey(prev => prev + 1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    chatScenario === 'pass'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Auto-antwoord
                </button>
                <button
                  onClick={() => setChatResetKey(prev => prev + 1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Herstarten
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Mode Layout */}
        <div 
          className={`absolute inset-0 flex transition-opacity duration-300 ease-out ${
            viewMode === 'dashboard' 
              ? 'opacity-100 z-10' 
              : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {isLoadingApplications ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Sollicitaties laden...</span>
              </div>
            ) : (
              <>
                <InterviewDashboard applications={applications} />
                <div className="mt-6">
                  <ApplicationsTable 
                    applications={applications}
                    selectedId={selectedApplicationId}
                    onSelectApplication={(appId) => setSelectedApplicationId(appId)}
                    isPublished={!!publishedAt}
                    onPublishClick={() => setShowPublishDialog(true)}
                  />
                </div>
                {publishedAt && (
                  <p className="mt-4 text-xs text-gray-400">
                    Gepubliceerd: {new Date(publishedAt).toLocaleDateString('nl-NL', { 
                      day: 'numeric', 
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Application detail pane */}
          {selectedApplicationId && (
            <div className="w-[500px] shrink-0 flex flex-col border-l border-gray-200 min-h-0">
              <ApplicationDetailPane 
                application={applications.find(a => a.id === selectedApplicationId) || null}
                onClose={() => setSelectedApplicationId(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Publish Dialog with Channel Selection */}
      <PublishDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        onPublish={handlePublish}
        isRepublish={!!publishedAt}
      />

      {/* Offline Confirmation Dialog */}
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
            <AlertDialogCancel disabled={isTogglingStatus}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await performStatusUpdate(false);
                setShowOfflineDialog(false);
              }}
              disabled={isTogglingStatus}
              className="bg-red-600 hover:bg-red-700"
            >
              {isTogglingStatus ? 'Bezig...' : 'Offline zetten'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Trigger Interview Dialog */}
      <TriggerInterviewDialog
        open={showTriggerInterviewDialog}
        onOpenChange={setShowTriggerInterviewDialog}
        vacancyId={vacancy.id}
        vacancyTitle={vacancy.title}
        hasWhatsApp={whatsappEnabled}
        hasVoice={voiceEnabled}
        hasCv={cvEnabled}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wijzigingen niet opgeslagen</AlertDialogTitle>
            <AlertDialogDescription>
              Je hebt wijzigingen die nog niet zijn opgeslagen. Weet je zeker dat je wilt vertrekken? 
              Je wijzigingen gaan verloren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Blijven</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeave}
              className="bg-red-600 hover:bg-red-700"
            >
              Vertrekken
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
