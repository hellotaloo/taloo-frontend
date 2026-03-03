'use client';

import { Flex, Text } from '@radix-ui/themes';
import { Bot, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/lib/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  
  return (
    <Flex gap="3" className={`${isAssistant ? '' : 'flex-row-reverse'}`}>
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
        ${isAssistant ? 'bg-blue-50' : 'bg-gray-50'}
      `}>
        {isAssistant ? (
          <Bot className="w-4 h-4 text-blue-600" />
        ) : (
          <User className="w-4 h-4 text-gray-600" />
        )}
      </div>
      
      <div className={`
        max-w-[80%] rounded-2xl px-4 py-2.5
        ${isAssistant 
          ? 'bg-white border border-[var(--border)] rounded-tl-sm' 
          : 'bg-blue-500 text-white rounded-tr-sm'
        }
      `}>
        <Text size="2" className={isAssistant ? 'text-[var(--text-primary)]' : 'text-white'}>
          {message.content}
        </Text>
        <Text 
          size="1" 
          className={`block mt-1 ${isAssistant ? 'text-[var(--text-secondary)]' : 'text-blue-100'}`}
        >
          {new Date(message.timestamp).toLocaleTimeString('nl-BE', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </div>
    </Flex>
  );
}
