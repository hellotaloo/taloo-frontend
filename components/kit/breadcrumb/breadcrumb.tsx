'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Individual breadcrumb item
 */
export interface BreadcrumbItem {
  /** Display label for the breadcrumb */
  label: string;
  /** Navigation href - omit for current page (last item) */
  href?: string;
}

export interface BreadcrumbProps {
  /** Array of breadcrumb items (parent to current) */
  items: BreadcrumbItem[];
  /**
   * Show back arrow before the first breadcrumb item.
   * If true, uses the first item's href for navigation.
   * Can also pass a custom href string.
   */
  showBackArrow?: boolean | string;
  /** Size variant — 'default' uses text-lg for the title, 'sm' uses text-sm */
  size?: 'default' | 'sm';
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Breadcrumb - Navigation component for hierarchical page structures
 *
 * Use for nested admin/settings pages where users need to navigate up the hierarchy.
 * Don't include root sections (e.g., "Admin") as they're visible in the sidebar.
 *
 * @example Basic usage with back arrow
 * ```tsx
 * <Breadcrumb
 *   showBackArrow
 *   items={[
 *     { label: 'Job Functions', href: '/admin/ontology' },
 *     { label: 'Chauffeur CE' },
 *   ]}
 * />
 * ```
 *
 * @example With custom back URL
 * ```tsx
 * <Breadcrumb
 *   showBackArrow="/dashboard"
 *   items={[
 *     { label: 'Settings', href: '/settings' },
 *     { label: 'Voice Configuration' },
 *   ]}
 * />
 * ```
 */
export function Breadcrumb({
  items,
  showBackArrow,
  size = 'default',
  className,
}: BreadcrumbProps) {
  const router = useRouter();

  // Determine back navigation URL
  const backHref =
    typeof showBackArrow === 'string' ? showBackArrow : items[0]?.href;

  const handleBackClick = () => {
    if (backHref) {
      router.push(backHref);
    }
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Back Arrow Button */}
      {showBackArrow && backHref && (
        <button
          onClick={handleBackClick}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
          data-testid="breadcrumb-back-btn"
          aria-label="Ga terug"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" className={cn('flex items-center gap-2', size === 'sm' ? 'text-sm' : 'text-lg')}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isClickable = !isLast && item.href;

          return (
            <div key={index} className="flex items-center gap-2">
              {/* Separator (not before first item) */}
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-300" />
              )}

              {/* Breadcrumb Item */}
              {isClickable ? (
                <Link
                  href={item.href!}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : isLast ? (
                <h1 className="font-semibold text-gray-900">{item.label}</h1>
              ) : (
                <span className="text-sm text-gray-400">{item.label}</span>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
