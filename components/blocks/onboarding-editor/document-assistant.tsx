'use client';

import { useState, useRef } from 'react';
import { ArrowUp, FileText } from 'lucide-react';
import { CollapseBox } from '@/components/kit/collapse-box';
import ReactMarkdown from 'react-markdown';
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/prompt-kit/prompt-input';
import { Button } from '@/components/ui/button';
import { Vacancy } from '@/lib/types';

interface DocumentAssistantProps {
  vacancy: Vacancy | null;
}

export function DocumentAssistant({ vacancy }: DocumentAssistantProps) {
  const [input, setInput] = useState('');
  const [isVacancyOpen, setIsVacancyOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dummyMessages = [
    {
      content: 'Welkom! Ik help je met het configureren van pre-onboarding documenten. Deze functie komt binnenkort beschikbaar.',
    },
  ];

  const handleSubmit = () => {
    // Dummy handler
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Fixed collapsible vacancy context card */}
      <div className="px-6 pt-6 pb-2">
        <CollapseBox
          title="Vacaturetekst"
          icon={FileText}
          open={isVacancyOpen}
          onOpenChange={setIsVacancyOpen}
          contentMaxHeight="400px"
        >
          {vacancy && (
            <div className="text-sm text-gray-600 prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-800 mt-3 first:mt-0 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                  li: ({ children }) => <li className="text-gray-600">{children}</li>,
                }}
              >
                {vacancy.description}
              </ReactMarkdown>
            </div>
          )}
        </CollapseBox>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {dummyMessages.map((message, index) => (
          <div key={index} className="text-sm text-gray-700 max-w-[90%]">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ))}
      </div>

      {/* Prompt hints */}
      <div className="px-6 py-2">
        <div className="flex flex-wrap gap-2">
          {[
            'Analyseer documenten',
            'Document verificatie',
            'Dubbel check',
          ].map((hint) => (
            <button
              key={hint}
              onClick={() => setInput(hint)}
              disabled
              className="inline-flex items-center px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hint}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-6 pb-4">
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={false}
          onSubmit={handleSubmit}
          className="w-full"
        >
          <PromptInputTextarea
            ref={textareaRef}
            placeholder="Geef feedback of vraag aanpassingen..."
          />

          <PromptInputActions className="flex items-center justify-end gap-2 pt-2">
            <PromptInputAction tooltip="Verstuur">
              <Button
                type="button"
                variant="default"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={handleSubmit}
                disabled
              >
                <ArrowUp className="size-3" />
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  );
}
