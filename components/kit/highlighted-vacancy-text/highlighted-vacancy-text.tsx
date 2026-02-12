'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HighlightedVacancyTextProps {
  text: string;
  highlightedSnippet?: string | null;
  highlightedQuestionText?: string | null;
}

/**
 * Renders vacancy text with optional highlighting of a snippet.
 * When a snippet is provided, it highlights matching text and shows
 * the related question in a tooltip on hover.
 */
export function HighlightedVacancyText({
  text,
  highlightedSnippet,
  highlightedQuestionText,
}: HighlightedVacancyTextProps) {
  // If no snippet to highlight, render plain markdown
  if (!highlightedSnippet) {
    return (
      <div className="text-sm text-gray-600 prose prose-sm max-w-none">
        <ReactMarkdown
          components={{
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-gray-800 mt-3 first:mt-0 mb-2">
                {children}
              </h3>
            ),
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>
            ),
            li: ({ children }) => <li className="text-gray-600">{children}</li>,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  }

  // Find and highlight the snippet in the text
  return (
    <div className="text-sm text-gray-600 prose prose-sm max-w-none">
      <HighlightedMarkdown
        text={text}
        snippet={highlightedSnippet}
        questionText={highlightedQuestionText}
      />
    </div>
  );
}

interface HighlightedMarkdownProps {
  text: string;
  snippet: string;
  questionText?: string | null;
}

function HighlightedMarkdown({ text, snippet, questionText }: HighlightedMarkdownProps) {
  // Find the snippet in the text (case-insensitive, normalize whitespace)
  const { beforeText, matchedText, afterText } = useMemo(() => {
    // Normalize whitespace for matching
    const normalizedSnippet = snippet.replace(/\s+/g, ' ').trim().toLowerCase();
    const normalizedText = text.replace(/\s+/g, ' ');
    const lowerText = normalizedText.toLowerCase();

    const startIndex = lowerText.indexOf(normalizedSnippet);

    if (startIndex === -1) {
      // Snippet not found - try partial match (first 50 chars)
      const partialSnippet = normalizedSnippet.slice(0, 50);
      const partialIndex = lowerText.indexOf(partialSnippet);

      if (partialIndex === -1) {
        return { beforeText: text, matchedText: '', afterText: '' };
      }

      // Find the end of the sentence/paragraph for partial match
      const endIndex = Math.min(
        partialIndex + snippet.length,
        normalizedText.length
      );

      return {
        beforeText: text.slice(0, partialIndex),
        matchedText: text.slice(partialIndex, endIndex),
        afterText: text.slice(endIndex),
      };
    }

    const endIndex = startIndex + normalizedSnippet.length;

    // Map back to original text positions (accounting for whitespace normalization)
    // This is a simplified approach - find the snippet boundaries in original text
    let originalStart = 0;
    let normalizedPos = 0;

    // Find start position in original text
    for (let i = 0; i < text.length && normalizedPos < startIndex; i++) {
      if (/\s/.test(text[i])) {
        // Skip consecutive whitespace in original
        while (i + 1 < text.length && /\s/.test(text[i + 1])) {
          i++;
        }
        normalizedPos++; // Count as single space in normalized
      } else {
        normalizedPos++;
      }
      originalStart = i + 1;
    }

    // Find end position
    let originalEnd = originalStart;
    for (
      let i = originalStart;
      i < text.length && normalizedPos < endIndex;
      i++
    ) {
      if (/\s/.test(text[i])) {
        while (i + 1 < text.length && /\s/.test(text[i + 1])) {
          i++;
        }
        normalizedPos++;
      } else {
        normalizedPos++;
      }
      originalEnd = i + 1;
    }

    return {
      beforeText: text.slice(0, originalStart),
      matchedText: text.slice(originalStart, originalEnd),
      afterText: text.slice(originalEnd),
    };
  }, [text, snippet]);

  // If no match found, render plain text
  if (!matchedText) {
    return (
      <ReactMarkdown
        components={{
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-gray-800 mt-3 first:mt-0 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>
          ),
          li: ({ children }) => <li className="text-gray-600">{children}</li>,
        }}
      >
        {text}
      </ReactMarkdown>
    );
  }

  // Render with highlight
  return (
    <div>
      {beforeText && (
        <ReactMarkdown
          components={{
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-gray-800 mt-3 first:mt-0 mb-2">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <span className="mb-2 last:mb-0">{children}</span>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-2 space-y-0.5 inline">
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li className="text-gray-600 inline">{children}</li>
            ),
          }}
        >
          {beforeText}
        </ReactMarkdown>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <mark className="bg-blue-100 text-blue-900 px-0.5 rounded cursor-help transition-colors hover:bg-blue-200">
            {matchedText}
          </mark>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-sm bg-gray-900 text-white border-0"
        >
          <p className="text-[10px] text-gray-400 mb-1">Gegenereerde vraag:</p>
          <p className="text-xs leading-relaxed">{questionText || 'Vraag'}</p>
        </TooltipContent>
      </Tooltip>
      {afterText && (
        <ReactMarkdown
          components={{
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-gray-800 mt-3 first:mt-0 mb-2">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <span className="mb-2 last:mb-0">{children}</span>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-2 space-y-0.5 inline">
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li className="text-gray-600 inline">{children}</li>
            ),
          }}
        >
          {afterText}
        </ReactMarkdown>
      )}
    </div>
  );
}
