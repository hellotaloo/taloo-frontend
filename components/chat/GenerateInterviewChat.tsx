'use client';

import { useState, useRef, useEffect } from 'react';
import { RefreshCw, Sparkles, Check, ArrowRight, ArrowUp, Square } from 'lucide-react';
import { QuestionListMessage, GeneratedQuestion } from './QuestionListMessage';
import { ThinkingIndicator } from './ThinkingIndicator';
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/prompt-kit/prompt-input';
import { Button } from '@/components/ui/button';

type ConversationState = 'greeting' | 'analyzing' | 'questions' | 'feedback';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'text' | 'questions';
  questions?: GeneratedQuestion[];
}

interface GenerateInterviewChatProps {
  vacancyTitle: string;
  onComplete?: (questions: GeneratedQuestion[]) => void;
  onQuestionsGenerated?: (questions: GeneratedQuestion[]) => void;
  interviewTitle?: string;
}

// Mock generated questions based on the operator vacancy
const mockGeneratedQuestions: GeneratedQuestion[] = [
  { id: 'k1', text: 'Heb je een technische achtergrond of ervaring met machines?', type: 'knockout' },
  { id: 'k2', text: 'Kan je werken in een 2-ploegensysteem?', type: 'knockout' },
  { id: 'k3', text: 'Woon je in de regio Diest of kan je er vlot geraken?', type: 'knockout' },
  { id: 'k4', text: 'Ben je beschikbaar voor een voltijdse betrekking?', type: 'knockout' },
  { id: 'q1', text: 'Welke ervaring heb je met het instellen of bedienen van machines?', type: 'qualifying' },
  { id: 'q2', text: 'Heb je ervaring met het oplossen van storingen?', type: 'qualifying' },
  { id: 'q3', text: 'Hoe comfortabel ben je met het aansturen van collega\'s?', type: 'qualifying' },
  { id: 'q4', text: 'Wat trekt je aan in deze functie?', type: 'qualifying' },
];

export function GenerateInterviewChat({ vacancyTitle, onComplete, onQuestionsGenerated, interviewTitle }: GenerateInterviewChatProps) {
  const [conversationState, setConversationState] = useState<ConversationState>('greeting');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: `Ik zie dat je een interview wilt aanmaken voor de vacature "${vacancyTitle}". Zal ik de vacature analyseren en screeningvragen genereren?`,
      timestamp: new Date().toISOString(),
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const addUserMessage = (content: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      type: 'text',
    };
    setMessages(prev => [...prev, userMessage]);
    return userMessage;
  };

  const addAssistantMessage = (content: string, type: 'text' | 'questions' = 'text', questions?: GeneratedQuestion[]) => {
    const assistantMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      type,
      questions,
    };
    setMessages(prev => [...prev, assistantMessage]);
    return assistantMessage;
  };

  const handleProceed = async () => {
    addUserMessage('Ja, ga verder');
    setIsLoading(true);
    setConversationState('analyzing');

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsLoading(false);
    setGeneratedQuestions(mockGeneratedQuestions);
    setConversationState('questions');

    // Notify parent of generated questions
    onQuestionsGenerated?.(mockGeneratedQuestions);

    // Add the questions message
    addAssistantMessage(
      'Op basis van de vacature heb ik de volgende screeningvragen opgesteld:',
      'questions',
      mockGeneratedQuestions
    );
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim().toLowerCase();
    const originalInput = input.trim();
    setInput('');

    // Handle different states
    if (conversationState === 'greeting') {
      if (userInput === 'ja' || userInput === 'yes' || userInput.includes('ga verder') || userInput.includes('proceed')) {
        await handleProceed();
      } else {
        addUserMessage(originalInput);
        await simulateResponse('Ik begrijp je vraag. Wil je dat ik doorga met het analyseren van de vacature en screeningvragen genereer? Typ "ja" om verder te gaan.');
      }
    } else if (conversationState === 'questions' || conversationState === 'feedback') {
      addUserMessage(originalInput);
      setConversationState('feedback');
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsLoading(false);
      addAssistantMessage(
        `Bedankt voor je feedback! Ik heb je suggestie "${originalInput}" genoteerd. Wil je nog andere aanpassingen maken, of zijn de vragen goed zo?`
      );
    }
  };

  const simulateResponse = async (response: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    addAssistantMessage(response);
  };

  const handleApprove = () => {
    addAssistantMessage('De vragen zijn goedgekeurd! Je kunt nu een agent aanmaken met deze configuratie.');
    onComplete?.(generatedQuestions);
  };

  const handleRegenerate = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    
    // Slightly modify some questions for demo purposes
    const regeneratedQuestions = mockGeneratedQuestions.map(q => ({
      ...q,
      id: `${q.id}-regen`,
    }));
    
    setGeneratedQuestions(regeneratedQuestions);
    
    // Notify parent of regenerated questions
    onQuestionsGenerated?.(regeneratedQuestions);
    
    addAssistantMessage(
      'Ik heb de vragen opnieuw gegenereerd met een frisse blik:',
      'questions',
      regeneratedQuestions
    );
  };

  // Generate a display title for the interview
  const displayTitle = interviewTitle || vacancyTitle;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with interview title */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">
          {displayTitle}       <span className="text-xs pl-2 inline-block text-gray-500">
            Diest
          </span>
        </h2>
 
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          message.type === 'questions' && message.questions ? (
            <QuestionListMessage
              key={message.id}
              questions={message.questions}
              timestamp={message.timestamp}
            />
          ) : (
            <ChatMessageBubble key={message.id} message={message} />
          )
        ))}
        
        {isLoading && (
          <div className="max-w-[610px]">
            <ThinkingIndicator />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions for greeting state */}
      {conversationState === 'greeting' && !isLoading && (
        <div className="px-6 pt-3">
          <button
            onClick={handleProceed}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
          >
            Ja, analyseer de vacature
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick actions for questions state */}
      {(conversationState === 'questions' || conversationState === 'feedback') && !isLoading && (
        <div className="px-6 pt-3">
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleRegenerate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenereer
            </button>
            <button
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Goedkeuren
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-4 pt-2">
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          className="w-full"
        >
          <PromptInputTextarea placeholder="Typ je bericht of feedback..." />

          <PromptInputActions className="flex items-center justify-end gap-2 pt-2">
            <PromptInputAction
              tooltip={isLoading ? "Stop generatie" : "Verstuur bericht"}
            >
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

function ChatMessageBubble({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant';
  
  if (isAssistant) {
    return (
      <div className="max-w-[610px]">
        <p className="text-sm text-gray-700">{message.content}</p>
      </div>
    );
  }
  
  return (
    <div className="flex justify-end">
      <div className="max-w-[610px]">
        <div className="rounded-2xl px-4 py-2.5 bg-gray-50">
          <p className="text-sm text-gray-700">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
