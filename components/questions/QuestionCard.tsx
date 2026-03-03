'use client';

import { Card, Text, Flex, Checkbox, RadioGroup, TextArea, Badge } from '@radix-ui/themes';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Question } from '@/lib/types';

interface QuestionCardProps {
  question: Question;
  onEdit?: (question: Question) => void;
  onDelete?: (questionId: string) => void;
}

export function QuestionCard({ question, onEdit, onDelete }: QuestionCardProps) {
  const isKnockout = question.type === 'knockout';
  const borderColor = isKnockout ? 'border-l-red-500' : 'border-l-orange-500';
  const dotColor = isKnockout ? 'bg-red-500' : 'bg-orange-500';
  
  return (
    <Card className={`p-4 border-l-4 ${borderColor}`}>
      <Flex justify="between" align="start" className="mb-3">
        <Flex align="center" gap="3">
          <button className="cursor-grab hover:bg-gray-50 p-1 rounded">
            <GripVertical className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <Flex align="center" gap="2">
            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
            <Badge 
              color={isKnockout ? 'red' : 'orange'} 
              variant="soft" 
              size="1"
            >
              {isKnockout ? 'Knock-out' : 'Kwalificerend'}
            </Badge>
          </Flex>
        </Flex>
        
        <Flex gap="1">
          <button 
            className="p-1.5 rounded hover:bg-gray-50 transition-colors"
            onClick={() => onEdit?.(question)}
          >
            <Pencil className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-red-50 transition-colors"
            onClick={() => onDelete?.(question.id)}
          >
            <Trash2 className="w-4 h-4 text-[var(--text-secondary)] hover:text-red-500" />
          </button>
        </Flex>
      </Flex>

      <Text size="3" weight="medium" className="text-[var(--text-primary)] mb-3 block">
        {question.text}
      </Text>

      {/* Answer options preview */}
      <div className="mt-3 pt-3 border-t border-[var(--border)]">
        {question.answerType === 'yes_no' && (
          <Flex gap="4">
            <Flex align="center" gap="2">
              <Checkbox disabled />
              <Text size="2" className="text-[var(--text-secondary)]">Ja</Text>
            </Flex>
            <Flex align="center" gap="2">
              <Checkbox disabled />
              <Text size="2" className="text-[var(--text-secondary)]">Nee</Text>
            </Flex>
          </Flex>
        )}

        {question.answerType === 'multiple_choice' && question.options && (
          <RadioGroup.Root disabled>
            <Flex direction="column" gap="2">
              {question.options.map((option) => (
                <Flex key={option.id} align="center" gap="2">
                  <RadioGroup.Item value={option.id} />
                  <Text size="2" className="text-[var(--text-secondary)]">
                    {option.label}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </RadioGroup.Root>
        )}

        {question.answerType === 'open' && (
          <TextArea 
            placeholder="Open antwoord (max. 2 zinnen)" 
            disabled 
            size="2"
            className="resize-none"
          />
        )}
      </div>

      {question.required && (
        <Text size="1" className="text-[var(--text-secondary)] mt-2 block">
          * Verplichte vraag
        </Text>
      )}
    </Card>
  );
}
