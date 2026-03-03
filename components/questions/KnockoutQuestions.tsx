'use client';

import { Heading, Text, Flex } from '@radix-ui/themes';
import { AlertCircle } from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import { Question } from '@/lib/types';

interface KnockoutQuestionsProps {
  questions: Question[];
  onEdit?: (question: Question) => void;
  onDelete?: (questionId: string) => void;
}

export function KnockoutQuestions({ questions, onEdit, onDelete }: KnockoutQuestionsProps) {
  const knockoutQuestions = questions.filter(q => q.type === 'knockout');

  return (
    <div className="space-y-4">
      <Flex align="center" gap="2">
        <div className="p-1.5 bg-red-500 rounded">
          <AlertCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <Heading size="3" className="text-[var(--text-primary)]">
            Knock-out vragen
          </Heading>
          <Text size="1" className="text-[var(--text-secondary)]">
            Must-haves - kandidaat wordt afgewezen bij "Nee"
          </Text>
        </div>
      </Flex>

      <div className="space-y-3">
        {knockoutQuestions.map((question) => (
          <QuestionCard 
            key={question.id} 
            question={question}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
