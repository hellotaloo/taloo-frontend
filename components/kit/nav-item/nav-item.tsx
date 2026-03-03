'use client';

import { cn } from '@/lib/utils';

export interface NavItemProps {
  /** Icon component */
  icon: React.ElementType;
  /** Display label */
  label: string;
  /** Optional count badge */
  count?: number;
  /** Whether the item is active/selected */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Test ID suffix (will be prefixed with 'nav-item-') */
  testId?: string;
  /** Additional class name */
  className?: string;
}

export function NavItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
  testId,
  className,
}: NavItemProps) {
  return (
    <button
      onClick={onClick}
      data-testid={testId ? `nav-item-${testId}` : undefined}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
        active
          ? 'bg-gray-900 text-white font-medium'
          : 'text-gray-600 hover:bg-gray-50',
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className={cn('text-xs', active ? 'text-white/70' : 'text-gray-400')}>
          {count}
        </span>
      )}
    </button>
  );
}
