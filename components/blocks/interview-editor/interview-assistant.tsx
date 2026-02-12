'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Square, Wrench, FileText } from 'lucide-react';
import { ThinkingIndicator } from '@/components/kit/chat';
import { CollapseBox } from '@/components/kit/collapse-box';
import { HighlightedVacancyText } from '@/components/kit/highlighted-vacancy-text';
import ReactMarkdown from 'react-markdown';
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/prompt-kit/prompt-input';
import { Button } from '@/components/ui/button';
import { GeneratedQuestion } from './question-list-message';
import { sendFeedback, SSEEvent, Interview } from '@/lib/interview-api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isNew?: boolean; // Track if message should animate
}

// Hook for typewriter effect
function useTypewriter(text: string, enabled: boolean, speed: number = 15) {
  const [displayedText, setDisplayedText] = useState(enabled ? '' : text);
  const [isTyping, setIsTyping] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let currentIndex = 0;

    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        // Type multiple characters at once for faster effect
        const charsToAdd = Math.min(3, text.length - currentIndex);
        setDisplayedText(text.slice(0, currentIndex + charsToAdd));
        currentIndex += charsToAdd;
      } else {
        setIsTyping(false);
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, enabled, speed]);

  return { displayedText, isTyping };
}

interface InterviewAssistantProps {
  vacancyTitle: string;
  vacancyText: string;
  vacancySource?: 'salesforce' | 'bullhorn' | 'manual' | null;
  vacancySourceId?: string | null;
  isGenerated: boolean;
  isGenerating: boolean;
  isSaving?: boolean;
  sessionId: string | null;
  currentStatus: string;
  /** Thinking content from the initial generation (passed from parent) */
  generationThinkingContent?: string;
  initialMessage: string;
  onRegenerate: () => void;
  onQuestionsUpdate: (questions: GeneratedQuestion[]) => void;
  externalPrompt?: string;
  onExternalPromptConsumed?: () => void;
  /** Highlighted vacancy snippet (from hovering a question) */
  highlightedSnippet?: string | null;
  /** Question text associated with the highlighted snippet */
  highlightedQuestionText?: string | null;
}

export function InterviewAssistant({
  vacancyTitle,
  vacancyText,
  vacancySource,
  vacancySourceId,
  isGenerated,
  isGenerating,
  isSaving = false,
  sessionId,
  currentStatus,
  generationThinkingContent,
  initialMessage,
  onRegenerate,
  onQuestionsUpdate,
  externalPrompt,
  onExternalPromptConsumed,
  highlightedSnippet,
  highlightedQuestionText,
}: InterviewAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [feedbackThinkingContent, setFeedbackThinkingContent] = useState('');
  const [isVacancyOpen, setIsVacancyOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Ref-based guard to prevent duplicate submissions (avoids React state batching race condition)
  const isSubmittingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle external prompt (e.g., from clicking a question in the left panel)
  useEffect(() => {
    if (externalPrompt) {
      setInput(externalPrompt);
      onExternalPromptConsumed?.();
      // Focus the textarea and move cursor to end
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = textareaRef.current.value.length;
          textareaRef.current.selectionEnd = textareaRef.current.value.length;
        }
      }, 0);
    }
  }, [externalPrompt, onExternalPromptConsumed]);

  // Add initial message when generation completes
  useEffect(() => {
    if (isGenerated && initialMessage && messages.length === 0) {
      setMessages([{
        id: 'msg-1',
        role: 'assistant',
        content: initialMessage,
        timestamp: new Date().toISOString(),
        isNew: true, // Enable typewriter effect for initial message
      }]);
    }
  }, [isGenerated, initialMessage, messages.length]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      isNew: role === 'assistant', // Only animate assistant messages
    };
    setMessages(prev => [...prev, message]);
    return message;
  };

  // Mark message as no longer new (after animation completes)
  const markMessageAsOld = useCallback((messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isNew: false } : msg
      )
    );
  }, []);

  const handleSSEEvent = (event: SSEEvent) => {
    if (event.type === 'status') {
      setFeedbackStatus(event.message || '');
    } else if (event.type === 'thinking') {
      // Append thinking content as it streams in
      setFeedbackThinkingContent(prev => prev + (event.content || ''));
    }
  };

  const convertToFrontendQuestions = (interview: Interview): GeneratedQuestion[] => {
    // Debug: Log what the backend sends for change_status
    console.log('[InterviewAssistant] Backend response - knockout_questions:', 
      interview.knockout_questions.map(q => ({ id: q.id, change_status: q.change_status }))
    );
    console.log('[InterviewAssistant] Backend response - qualification_questions:', 
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
  };

  const handleSubmit = async () => {
    const requestId = `req-${Date.now()}`;
    
    // Use ref guard to prevent duplicate submissions (React state batching can cause race conditions)
    if (!input.trim() || isLoading || isSubmittingRef.current) {
      console.log(`[handleSubmit ${requestId}] BLOCKED - input empty: ${!input.trim()}, isLoading: ${isLoading}, isSubmitting: ${isSubmittingRef.current}`);
      return;
    }
    if (!sessionId) {
      addMessage('assistant', 'Er is nog geen sessie actief. Genereer eerst de vragen.');
      return;
    }

    // Set ref guard immediately (synchronous, before any state updates)
    isSubmittingRef.current = true;
    console.log(`[handleSubmit ${requestId}] STARTED - guard set to true at ${new Date().toISOString()}`);

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    
    setIsLoading(true);
    setFeedbackStatus('Feedback verwerken...');
    setFeedbackThinkingContent(''); // Reset thinking content for new feedback

    const maxRetries = 3;
    let lastError: Error | null = null;

    try {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          console.log(`[handleSubmit ${requestId}] Attempt ${attempt + 1} starting at ${new Date().toISOString()}`);
          const { interview: updatedInterview, message: responseMessage } = await sendFeedback(sessionId, userMessage, handleSSEEvent);
          console.log(`[handleSubmit ${requestId}] Attempt ${attempt + 1} SUCCESS at ${new Date().toISOString()}`);
          const questions = convertToFrontendQuestions(updatedInterview);
          onQuestionsUpdate(questions);
          addMessage('assistant', responseMessage || 'Ik heb de vragen aangepast op basis van je feedback.');
          setIsLoading(false);
          setFeedbackStatus('');
          setFeedbackThinkingContent(''); // Clear thinking content on success
          return; // Success, exit the function
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`[handleSubmit ${requestId}] Attempt ${attempt + 1} FAILED at ${new Date().toISOString()}:`, error);
          
          // If we have more retries, wait before trying again
          if (attempt < maxRetries - 1) {
            // First retry is quick (200ms) and silent, subsequent retries are slower with feedback
            const backoffMs = attempt === 0 ? 200 : Math.pow(2, attempt - 1) * 1000; // 200ms, 1s, 2s
            console.log(`[handleSubmit ${requestId}] Will retry in ${backoffMs}ms`);
            if (attempt > 0) {
              // Only show "Opnieuw proberen" after the first quick retry fails
              setFeedbackStatus('Opnieuw proberen...');
            }
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            if (attempt > 0) {
              setFeedbackStatus('Feedback verwerken...');
            }
          }
        }
      }

      // All retries failed
      console.error(`[handleSubmit ${requestId}] All ${maxRetries} retries failed:`, lastError);
      addMessage('assistant', 'Er is een fout opgetreden bij het verwerken van je feedback. Probeer het opnieuw.');
      setIsLoading(false);
      setFeedbackStatus('');
      setFeedbackThinkingContent(''); // Clear thinking content on error
    } finally {
      // Always reset the ref guard when done
      isSubmittingRef.current = false;
      console.log(`[handleSubmit ${requestId}] COMPLETED - guard reset to false at ${new Date().toISOString()}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Fixed collapsible vacancy context card */}
      <div className="px-6 pt-6 pb-2">
        <CollapseBox
          title="Vacaturetekst"
          icon={FileText}
          open={isVacancyOpen || !!highlightedSnippet}
          onOpenChange={setIsVacancyOpen}
          contentMaxHeight="400px"
          footerLink={
            vacancySource === 'salesforce' && vacancySourceId
              ? {
                  href: `https://taloo.lightning.force.com/lightning/r/Vacancy__c/${vacancySourceId}/view`,
                  label: 'Bekijk in Salesforce',
                }
              : undefined
          }
        >
          <HighlightedVacancyText
            text={vacancyText}
            highlightedSnippet={highlightedSnippet}
            highlightedQuestionText={highlightedQuestionText}
          />
        </CollapseBox>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {isGenerating && (
          currentStatus.includes('genereren') || currentStatus.includes('aanpassen') ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Wrench className="w-4 h-4 text-orange-500 animate-pulse" />
              <span className="text-sm">{currentStatus}</span>
            </div>
          ) : (
            <ThinkingIndicator 
              message={currentStatus || undefined}
              thinkingContent={generationThinkingContent || undefined}
            />
          )
        )}

        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            onTypingComplete={() => markMessageAsOld(message.id)}
          />
        ))}
        
        {isLoading && (
          feedbackStatus.includes('aanpassen') ? (
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-500 animate-pulse" />
              <span className="text-sm text-gray-500">{feedbackStatus}</span>
            </div>
          ) : (
            <ThinkingIndicator 
              message={feedbackStatus || undefined}
              thinkingContent={feedbackThinkingContent || undefined}
            />
          )
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt hints */}
      {isGenerated && !isGenerating && !isLoading && (
        <div className="px-6 py-2">
          <div className="flex flex-wrap gap-2">
            {[
              'Analyseer interview',
              'Dropoff detectie',
              'Dubbel check',
            ].map((hint) => (
              <button
                key={hint}
                onClick={() => setInput(hint)}
                disabled={isSaving}
                className="inline-flex items-center px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-4">
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading || isGenerating}
          onSubmit={handleSubmit}
          className="w-full"
        >
          <PromptInputTextarea ref={textareaRef} placeholder="Geef feedback of vraag aanpassingen..." />

          <PromptInputActions className="flex items-center justify-end gap-2 pt-2">
            <PromptInputAction tooltip="Verstuur">
              <Button
                type="button"
                variant="default"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading || isGenerating}
              >
                {isLoading ? (
                  <Square className="size-3 fill-current" />
                ) : (
                  <ArrowUp className="size-3" />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  );
}

interface ChatMessageProps {
  message: Message;
  onTypingComplete?: () => void;
}

function ChatMessage({ message, onTypingComplete }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const { displayedText, isTyping } = useTypewriter(
    message.content, 
    isAssistant && !!message.isNew
  );

  // Notify parent when typing completes
  useEffect(() => {
    if (!isTyping && message.isNew && onTypingComplete) {
      onTypingComplete();
    }
  }, [isTyping, message.isNew, onTypingComplete]);
  
  if (isAssistant) {
    return (
      <div className="text-sm text-gray-700 max-w-[90%]">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li>{children}</li>,
          }}
        >
          {displayedText}
        </ReactMarkdown>
        {isTyping && (
          <span className="inline-block w-1 h-4 ml-0.5 bg-gray-400 animate-pulse" />
        )}
      </div>
    );
  }
  
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%]">
        <div className="rounded-2xl px-3 py-2 bg-gray-100">
          <p className="text-sm text-gray-700">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
