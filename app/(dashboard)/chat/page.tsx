'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Briefcase, Star, Clock, RotateCcw, Sparkles } from 'lucide-react';
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/prompt-kit/prompt-input';
import { Button } from '@/components/ui/button';
import { ThinkingIndicator } from '@/components/kit/chat';
import ReactMarkdown from 'react-markdown';
import { queryAnalyst, AnalystSSEEvent } from '@/lib/analyst-api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isNew?: boolean;
}

// Get time-based greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

// Widget data matching the mockup using brand colors
const widgets = [
  {
    id: 'vacatures',
    icon: Briefcase,
    title: 'Open vacatures',
    value: '47',
    subtitle: 'Totaal',
    bgColor: 'bg-brand-light-blue',
    textColor: 'text-brand-dark-blue',
    chartColor: '#022641',
  },
  {
    id: 'aanvragen',
    icon: Star,
    title: 'Nieuwe aanvragen',
    value: '+16%',
    subtitle: 'Week',
    bgColor: 'bg-brand-lime-green',
    textColor: 'text-brand-dark-blue',
    chartColor: '#022641',
  },
  {
    id: 'uurcoefficient',
    icon: Clock,
    title: 'Uurcoefficient',
    value: 'x1.8',
    subtitle: 'Gem',
    bgColor: 'bg-brand-dark-blue',
    textColor: 'text-white',
    chartType: 'bar' as const,
  },
];

// Simple line chart SVG for widgets
function MiniLineChart({ color }: { color: string }) {
  return (
    <div className="flex-1 w-full flex items-center">
      <svg 
        viewBox="0 0 100 40" 
        className="w-full h-12"
        preserveAspectRatio="none"
      >
        <path
          d="M 0 30 Q 15 25, 25 28 T 50 22 T 75 18 T 100 25"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// Simple bar chart for widgets
function MiniBarChart() {
  return (
    <div className="flex-1 flex items-end gap-1">
      <div className="w-8 h-4 bg-white/40 rounded-sm" />
      <div className="w-8 h-6 bg-white/70 rounded-sm" />
    </div>
  );
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

function ChatMessageBubble({ message, onTypingComplete }: { message: ChatMessage; onTypingComplete?: () => void }) {
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

export default function HomePage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [thinkingContent, setThinkingContent] = useState('');
  const [extendedThinking, setExtendedThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);

  // Only hide welcome when messages have been sent
  const showWelcome = messages.length === 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const markMessageAsOld = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, isNew: false } : msg
      )
    );
  };

  const handleSSEEvent = (event: AnalystSSEEvent) => {
    if (event.type === 'status') {
      setStatus(event.message || '');
    } else if (event.type === 'thinking') {
      // Append thinking content as it streams in
      setThinkingContent(prev => prev + (event.content || ''));
    } else if (event.type === 'error') {
      console.error('Analyst error:', event.message);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const question = input.trim();
    setInput('');

    setIsLoading(true);
    setStatus('Vraag analyseren...');
    setThinkingContent(''); // Reset thinking content for new query

    try {
      const { message, sessionId } = await queryAnalyst(
        question,
        handleSSEEvent,
        {
          sessionId: sessionIdRef.current,
          extendedThinking,
        }
      );

      sessionIdRef.current = sessionId;

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: message,
        timestamp: new Date().toISOString(),
        isNew: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to query analyst:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Er is een fout opgetreden. Controleer of de backend draait en probeer het opnieuw.',
        timestamp: new Date().toISOString(),
        isNew: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStatus('');
      setThinkingContent(''); // Clear thinking content when done
    }
  };

  const startNewConversation = () => {
    sessionIdRef.current = undefined;
    setMessages([]);
    setStatus('');
    setThinkingContent('');
  };

  return (
    <div className="flex flex-col h-full -m-6 bg-white">
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-y-auto px-6 py-4">
        {/* Welcome state with greeting and widgets */}
        {showWelcome ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl">
              {/* Greeting */}
              <h1 className="text-4xl font-serif  text-gray-900 mb-8">
                {getGreeting()} Laurijn
              </h1>

              {/* Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className={`
                      ${widget.bgColor} ${widget.textColor}
                      rounded-xl p-5 h-[200px] flex flex-col
                    `}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <widget.icon className="w-4 h-4 opacity-80" />
                      <span className="text-sm font-medium opacity-90">
                        {widget.title}
                      </span>
                    </div>
                    
                    {widget.chartType === 'bar' ? (
                      <MiniBarChart />
                    ) : (
                      <MiniLineChart color={widget.chartColor || 'white'} />
                    )}
                    
                    <div className="mt-auto flex items-end justify-between">
                      <span className="text-base font-normal">{widget.value}</span>
                      <span className="text-sm opacity-70">{widget.subtitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages area */
          <div className="w-full max-w-3xl mx-auto flex-1 space-y-4">
            {/* New conversation button */}
            <div className="flex justify-end">
              <button
                onClick={startNewConversation}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Nieuw gesprek
              </button>
            </div>
            
            {messages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                onTypingComplete={() => markMessageAsOld(message.id)}
              />
            ))}
            
            {isLoading && (
              <ThinkingIndicator 
                message={status || undefined} 
                thinkingContent={thinkingContent || undefined}
              />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat input - always visible at bottom */}
      <div className="w-full max-w-3xl mx-auto px-6 pb-4">
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          className="w-full"
        >
          <PromptInputTextarea
            ref={textareaRef}
            placeholder="Stel een vraag of plan een opdracht. / voor prompts, @ voor context"
          />

          <PromptInputActions className="flex items-center justify-between pt-2">
            {/* Extended thinking toggle */}
            <PromptInputAction tooltip={extendedThinking ? "Extended thinking aan" : "Extended thinking uit"}>
              <button
                type="button"
                onClick={() => setExtendedThinking(!extendedThinking)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all
                  ${extendedThinking 
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                    : 'text-gray-500 hover:bg-gray-200'
                  }
                `}
              >
                <Sparkles className={`size-3.5 ${extendedThinking ? 'text-purple-600' : ''}`} />
                <span>Extended</span>
              </button>
            </PromptInputAction>

            {/* Submit button */}
            <PromptInputAction tooltip={isLoading ? "Stop generatie" : "Verstuur bericht"}>
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleSubmit}
                disabled={!input.trim() && !isLoading}
              >
                {isLoading ? (
                  <Square className="size-4 fill-current" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  );
}
