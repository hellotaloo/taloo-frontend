'use client';

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * TagBadge - A label/tag badge for categorizing items
 *
 * Design system specs:
 * - Rounded rectangle (rounded)
 * - Filled background (-500 shade)
 * - White text (or dark for light backgrounds)
 * - Optional icon on the left
 *
 * Use cases:
 * - Agent types: Pre-screening, Document Collection, Pre-onboarding
 * - Test indicators
 * - Category labels
 *
 * For status indicators (Online/Offline, In Progress, etc.), use StatusBadge instead.
 */

export type TagBadgeVariant = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';

export interface TagBadgeProps {
  /** The text label to display */
  label: string;
  /** Color variant */
  variant: TagBadgeVariant;
  /** Optional icon (displayed before label) */
  icon?: LucideIcon;
  /** Optional separate color for icon (defaults to same as text) */
  iconVariant?: TagBadgeVariant;
  /** Additional CSS classes */
  className?: string;
}

const variantStyles: Record<TagBadgeVariant, { bg: string; text: string }> = {
  blue: {
    bg: 'bg-blue-500',
    text: 'text-white',
  },
  green: {
    bg: 'bg-green-500',
    text: 'text-white',
  },
  orange: {
    bg: 'bg-orange-500',
    text: 'text-white',
  },
  red: {
    bg: 'bg-red-500',
    text: 'text-white',
  },
  purple: {
    bg: 'bg-purple-500',
    text: 'text-white',
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
  },
};

const iconColors: Record<TagBadgeVariant, string> = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  red: 'text-red-500',
  purple: 'text-purple-500',
  gray: 'text-gray-500',
};

export function TagBadge({ label, variant, icon: Icon, iconVariant, className }: TagBadgeProps) {
  const styles = variantStyles[variant];
  const iconColor = iconVariant ? iconColors[iconVariant] : undefined;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
        styles.bg,
        styles.text,
        className
      )}
    >
      {Icon && <Icon className={cn('w-3 h-3', iconColor)} />}
      {label}
    </span>
  );
}
