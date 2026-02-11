'use client';

import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
  isOnline: boolean | null | undefined;
  className?: string;
}

/**
 * Status badge component showing online/offline/concept status
 * - isOnline === true: Online (green)
 * - isOnline === false: Offline (gray)
 * - isOnline === null/undefined: Concept/Draft (amber)
 */
export function StatusBadge({ isOnline, className }: StatusBadgeProps) {
  if (isOnline === true) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700",
        className
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Online
      </span>
    );
  }

  if (isOnline === false) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600",
        className
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Offline
      </span>
    );
  }

  // isOnline === null means draft (not published yet)
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700",
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Concept
    </span>
  );
}
