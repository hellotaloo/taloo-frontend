'use client';

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { ArrowUp, Square, ChevronDown, FileText } from 'lucide-react';
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isNew?: boolean;
}

export interface ContextCard {
  title: string;
  icon?: React.ElementType;
  content: string | ReactNode;
}

export interface ActionButton {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success';
}

export interface PromptSuggestion {
  label: string;
  prompt: string;
  icon?: React.ElementType;
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

export interface ChatAssistantProps {
  /** Initial message from the assistant */
  initialMessage?: string;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Loading status message */
  loadingMessage?: string;
  /** Optional context card (e.g., vacancy text, insight data) */
  contextCard?: ContextCard;
  /** Quick action buttons */
  actionButtons?: ActionButton[];
  /** Whether the assistant is ready (e.g., after generation) */
  isReady?: boolean;
  /** External loading state (e.g., during initial generation) */
  isExternalLoading?: boolean;
  /** External status message */
  externalStatus?: string;
  /** Handler for when user submits a message. Return the assistant's response. */
  onSubmit?: (message: string) => Promise<string>;
  /** External prompt to prefill the input */
  externalPrompt?: string;
  /** Callback when external prompt is consumed */
  onExternalPromptConsumed?: () => void;
  /** Custom class name */
  className?: string;
  /** Show action buttons condition */
  showActions?: boolean;
  /** Prompt suggestions shown above input */
  suggestions?: PromptSuggestion[];
}

export function ChatAssistant({
  initialMessage,
  placeholder = 'Stel een vraag...',
  loadingMessage = 'Verwerken...',
  contextCard,
  actionButtons,
  isReady = true,
  isExternalLoading = false,
  externalStatus,
  onSubmit,
  externalPrompt,
  onExternalPromptConsumed,
  className,
  showActions = true,
  suggestions,
}: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isContextOpen, setIsContextOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle external prompt
  useEffect(() => {
    if (externalPrompt) {
      setInput(externalPrompt);
      onExternalPromptConsumed?.();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = textareaRef.current.value.length;
          textareaRef.current.selectionEnd = textareaRef.current.value.length;
        }
      }, 0);
    }
  }, [externalPrompt, onExternalPromptConsumed]);

  // Add initial message when ready
  useEffect(() => {
    if (isReady && initialMessage && messages.length === 0) {
      setMessages([{
        id: 'msg-1',
        role: 'assistant',
        content: initialMessage,
        timestamp: new Date().toISOString(),
        isNew: true,
      }]);
    }
  }, [isReady, initialMessage, messages.length]);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      isNew: role === 'assistant',
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  // Expose addMessage for external use
  const addAssistantMessage = useCallback((content: string) => {
    addMessage('assistant', content);
  }, [addMessage]);

  const markMessageAsOld = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, isNew: false } : msg
      )
    );
  }, []);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);

    if (!onSubmit) {
      addMessage('assistant', 'Geen handler geconfigureerd voor dit bericht.');
      return;
    }

    setIsLoading(true);
    setStatusMessage(loadingMessage);

    try {
      const response = await onSubmit(userMessage);
      addMessage('assistant', response);
    } catch (error) {
      console.error('Chat submit error:', error);
      addMessage('assistant', 'Er is een fout opgetreden. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const ContextIcon = contextCard?.icon || FileText;
  const isAnyLoading = isLoading || isExternalLoading;
  const displayStatus = statusMessage || externalStatus;

  return (
    <div className={`flex flex-col h-full bg-white ${className || ''}`}>
      {/* Optional context card */}
      {contextCard && (
        <div className="px-6 pt-6 pb-2">
          <Collapsible open={isContextOpen} onOpenChange={setIsContextOpen}>
            <div className="rounded-lg bg-gray-100">
              <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-200/50 transition-colors rounded-lg">
                <div className="flex items-center gap-2">
                  <ContextIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{contextCard.title}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isContextOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4">
                  <div className="relative">
                    <div className="max-h-[400px] overflow-y-auto rounded-md bg-white p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {typeof contextCard.content === 'string' ? (
                        <div className="text-sm text-gray-600 prose prose-sm max-w-none pb-6">
                          <ReactMarkdown
                            components={{
                              h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-800 mt-3 first:mt-0 mb-2">{children}</h3>,
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                              li: ({ children }) => <li className="text-gray-600">{children}</li>,
                            }}
                          >
                            {contextCard.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 pb-6">
                          {contextCard.content}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-white to-transparent pointer-events-none rounded-b-md" />
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {isExternalLoading && (
          <ThinkingIndicator message={externalStatus} />
        )}

        {messages.map((message) => (
          <ChatMessageBubble
            key={message.id}
            message={message}
            onTypingComplete={() => markMessageAsOld(message.id)}
          />
        ))}

        {isLoading && (
          <ThinkingIndicator message={statusMessage} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {showActions && isReady && !isExternalLoading && !isLoading && actionButtons && actionButtons.length > 0 && (
        <div className="px-6 py-2">
          <div className="flex gap-2">
            {actionButtons.map((button, idx) => {
              const Icon = button.icon;
              const variantClasses = {
                default: 'text-gray-600 bg-gray-100 hover:bg-gray-200',
                primary: 'text-white bg-brand-blue hover:bg-brand-blue/90',
                success: 'text-white bg-green-500 hover:bg-green-600',
              };
              return (
                <button
                  key={idx}
                  onClick={button.onClick}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${variantClasses[button.variant || 'default']}`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {button.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && !isAnyLoading && messages.length <= 1 && (
        <div className="px-6 pb-2">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => {
              const SuggestionIcon = suggestion.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(suggestion.prompt);
                    setTimeout(() => textareaRef.current?.focus(), 0);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  {SuggestionIcon && <SuggestionIcon className="w-3 h-3 text-gray-500" />}
                  {suggestion.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-4">
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isAnyLoading}
          onSubmit={handleSubmit}
          className="w-full"
        >
          <PromptInputTextarea ref={textareaRef} placeholder={placeholder} />

          <PromptInputActions className="flex items-center justify-end gap-2 pt-2">
            <PromptInputAction tooltip="Verstuur">
              <Button
                variant="default"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={handleSubmit}
                disabled={!input.trim() || isAnyLoading}
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

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onTypingComplete?: () => void;
}

function ChatMessageBubble({ message, onTypingComplete }: ChatMessageBubbleProps) {
  const isAssistant = message.role === 'assistant';
  const { displayedText, isTyping } = useTypewriter(
    message.content,
    isAssistant && !!message.isNew
  );

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
