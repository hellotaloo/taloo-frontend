'use client';

export interface GeneratedQuestion {
  id: string;
  text: string;
  type: 'knockout' | 'qualifying';
  idealAnswer?: string;
  isModified?: boolean;
  changeStatus?: 'new' | 'updated' | 'unchanged';
  /** Stable key for React reconciliation - prevents remount when id changes from temp to real */
  _stableKey?: string;
}

interface QuestionListMessageProps {
  questions: GeneratedQuestion[];
  timestamp: string;
}

export function QuestionListMessage({ questions, timestamp }: QuestionListMessageProps) {
  const knockoutQuestions = questions.filter(q => q.type === 'knockout');
  const qualifyingQuestions = questions.filter(q => q.type === 'qualifying');

  return (
    <div className="max-w-[610px]">
      <p className="text-sm text-gray-700 mb-4">
        Op basis van de vacature heb ik de volgende screeningvragen opgesteld:
      </p>
      
      {/* Knockout Questions */}
      {knockoutQuestions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Knock-out vragen
          </h4>
          <div className="space-y-2">
            {knockoutQuestions.map((question, index) => (
              <QuestionItem 
                key={question.id} 
                question={question} 
                index={index + 1}
                variant="knockout"
              />
            ))}
          </div>
        </div>
      )}

      {/* Qualifying Questions */}
      {qualifyingQuestions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Kwalificerende vragen
          </h4>
          <div className="space-y-2">
            {qualifyingQuestions.map((question, index) => (
              <QuestionItem 
                key={question.id} 
                question={question} 
                index={index + 1}
                variant="qualifying"
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-gray-700 mt-4">
        Wil je aanpassingen maken of kan ik verdergaan met deze vragen?
      </p>
    </div>
  );
}

function QuestionItem({ 
  question, 
  index, 
  variant 
}: { 
  question: GeneratedQuestion; 
  index: number;
  variant: 'knockout' | 'qualifying';
}) {
  if (variant === 'knockout') {
    return (
      <div className="bg-brand-dark-blue rounded-lg p-2">
        <p className="text-sm text-white">{question.text}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-lime-300 rounded-lg p-2">
      <p className="text-sm text-gray-800">{question.text}</p>
    </div>
  );
}
