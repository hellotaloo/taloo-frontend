'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, Check, ArrowUp, Square, Wrench, ChevronDown, FileText } from 'lucide-react';
import { ThinkingIndicator } from './ThinkingIndicator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import ReactMarkdown from 'react-markdown';
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/prompt-kit/prompt-input';
import { Button } from '@/components/ui/button';
import { GeneratedQuestion } from './QuestionListMessage';
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
  isGenerated: boolean;
  isGenerating: boolean;
  isSaving?: boolean;
  sessionId: string | null;
  currentStatus: string;
  initialMessage: string;
  onRegenerate: () => void;
  onQuestionsUpdate: (questions: GeneratedQuestion[]) => void;
  onApprove?: () => void;
  externalPrompt?: string;
  onExternalPromptConsumed?: () => void;
}

export function InterviewAssistant({ 
  vacancyTitle,
  vacancyText,
  isGenerated, 
  isGenerating,
  isSaving = false,
  sessionId,
  currentStatus,
  initialMessage,
  onRegenerate,
  onQuestionsUpdate,
  onApprove,
  externalPrompt,
  onExternalPromptConsumed,
}: InterviewAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [isVacancyOpen, setIsVacancyOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    }
  };

  const convertToFrontendQuestions = (interview: Interview): GeneratedQuestion[] => {
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
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    if (!sessionId) {
      addMessage('assistant', 'Er is nog geen sessie actief. Genereer eerst de vragen.');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    
    setIsLoading(true);
    setFeedbackStatus('Feedback verwerken...');

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const { interview: updatedInterview, message: responseMessage } = await sendFeedback(sessionId, userMessage, handleSSEEvent);
        const questions = convertToFrontendQuestions(updatedInterview);
        onQuestionsUpdate(questions);
        addMessage('assistant', responseMessage || 'Ik heb de vragen aangepast op basis van je feedback.');
        setIsLoading(false);
        setFeedbackStatus('');
        return; // Success, exit the function
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Send feedback attempt ${attempt + 1} failed:`, error);
        
        // If we have more retries, wait with exponential backoff before trying again
        if (attempt < maxRetries - 1) {
          const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          setFeedbackStatus('Opnieuw proberen...');
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          setFeedbackStatus('Feedback verwerken...');
        }
      }
    }

    // All retries failed
    console.error('Failed to send feedback after all retries:', lastError);
    addMessage('assistant', 'Er is een fout opgetreden bij het verwerken van je feedback. Probeer het opnieuw.');
    setIsLoading(false);
    setFeedbackStatus('');
  };

  const handleApprove = () => {
    addMessage('assistant', 'De vragen zijn goedgekeurd! Je kunt nu verdergaan met het publiceren van het interview.');
    onApprove?.();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Fixed collapsible vacancy context card */}
      <div className="px-6 pt-6 pb-2">
        <Collapsible open={isVacancyOpen} onOpenChange={setIsVacancyOpen}>
          <div className="rounded-lg bg-gray-100">
            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-200/50 transition-colors rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Vacaturetekst</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isVacancyOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4">
                <div className="relative">
                  <div className="max-h-[400px] overflow-y-auto rounded-md bg-white p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="text-sm text-gray-600 prose prose-sm max-w-none pb-6">
                      <ReactMarkdown
                        components={{
                          h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-800 mt-3 first:mt-0 mb-2">{children}</h3>,
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                          li: ({ children }) => <li className="text-gray-600">{children}</li>,
                        }}
                      >
                        {vacancyText}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {/* Gradient overlay to indicate scroll */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-md" />
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
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
            <ThinkingIndicator />
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
            <ThinkingIndicator />
          )
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {isGenerated && !isGenerating && !isLoading && (
        <div className="px-6 py-2">
          <div className="flex gap-2">
            <button
              onClick={onRegenerate}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-3 h-3" />
              Regenereer
            </button>
            <button
              onClick={handleApprove}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Check className="w-3 h-3" />
                  Goedkeuren
                </>
              )}
            </button>
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
