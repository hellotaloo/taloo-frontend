'use client';

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import {
  ChevronLeft,
  Plus,
  Camera,
  Mic,
  Send,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useScreeningChat } from '@/hooks/use-screening-chat';
import { useSimulationChat } from '@/hooks/use-simulation-chat';
import type { SimulationPersona } from '@/lib/types';

// Parse markdown-style bold (**text**) into React elements
function parseMarkdownBold(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isOutgoing: boolean;
  status?: 'sent' | 'delivered' | 'read';
  isNew?: boolean;
}

export type ChatScenario = 'idle' | 'pass' | 'fail' | 'manual';

interface WhatsAppChatProps {
  scenario?: ChatScenario;
  resetKey?: number;
  vacancyId?: string;
  candidateName?: string;
  isActive?: boolean; // Only start conversation when active (visible)
}

// Pass scenario - candidate qualifies
const passScript: Omit<Message, 'id' | 'isNew'>[] = [
  {
    content: 'Hoi Laurijn! Leuk dat je hebt gesolliciteerd! Ik ben Izzy, de digitale recruiter van Taloo. Ik help je graag verder met een paar korte vragen. Ben je klaar?',
    timestamp: '21:20',
    isOutgoing: false,
  },
  {
    content: 'Hoi! Ja, ik ben er klaar voor',
    timestamp: '21:21',
    isOutgoing: true,
    status: 'read',
  },
  {
    content: 'Super! Laten we beginnen.\n\nMijn eerste vraag: Kun je binnen 2 weken starten?',
    timestamp: '21:21',
    isOutgoing: false,
  },
  {
    content: 'Ja, ik kan direct beginnen',
    timestamp: '21:22',
    isOutgoing: true,
    status: 'read',
  },
  {
    content: 'Fijn om te horen!\n\nHeb je een geldig rijbewijs B?',
    timestamp: '21:22',
    isOutgoing: false,
  },
  {
    content: 'Ja, al meer dan 5 jaar',
    timestamp: '21:23',
    isOutgoing: true,
    status: 'read',
  },
  {
    content: 'Perfect! En beschik je over een eigen wagen?',
    timestamp: '21:23',
    isOutgoing: false,
  },
  {
    content: 'Ja, die heb ik',
    timestamp: '21:24',
    isOutgoing: true,
    status: 'read',
  },
  {
    content: 'Uitstekend! Je voldoet aan alle vereisten. We plannen een gesprek met de recruiter. Je ontvangt binnenkort een uitnodiging!',
    timestamp: '21:24',
    isOutgoing: false,
  },
];

// Fail scenario - candidate gets knocked out
const failScript: Omit<Message, 'id' | 'isNew'>[] = [
  {
    content: 'Hoi Laurijn! Leuk dat je hebt gesolliciteerd! Ik ben Izzy, de digitale recruiter van Taloo. Ik help je graag verder met een paar korte vragen. Ben je klaar?',
    timestamp: '21:20',
    isOutgoing: false,
  },
  {
    content: 'Hoi! Ja, ik ben er klaar voor',
    timestamp: '21:21',
    isOutgoing: true,
    status: 'read',
  },
  {
    content: 'Super! Laten we beginnen.\n\nMijn eerste vraag: Kun je binnen 2 weken starten?',
    timestamp: '21:21',
    isOutgoing: false,
  },
  {
    content: 'Nee, ik moet nog 2 maanden opzeg doen',
    timestamp: '21:22',
    isOutgoing: true,
    status: 'read',
  },
  {
    content: 'Bedankt voor je eerlijke antwoord. Helaas zoeken we iemand die sneller kan starten.\n\nWil je dat we je op de hoogte houden van andere vacatures die beter passen?',
    timestamp: '21:22',
    isOutgoing: false,
  },
  {
    content: 'Ja, graag!',
    timestamp: '21:23',
    isOutgoing: true,
    status: 'read',
  },
  {
    content: 'Top! We houden je op de hoogte. Succes met je zoektocht!',
    timestamp: '21:23',
    isOutgoing: false,
  },
];

export function WhatsAppChat({ 
  scenario = 'pass', 
  resetKey = 0,
  vacancyId,
  candidateName = 'Test Kandidaat',
  isActive = true,
}: WhatsAppChatProps) {
  // State for scripted scenarios (pass/fail without vacancyId)
  const [scriptedMessages, setScriptedMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Hook for real API chat in manual mode
  const screeningChat = useScreeningChat(vacancyId || '');
  
  // Hook for simulation API (pass/fail with vacancyId)
  const simulationChat = useSimulationChat(vacancyId || '');
  
  // Determine which mode we're in:
  // - simulation mode: pass/fail scenarios WITH a vacancyId (uses real simulation API)
  // - api mode: manual scenario WITH a vacancyId (interactive chat)
  // - scripted mode: pass/fail scenarios WITHOUT vacancyId (uses hardcoded scripts)
  const isSimulationMode = (scenario === 'pass' || scenario === 'fail') && !!vacancyId;
  const isApiMode = scenario === 'manual' && !!vacancyId;
  const isScriptedMode = (scenario === 'pass' || scenario === 'fail') && !vacancyId;
  
  // Get the right persona for simulation
  const getSimulationPersona = (): SimulationPersona => {
    if (scenario === 'pass') return 'qualified';
    if (scenario === 'fail') return 'unqualified';
    return 'qualified';
  };
  
  // Use appropriate messages based on mode
  const messages = isSimulationMode 
    ? simulationChat.messages 
    : isApiMode 
      ? screeningChat.messages 
      : scriptedMessages;
  const setMessages = isScriptedMode ? setScriptedMessages : undefined;

  // Select the appropriate script based on scenario (for scripted mode fallback)
  const conversationScript = scenario === 'fail' ? failScript : passScript;

  // Track the last reset key to prevent duplicate starts
  const lastResetKeyRef = useRef<number | null>(null);
  const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when scenario, resetKey, or isActive changes
  useEffect(() => {
    // Don't do anything if not active (tab not visible)
    if (!isActive) {
      return;
    }
    
    // Reset scripted messages
    setScriptedMessages([]);
    setCurrentIndex(0);
    setIsTyping(false);
    setInputValue('');
    
    // Clear any pending start timeout
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    
    // Reset simulation chat if in simulation mode
    if (isSimulationMode) {
      simulationChat.reset();
      
      // Reset the ref so we can start fresh
      lastResetKeyRef.current = null;
      
      // Start simulation with appropriate persona
      const currentResetKey = resetKey;
      startTimeoutRef.current = setTimeout(() => {
        if (lastResetKeyRef.current === currentResetKey) {
          return; // Already started for this resetKey
        }
        lastResetKeyRef.current = currentResetKey;
        const persona = getSimulationPersona();
        simulationChat.startSimulation(persona, undefined, candidateName);
      }, 50);
    }
    // Reset API chat if in API mode (manual + vacancyId)
    else if (isApiMode) {
      screeningChat.resetChat();
      
      // Reset the ref so we can start fresh (needed when switching tabs)
      lastResetKeyRef.current = null;
      
      // Use a small delay and ref to prevent duplicate starts when clicking rapidly
      const currentResetKey = resetKey;
      startTimeoutRef.current = setTimeout(() => {
        // Only start if this is still the latest reset
        if (lastResetKeyRef.current === currentResetKey) {
          return; // Already started for this resetKey
        }
        lastResetKeyRef.current = currentResetKey;
        screeningChat.startConversation(candidateName);
      }, 50);
    } else {
      lastResetKeyRef.current = null;
    }
    
    // For manual mode without API (fallback to scripted first message)
    if (scenario === 'manual' && !vacancyId) {
      const firstMessage = passScript[0];
      const newMessage: Message = {
        ...firstMessage,
        id: 'msg-0',
        isNew: true,
      };
      setScriptedMessages([newMessage]);
      setCurrentIndex(passScript.length); // Set to end to prevent auto-progression
      
      // Remove the "isNew" flag after animation completes
      setTimeout(() => {
        setScriptedMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id ? { ...msg, isNew: false } : msg
          )
        );
      }, 400);
    }
    
    // Cleanup timeout on unmount or re-run
    return () => {
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, resetKey, vacancyId, isActive]);

  // Scroll to bottom with smooth animation
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  // Add next message from script (only for scripted scenarios)
  const addNextMessage = useCallback(() => {
    if (currentIndex >= conversationScript.length) return;

    const nextMessage = conversationScript[currentIndex];
    const newMessage: Message = {
      ...nextMessage,
      id: `msg-${currentIndex}`,
      isNew: true,
    };

    setScriptedMessages(prev => [...prev, newMessage]);
    setCurrentIndex(prev => prev + 1);

    // Remove the "isNew" flag after animation completes
    setTimeout(() => {
      setScriptedMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, isNew: false } : msg
        )
      );
    }, 400);
  }, [currentIndex, conversationScript]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Simulate conversation (only for scripted scenarios, not API or simulation mode)
  useEffect(() => {
    // Don't run scripted simulation in API mode or simulation mode
    if (isApiMode || isSimulationMode) return;
    if (currentIndex >= conversationScript.length) return;

    const nextMessage = conversationScript[currentIndex];
    const isAgentMessage = !nextMessage.isOutgoing;
    
    // Calculate delay based on message type
    const baseDelay = currentIndex === 0 ? 1000 : 1500;
    const typingDelay = isAgentMessage ? 800 : 400;
    
    // Show typing indicator for agent messages
    if (isAgentMessage && currentIndex > 0) {
      const typingTimer = setTimeout(() => {
        setIsTyping(true);
      }, baseDelay - typingDelay);

      const messageTimer = setTimeout(() => {
        setIsTyping(false);
        addNextMessage();
      }, baseDelay);

      return () => {
        clearTimeout(typingTimer);
        clearTimeout(messageTimer);
      };
    } else {
      const timer = setTimeout(() => {
        addNextMessage();
      }, baseDelay);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, conversationScript, addNextMessage, isApiMode, isSimulationMode]);

  // Auto-resize textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 100);
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputValue]);


  return (
    <div 
      className="flex flex-col h-full"
      style={{
        backgroundColor: '#efeae2',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cdc4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* iOS Status bar - aligned with Dynamic Island */}
      <div className="bg-[#f6f6f6] px-6 flex items-center justify-between text-black text-sm font-semibold h-[50px]">
        <span className="mt-1">22:07</span>
        <div className="flex items-center gap-1 mt-1">
          <div className="flex gap-0.5 items-end">
            <div className="w-[3px] h-[4px] bg-black rounded-sm" />
            <div className="w-[3px] h-[6px] bg-black rounded-sm" />
            <div className="w-[3px] h-[8px] bg-black rounded-sm" />
            <div className="w-[3px] h-[10px] bg-black rounded-sm" />
          </div>
          <svg className="w-4 h-3 ml-1" viewBox="0 0 16 12" fill="currentColor">
            <path d="M8 0C5.5 0 3.2 1 1.5 2.7L0 1.2V6h4.8L3 4.2C4.3 2.9 6.1 2 8 2s3.7.9 5 2.2L15 3C13.3 1.2 11 0 8 0z"/>
            <path d="M8 4C6.4 4 5 4.6 3.9 5.7L2.5 4.3 4.8 6H0v4.8L1.5 9.3C3.2 11 5.5 12 8 12s4.8-1 6.5-2.7L16 10.8V6h-4.8L13 7.8C11.7 9.1 9.9 10 8 10s-3.7-.9-5-2.2L1 6h10.2L13 4.2C11.7 2.9 9.9 2 8 2V4z" opacity="0"/>
          </svg>
          <div className="ml-1 flex items-center">
            <div className="w-[22px] h-[11px] border border-black rounded-[3px] relative flex items-center p-px">
              <div className="bg-black rounded-sm h-full" style={{ width: '100%' }} />
            </div>
            <div className="w-px h-[4px] bg-black rounded-r-sm ml-px" />
          </div>
        </div>
      </div>

      {/* WhatsApp header - iOS style (light) */}
      <div className="bg-[#f6f6f6] px-1 py-1 flex items-center gap-2 border-b border-gray-200">
        <button className="flex items-center text-[#007AFF]">
          <ChevronLeft className="w-7 h-7" />
          <span className="text-sm">83</span>
        </button>
        
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden ml-1">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-red-400 to-pink-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
        </div>
        
        {/* Contact info */}
        <div className="flex-1 min-w-0">
          <p className="text-black font-semibold text-sm truncate">Izzy</p>
          <p className="text-gray-500 text-[10px]">ITZY</p>
        </div>
      </div>

      {/* Chat messages area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scroll-smooth scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`
              flex ${message.isOutgoing ? 'justify-end' : 'justify-start'} mb-1
              ${message.isNew ? 'animate-message-in' : ''}
            `}
            style={{
              animation: message.isNew 
                ? 'messageSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' 
                : undefined,
            }}
          >
            <div
              className={`
                max-w-[85%] rounded-[18px] px-3 py-2 relative
                ${message.isOutgoing 
                  ? 'bg-[#dcf8c6]' 
                  : 'bg-white'
                }
              `}
              style={{
                boxShadow: '0 1px 0.5px rgba(0, 0, 0, 0.1)',
              }}
            >
              <p className="text-[15px] text-black leading-[20px] whitespace-pre-wrap">
                {parseMarkdownBold(message.content)}
              </p>
              
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className="text-[11px] text-gray-500">
                  {message.timestamp}
                </span>
                {message.isOutgoing && message.status && (
                  <span className="text-[#53bdeb]">
                    {message.status === 'read' ? (
                      <CheckCheck className="w-[18px] h-[18px]" />
                    ) : (
                      <Check className="w-[18px] h-[18px]" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {(isTyping || (isApiMode && screeningChat.isLoading) || (isSimulationMode && simulationChat.isRunning)) && (
          <div 
            className="flex justify-start mb-1"
            style={{
              animation: 'messageSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <div className="bg-white rounded-[18px] px-3 py-2.5" style={{ boxShadow: '0 1px 0.5px rgba(0, 0, 0, 0.1)' }}>
              <div className="flex gap-[3px]">
                <div className="w-[5px] h-[5px] bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                <div className="w-[5px] h-[5px] bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
                <div className="w-[5px] h-[5px] bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
              </div>
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* CSS for message animation and scrollbar hiding */}
      <style jsx>{`
        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Input area - iOS style */}
      <div className="bg-[#f6f6f6] px-1.5 py-1.5 flex items-end gap-0.5 border-t border-gray-200">
        <button className="h-9 pr-1 flex items-center justify-center text-gray-500 shrink-0">
          <Plus className="w-6 h-6" />
        </button>
        
        <div className="flex-1 flex items-center bg-white rounded-[18px] border border-gray-300 min-h-[36px] max-h-[120px] pl-2 pr-2 py-1.5">
          <textarea
            ref={textareaRef}
            placeholder="Message"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && isApiMode) {
                e.preventDefault();
                if (inputValue.trim() && !screeningChat.isLoading) {
                  screeningChat.sendMessage(inputValue.trim());
                  setInputValue('');
                }
              }
            }}
            rows={1}
            className="flex-1 bg-transparent outline-none text-sm text-black placeholder:text-gray-400 leading-[22px] resize-none overflow-y-auto py-0"
            style={{ minHeight: '22px', maxHeight: '84px' }}
          />

        </div>
        
        <button className="h-9 pl-1 flex items-center justify-center text-gray-500 shrink-0">
          <Camera className="w-5 h-5" />
        </button>
        
        <button 
          className="h-9 pl-1 flex items-center justify-center text-gray-500 shrink-0"
          onClick={() => {
            if (isApiMode && inputValue.trim() && !screeningChat.isLoading) {
              screeningChat.sendMessage(inputValue.trim());
              setInputValue('');
            }
          }}
        >
          {inputValue.trim() ? (
            <Send className="w-5 h-5 text-[#007AFF]" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Bottom safe area / home indicator */}
      <div className="bg-[#f6f6f6] h-5 flex items-center justify-center">
        <div className="w-32 h-1 bg-black rounded-full" />
      </div>
    </div>
  );
}
