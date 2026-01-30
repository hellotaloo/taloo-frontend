'use client';

import { useState, useEffect } from 'react';

interface ThinkingIndicatorProps {
  className?: string;
  /** Custom message to display instead of rotating phrases */
  message?: string;
}

export function ThinkingIndicator({ className = '', message }: ThinkingIndicatorProps) {
  const phrases = ['Analyseren', 'Nadenken', 'Schrijven'];
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    // Only rotate if no custom message
    if (message) return;
    
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [message]);

  const displayText = message || `${phrases[phraseIndex]}...`;

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
