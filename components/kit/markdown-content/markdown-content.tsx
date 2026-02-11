'use client';

import { cn } from '@/lib/utils';

export interface MarkdownContentProps {
  /** The markdown content string to render */
  content: string;
  /** Additional class for the wrapper */
  className?: string;
}

/**
 * Simple markdown renderer for vacancy descriptions and similar content.
 * Supports:
 * - ### Headers (h4)
 * - - List items (ul)
 * - Regular paragraphs
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let key = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1 mb-3">
          {currentList.map((item, i) => (
            <li key={i} className="text-gray-600 text-sm">{item}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={key++} className="font-semibold text-gray-900 mt-4 mb-2 first:mt-0 text-sm">
          {trimmed.slice(4)}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={key++} className="font-semibold text-gray-900 mt-4 mb-2 first:mt-0 text-sm">
          {trimmed.slice(3)}
        </h3>
      );
    } else if (trimmed.startsWith('- ')) {
      currentList.push(trimmed.slice(2));
    } else if (trimmed.startsWith('* ')) {
      currentList.push(trimmed.slice(2));
    } else if (trimmed) {
      flushList();
      elements.push(
        <p key={key++} className="mb-3 text-gray-600 text-sm last:mb-0">{trimmed}</p>
      );
    }
  }

  flushList();

  return <div className={cn('prose-sm', className)}>{elements}</div>;
}
