'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ThinkingIndicatorProps {
  className?: string;
  /** Custom message to display instead of rotating phrases */
  message?: string;
  /** AI thinking/reasoning content to display */
  thinkingContent?: string;
  /** Whether to show a collapsible toggle for thinking content */
  collapsible?: boolean;
}

export function ThinkingIndicator({ 
  className = '', 
  message, 
  thinkingContent,
  collapsible = true,
}: ThinkingIndicatorProps) {
  const phrases = ['Analyseren', 'Nadenken', 'Schrijven'];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [showThinking, setShowThinking] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const contentLengthRef = useRef(0);

  useEffect(() => {
    // Only rotate if no custom message
    if (message) return;
    
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [message]);

  // Smooth auto-scroll effect - starts at top, slowly scrolls down
  // Creates the illusion of "reading" through the content like Gemini/ChatGPT
  const startSmoothScroll = useCallback(() => {
    if (!contentRef.current) return;
    
    // Clear any existing scroll interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
    
    const element = contentRef.current;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const maxScroll = scrollHeight - clientHeight;
    
    // If content doesn't overflow, no need to scroll
    if (maxScroll <= 0) return;
    
    // Start at top
    element.scrollTop = 0;
    
    // Calculate scroll speed to fill ~7 seconds
    const totalDuration = 7000; // 7 seconds
    const intervalMs = 50; // Update every 50ms for smooth animation
    const steps = totalDuration / intervalMs;
    const scrollPerStep = maxScroll / steps;
    
    let currentStep = 0;
    
    scrollIntervalRef.current = setInterval(() => {
      if (!contentRef.current) {
        if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
        return;
      }
      
      currentStep++;
      
      // Easing function for more natural movement (ease-in-out)
      const progress = currentStep / steps;
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      contentRef.current.scrollTop = easeProgress * maxScroll;
      
      // Stop when we've reached the end
      if (currentStep >= steps) {
        if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
      }
    }, intervalMs);
  }, []);

  // When new content arrives, restart the smooth scroll
  useEffect(() => {
    if (showThinking && thinkingContent) {
      // Only restart scroll when content length increases significantly
      const newLength = thinkingContent.length;
      if (newLength > contentLengthRef.current + 50) {
        contentLengthRef.current = newLength;
        // Small delay to let the DOM update
        setTimeout(startSmoothScroll, 100);
      }
    }
    
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [thinkingContent, showThinking, startSmoothScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  const displayText = message || `${phrases[phraseIndex]}...`;

  // Simple version without thinking content
  if (!thinkingContent) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        {/* Wave dots */}
        <div className="flex items-center gap-1">
          <span 
            className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" 
            style={{ animationDelay: '0ms', animationDuration: '600ms' }} 
          />
          <span 
            className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" 
            style={{ animationDelay: '200ms', animationDuration: '600ms' }} 
          />
          <span 
            className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" 
            style={{ animationDelay: '400ms', animationDuration: '600ms' }} 
          />
        </div>
        {/* Text */}
        <span className="text-sm text-gray-500 transition-opacity duration-300">
          {displayText}
        </span>
      </div>
    );
  }

  // Extended version with thinking content
  return (
    <div className={`bg-gray-50 rounded-lg p-4 space-y-3 animate-in fade-in ${className}`}>
      {/* Status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{displayText}</span>
        </div>
        
        {/* Toggle button for thinking content */}
        {collapsible && (
          <button 
            onClick={() => setShowThinking(!showThinking)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          >
            <span className="text-[10px] uppercase tracking-wide font-medium">Redenering</span>
            {showThinking ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
      
      {/* Thinking content with markdown and pulse animation */}
      {showThinking && (
        <div 
          ref={contentRef}
          className="border-l-2 border-purple-200 pl-3 max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div className="text-sm text-gray-500 leading-relaxed animate-pulse-subtle prose prose-sm prose-gray max-w-none *:text-gray-500 [&_strong]:text-gray-600 [&_strong]:font-medium">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-medium text-gray-600">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="text-gray-500">{children}</li>,
                code: ({ children }) => <code className="bg-gray-50 px-1 py-0.5 rounded text-xs">{children}</code>,
              }}
            >
              {/* Add markdown line breaks: "..." followed by capital letter becomes new line */}
              {thinkingContent.replace(/\.\.\.(?=[A-Z])/g, '...  \n')}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
