import { cn } from '@/lib/utils';

/**
 * Page layout header with optional title, description, custom content, and action slot.
 *
 * Supports two modes:
 * 1. Simple mode: Pass `title` and `description` props for basic headers
 * 2. Custom mode: Pass `children` for complex header content
 *
 * Always renders a full-width divider after the header content.
 *
 * @example Simple header
 * ```tsx
 * <PageLayoutHeader
 *   title="Pre-screening"
 *   description="Overzicht van je conversationele pre-screening"
 * />
 * ```
 *
 * @example Header with action
 * ```tsx
 * <PageLayoutHeader
 *   title="Insights"
 *   description="Ontdek verborgen patronen"
 *   action={
 *     <div className="flex items-center gap-2">
 *       <Users className="w-4 h-4" />
 *       <span>Gebaseerd op 2.4k screenings</span>
 *     </div>
 *   }
 * />
 * ```
 *
 * @example Custom header
 * ```tsx
 * <PageLayoutHeader>
 *   <div className="flex items-center justify-between">
 *     <div className="flex items-center gap-2">
 *       <h1>{vacancy.title}</h1>
 *       <StatusBadge />
 *     </div>
 *     <Switch />
 *   </div>
 * </PageLayoutHeader>
 * ```
 */
export interface PageLayoutHeaderProps {
  /** Page title (simple mode) */
  title?: string;
  /** Page description (simple mode) */
  description?: string;
  /** Custom header content (overrides title/description) */
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
  return (
    <>
      <div className={cn("px-6 py-6", className)}>
        {children ? (
          children
        ) : (
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              )}
              {description && (
                <p className="text-sm text-gray-500">{description}</p>
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
