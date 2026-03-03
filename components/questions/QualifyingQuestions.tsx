'use client';

import { Heading, Text, Flex } from '@radix-ui/themes';
import { Star } from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import { Question } from '@/lib/types';

interface QualifyingQuestionsProps {
  questions: Question[];
  onEdit?: (question: Question) => void;
  onDelete?: (questionId: string) => void;
}

export function QualifyingQuestions({ questions, onEdit, onDelete }: QualifyingQuestionsProps) {
  const qualifyingQuestions = questions.filter(q => q.type === 'qualifying');

  return (
    <div className="space-y-4">
      <Flex align="center" gap="2">
        <div className="p-1.5 bg-brand-dark-blue rounded">
          <Star className="w-4 h-4 text-white" />
        </div>
        <div>
          <Heading size="3" className="text-[var(--text-primary)]">
            Kwalificerende vragen
          </Heading>
          <Text size="1" className="text-[var(--text-secondary)]">
            Fit & attitude - helpt bij het beoordelen van de kandidaat
          </Text>
        </div>
      </Flex>

      <div className="space-y-3">
        {qualifyingQuestions.map((question) => (
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
