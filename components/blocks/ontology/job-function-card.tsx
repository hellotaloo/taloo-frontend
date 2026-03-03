'use client';

import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface JobFunctionCardProps {
  /** Unique identifier */
  id: string;
  /** URL slug */
  slug: string;
  /** Display name */
  name: string;
  /** Icon component */
  icon: React.ElementType;
  /** Number of associated documents */
  documentCount: number;
  /** Number of associated vacancies */
  vacancyCount: number;
  /** Category slug for navigation */
  categorySlug: string;
  /** Category display name */
  categoryName: string;
  /** Category badge color classes */
  categoryColor: string;
  /** Description text */
  description: string;
  /** Click handler for the card */
  onClick?: () => void;
  /** Click handler for the category badge */
  onCategoryClick?: (slug: string) => void;
  /** Animation delay in ms for staggered animations */
  animationDelay?: number;
  /** Additional class name */
  className?: string;
}

export function JobFunctionCard({
  slug,
  name,
  icon: Icon,
  documentCount,
  vacancyCount,
  categorySlug,
  categoryName,
  categoryColor,
  description,
  onClick,
  onCategoryClick,
  animationDelay = 0,
  className,
}: JobFunctionCardProps) {
  const handleCategoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCategoryClick) {
      onCategoryClick(categorySlug);
    }
  };

  return (
    <div
      onClick={onClick}
      data-testid={`job-function-card-${slug}`}
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-all cursor-pointer group',
        className
      )}
      style={
        animationDelay > 0
          ? { animation: `fade-in-up 0.3s ease-out ${animationDelay}ms backwards` }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{name}</h4>
            <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-gray-500 mb-2 line-clamp-1">{description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={cn('text-xs hover:opacity-80 cursor-pointer', categoryColor)}
              onClick={handleCategoryClick}
            >
              {categoryName}
            </Badge>
            <span className="text-xs text-gray-400">{documentCount} docs</span>
            <span className="text-xs text-gray-400">{vacancyCount} vacancies</span>
          </div>
        </div>
      </div>
    </div>
  );
}
