'use client';

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StatusBadge - A pill-shaped badge for displaying status indicators
 *
 * Design system specs:
 * - Pill shape (rounded-full)
 * - No background (transparent)
 * - Solid border in matching color (-600 shade)
 * - Text in matching color (-600 shade)
 * - Dot indicator when no icon is provided
 * - Icon replaces dot when provided
 */

export type StatusBadgeVariant = 'blue' | 'green' | 'orange' | 'red' | 'gray';

export interface StatusBadgeProps {
  /** The text label to display */
  label: string;
  /** Color variant */
  variant: StatusBadgeVariant;
  /** Optional icon (replaces the dot indicator) */
  icon?: LucideIcon;
  /** Additional CSS classes */
  className?: string;
}

const variantStyles: Record<StatusBadgeVariant, { border: string; text: string; dot: string }> = {
  blue: {
    border: 'border-blue-600',
    text: 'text-blue-600',
    dot: 'bg-blue-600',
  },
  green: {
    border: 'border-green-500',
    text: 'text-green-500',
    dot: 'bg-green-500',
  },
  orange: {
    border: 'border-orange-600',
    text: 'text-orange-600',
    dot: 'bg-orange-600',
  },
  red: {
    border: 'border-red-600',
    text: 'text-red-600',
    dot: 'bg-red-600',
  },
  gray: {
    border: 'border-gray-400',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
};

export function StatusBadge({ label, variant, icon: Icon, className }: StatusBadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border',
        styles.border,
        styles.text,
        className
      )}
    >
      {Icon ? (
        <Icon className="w-3 h-3" />
      ) : (
        <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
      )}
      {label}
    </span>
  );
}
