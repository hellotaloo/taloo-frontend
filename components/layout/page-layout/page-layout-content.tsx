import { cn } from '@/lib/utils';

/**
 * Page layout content area with optional sidebar.
 *
 * The main content area is scrollable with hidden scrollbars. The sidebar
 * is optional and can be positioned on the left or right with configurable width.
 * On mobile, the sidebar is automatically hidden.
 *
 * @example No sidebar
 * ```tsx
 * <PageLayoutContent>
 *   <div className="grid grid-cols-4 gap-4">...</div>
 *   <Tabs>...</Tabs>
 * </PageLayoutContent>
 * ```
 *
 * @example With sidebar
 * ```tsx
 * <PageLayoutContent
 *   sidebar={<ChatAssistant />}
 *   sidebarWidth={420}
 * >
 *   <HeroInsight />
 *   <InsightCards />
 * </PageLayoutContent>
 * ```
 *
 * @example Custom sidebar width
 * ```tsx
 * <PageLayoutContent
 *   sidebar={<InterviewAssistant />}
 *   sidebarWidth={500}
 * >
 *   <InterviewQuestionsPanel />
 * </PageLayoutContent>
 * ```
 */
export interface PageLayoutContentProps {
  /** Main content */
  children: React.ReactNode;
  /** Optional sidebar content */
  sidebar?: React.ReactNode;
  /** Sidebar width in pixels (number) or custom class (string). Default: 420 */
  sidebarWidth?: number | string;
  /** Sidebar position. Default: 'right' */
  sidebarPosition?: 'left' | 'right';
  /** Additional classes for the container */
  className?: string;
  /** Additional classes for the content area */
  contentClassName?: string;
  /** Additional classes for the sidebar */
  sidebarClassName?: string;
}

export function PageLayoutContent({
  children,
  sidebar,
  sidebarWidth = 420,
  sidebarPosition = 'right',
  className,
  contentClassName,
  sidebarClassName,
}: PageLayoutContentProps) {
  // Convert numeric width to Tailwind arbitrary value
  const sidebarWidthClass =
    typeof sidebarWidth === 'number' ? `w-[${sidebarWidth}px]` : sidebarWidth;

  const renderContent = () => (
    <div
      className={cn(
        'flex-1 overflow-y-auto p-6 min-h-0',
        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        contentClassName
      )}
    >
      {children}
    </div>
  );

  const renderSidebar = () =>
    sidebar ? (
      <div
        className={cn(
          'hidden lg:flex flex-col border-gray-200 min-h-0',
          sidebarWidthClass,
          sidebarPosition === 'left' ? 'border-r' : 'border-l',
          sidebarClassName
        )}
      >
        {sidebar}
      </div>
    ) : null;

  return (
    <div className={cn('flex flex-1 min-h-0', className)}>
      {sidebarPosition === 'left' && renderSidebar()}
      {renderContent()}
      {sidebarPosition === 'right' && renderSidebar()}
    </div>
  );
}
