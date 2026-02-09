'use client';

import { ReactNode } from 'react';

interface TimelineProps {
  children: ReactNode;
  className?: string;
}

export function Timeline({ children, className = '' }: TimelineProps) {
  return (
    <div className={`relative pl-6 ${className}`}>
      {/* Continuous timeline line */}
      <div
        className="absolute left-[7px] top-3 bottom-3 w-px border-l-2 border-dashed border-gray-300"
        style={{ animation: `fade-in 0.8s ease-out backwards` }}
      />
      {children}
    </div>
  );
}
