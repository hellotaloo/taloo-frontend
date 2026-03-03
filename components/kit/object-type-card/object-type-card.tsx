'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ObjectTypeCardProps {
  /** Unique identifier */
  id: string;
  /** Display name (Dutch) */
  name: string;
  /** English name */
  nameEn: string;
  /** Count of items, null if not available */
  count: number | null;
  /** Icon component */
  icon: React.ElementType;
  /** Color classes for the icon container (e.g., 'bg-blue-100 text-blue-600') */
  color: string;
  /** Description text */
  description: string;
  /** Whether this is a coming soon feature */
  comingSoon?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Animation delay in ms for staggered animations */
  animationDelay?: number;
  /** Additional class name */
  className?: string;
}

export function ObjectTypeCard({
  id,
  name,
  nameEn,
  count,
  icon: Icon,
  color,
  description,
  comingSoon,
  onClick,
  animationDelay = 0,
  className,
}: ObjectTypeCardProps) {
  return (
    <div
      onClick={comingSoon ? undefined : onClick}
      data-testid={`object-type-card-${id}`}
      className={cn(
        'relative rounded-xl border bg-white p-5 transition-all',
        comingSoon
          ? 'border-gray-100 opacity-60 cursor-not-allowed'
          : 'border-gray-200 hover:border-gray-300 cursor-pointer',
        className
      )}
      style={animationDelay > 0 ? { animation: `fade-in-up 0.3s ease-out ${animationDelay}ms backwards` } : undefined}
    >
      {comingSoon && (
        <Badge
          variant="secondary"
          className="absolute top-3 right-3 text-xs bg-gray-50"
        >
          Binnenkort
        </Badge>
      )}
      <div
        className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', color)}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{name}</h3>
      <p className="text-xs text-gray-400 mb-2">{nameEn}</p>
      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{description}</p>
      {count !== null ? (
        <p className="text-sm font-medium text-gray-700">{count} types</p>
      ) : (
        <p className="text-sm text-gray-400">Coming soon</p>
      )}
    </div>
  );
}
