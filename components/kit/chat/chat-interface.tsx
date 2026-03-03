'use client';

import { useState, useRef, useEffect } from 'react';
import { Flex, TextField, IconButton, Text, Button } from '@radix-ui/themes';
import { Send, RefreshCw, Check, Sparkles } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { ChatMessage as ChatMessageType } from '@/lib/types';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string) => void;
  onApprove?: () => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
}

export function ChatInterface({ 
  messages, 
  onSendMessage, 
  onApprove,
  onRegenerate,
  isLoading = false 
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)] rounded-lg border border-[var(--border)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-white rounded-t-lg">
        <Flex align="center" gap="2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <Text size="2" weight="medium" className="text-[var(--text-primary)]">
            AI Feedback Assistent
          </Text>
        </Flex>
        <Text size="1" className="text-[var(--text-secondary)] mt-0.5">
          Geef feedback om de vragen aan te passen
        </Text>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <Flex gap="3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            </div>
            <div className="bg-white border border-[var(--border)] rounded-2xl rounded-tl-sm px-4 py-2.5">
              <Text size="2" className="text-[var(--text-secondary)]">
                Aan het nadenken...
              </Text>
            </div>
          </Flex>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="px-4 py-2 border-t border-[var(--border)] bg-white">
        <Flex gap="2">
          <Button 
            variant="soft" 
            size="1" 
            onClick={onRegenerate}
            disabled={isLoading}
          >
            <RefreshCw className="w-3 h-3" />
            Regenereer
          </Button>
          <Button 
            variant="soft" 
            color="blue"
            size="1" 
            onClick={onApprove}
            disabled={isLoading}
          >
            <Check className="w-3 h-3" />
            Goedkeuren
          </Button>
        </Flex>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white rounded-b-lg border-t border-[var(--border)]">
        <Flex gap="2">
          <TextField.Root 
            placeholder="Typ je feedback..." 
            size="2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <IconButton 
            type="submit"
            size="2" 
            disabled={!input.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="w-4 h-4" />
          </IconButton>
        </Flex>
      </form>
    </div>
  );
}
