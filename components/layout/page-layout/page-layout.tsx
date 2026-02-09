import { cn } from '@/lib/utils';

/**
 * Root page layout wrapper with fixed height and negative margin.
 *
 * This component provides the base container for pages that use the standard
 * layout pattern with header, divider, and scrollable content.
 *
 * @example
 * ```tsx
 * <PageLayout>
 *   <PageLayoutHeader title="My Page" description="Page description" />
 *   <PageLayoutContent>
 *     <MyContent />
 *   </PageLayoutContent>
 * </PageLayout>
 * ```
 */
export interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn("flex flex-col h-[calc(100vh-40px)] -m-6", className)}>
      {children}
    </div>
  );
}
