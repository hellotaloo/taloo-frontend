'use client';

import { ReactNode } from 'react';

interface TimelineNodeProps {
  children: ReactNode;
  animationDelay?: number;
  isLast?: boolean;
  alignDot?: 'top' | 'center';
  dotColor?: 'default' | 'green' | 'orange';
}

export function TimelineNode({
  children,
  animationDelay = 0,
  isLast = false,
  alignDot = 'center',
  dotColor = 'default',
}: TimelineNodeProps) {
  const dotPosition = alignDot === 'top' ? 'top-3' : 'top-1/2 -translate-y-1/2';

  const dotColorClasses = {
    default: 'bg-white border-gray-300',
    green: 'bg-green-100 border-green-500',
    orange: 'bg-orange-100 border-orange-400',
  };

  const innerDotColorClasses = {
    default: 'bg-gray-400',
    green: 'bg-green-500',
    orange: 'bg-orange-400',
  };

  return (
    <div
      className="relative py-3"
      style={{ animation: `fade-in-up 0.6s ease-out ${animationDelay}ms backwards` }}
    >
      {/* Timeline dot */}
      <div
        className={`absolute left-[-24px] ${dotPosition} w-4 h-4 rounded-full border-2 flex items-center justify-center ${dotColorClasses[dotColor]}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${innerDotColorClasses[dotColor]}`} />
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}
