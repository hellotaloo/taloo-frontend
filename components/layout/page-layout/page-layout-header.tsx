'use client';

import { cn } from '@/lib/utils';
import { usePageConfig } from '@/hooks/use-page-config';

/**
 * Page layout header with automatic title from page registry.
 *
 * Title and description are automatically resolved from `lib/page-registry.ts`
 * based on the current pathname. You can override them with explicit props.
 *
 * @example Auto header (title/description from registry)
 * ```tsx
 * <PageLayoutHeader />
 * ```
 *
 * @example Auto header with action
 * ```tsx
 * <PageLayoutHeader
 *   action={<Button>Settings</Button>}
 * />
 * ```
 *
 * @example Custom header
 * ```tsx
 * <PageLayoutHeader>
 *   <div className="flex items-center gap-2">
 *     <h1>{vacancy.title}</h1>
 *     <StatusBadge />
 *   </div>
 * </PageLayoutHeader>
 * ```
 */
export interface PageLayoutHeaderProps {
  /** Page title (overrides registry title) */
  title?: string;
  /** Page description (overrides registry description) */
  description?: string;
  /** Custom header content (overrides title/description entirely) */
  children?: React.ReactNode;
  /** Right-aligned action element (button, toggle, info, etc.) */
  action?: React.ReactNode;
  /** Additional classes for the header container */
  className?: string;
}

export function PageLayoutHeader({
  title,
  description,
  children,
  action,
  className,
}: PageLayoutHeaderProps) {
  const pageConfig = usePageConfig();

  const resolvedTitle = title ?? pageConfig.title;
  const resolvedDescription = description ?? pageConfig.description;

  return (
    <>
      <div className={cn("px-6 py-4", className)}>
        {children ? (
          children
        ) : (
          <div className="flex items-center justify-between">
            <div>
              {resolvedTitle && (
                <h1 className="text-lg font-semibold text-gray-900">{resolvedTitle}</h1>
              )}
              {resolvedDescription && (
                <p className="text-sm text-gray-500">{resolvedDescription}</p>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
      </div>
      <div className="border-t border-gray-200" />
    </>
  );
}
