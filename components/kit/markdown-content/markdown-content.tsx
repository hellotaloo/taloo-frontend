'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface MarkdownContentProps {
  /** The markdown or HTML content string to render */
  content: string;
  /** Additional class for the wrapper */
  className?: string;
}

const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*?>/i;

/** Convert HTML string to simple markdown */
function htmlToMarkdown(html: string): string {
  let md = html;

  // Normalize line breaks
  md = md.replace(/\r\n?/g, '\n');

  // Block elements → newlines
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/p>/gi, '\n\n');
  md = md.replace(/<p[^>]*>/gi, '');
  md = md.replace(/<\/div>/gi, '\n');
  md = md.replace(/<div[^>]*>/gi, '');

  // Headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n');

  // Lists: convert <li> to "- " items
  md = md.replace(/<\/li>/gi, '\n');
  md = md.replace(/<li[^>]*>/gi, '- ');
  md = md.replace(/<\/?[ou]l[^>]*>/gi, '\n');

  // Inline formatting
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  md = md.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '$1');
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Decode common HTML entities
  md = md.replace(/&#39;/g, "'");
  md = md.replace(/&#x27;/g, "'");
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&nbsp;/g, ' ');

  // Strip any remaining tags
  md = md.replace(/<[^>]+>/g, '');

  // Clean up excessive blank lines
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

/**
 * Renders vacancy descriptions and similar content.
 * Automatically detects HTML and converts it to markdown first.
 * Supports: headers, lists, bold, italic, paragraphs.
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const markdown = useMemo(
    () => (HTML_TAG_REGEX.test(content) ? htmlToMarkdown(content) : content),
    [content]
  );

  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
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

  /** Render inline markdown (bold, italic) within a text string */
  const renderInline = (text: string): React.ReactNode => {
    // Match **bold** and *italic*
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    if (parts.length === 1) return text;

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('#### ')) {
      flushList();
      elements.push(
        <h5 key={key++} className="font-semibold text-gray-900 mt-4 mb-2 first:mt-0 text-sm">
          {renderInline(trimmed.slice(5))}
        </h5>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={key++} className="font-semibold text-gray-900 mt-4 mb-2 first:mt-0 text-sm">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={key++} className="font-semibold text-gray-900 mt-4 mb-2 first:mt-0 text-sm">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h3 key={key++} className="font-bold text-gray-900 mt-4 mb-2 first:mt-0 text-base">
          {renderInline(trimmed.slice(2))}
        </h3>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(renderInline(trimmed.slice(2)));
    } else if (trimmed) {
      flushList();
      elements.push(
        <p key={key++} className="mb-3 text-gray-600 text-sm last:mb-0">{renderInline(trimmed)}</p>
      );
    }
  }

  flushList();

  return <div className={cn('prose-sm', className)}>{elements}</div>;
}
