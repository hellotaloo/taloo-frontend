'use client';

import { useState } from 'react';
import { ChevronDown, ExternalLink, type LucideIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export interface CollapseBoxFooterLink {
  href: string;
  label: string;
}

export interface CollapseBoxProps {
  /** Header label (e.g. "Vacaturetekst") */
  title: string;
  /** Optional icon shown left of the title */
  icon?: LucideIcon;
  /** Main content (any React node; often prose/markdown) */
  children: React.ReactNode;
  /** Optional footer link (e.g. "Bekijk in Salesforce") */
  footerLink?: CollapseBoxFooterLink;
  /** Initial open state */
  defaultOpen?: boolean;
  /** Controlled open state; when set, use onOpenChange for updates */
  open?: boolean;
  /** Called when open state changes (for controlled usage) */
  onOpenChange?: (open: boolean) => void;
  /** Optional max height for content area with scroll (e.g. "400px") */
  contentMaxHeight?: string;
  /** Additional class for the root container */
  className?: string;
  /** Additional class for the content wrapper */
  contentClassName?: string;
}

/**
 * CollapseBox is a card-style collapsible section with a header (icon + title + chevron),
 * optional scrollable content area, and optional footer link. Use for vacancy text, long
 * descriptions, or any expandable content block.
 */
export function CollapseBox({
  title,
  icon: Icon,
  children,
  footerLink,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  contentMaxHeight,
  className,
  contentClassName,
}: CollapseBoxProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className={cn('rounded-lg bg-gray-100 shadow-sm', className)}
      data-testid="collapse-box"
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between px-4 py-3 text-left transition-colors rounded-lg hover:bg-gray-200/50',
        )}
        data-testid="collapse-box-trigger"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-500 shrink-0" />}
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-500 shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div
          className={cn(
            'border-t border-gray-200/80 bg-white rounded-b-lg',
            contentMaxHeight && 'overflow-y-auto',
            contentClassName,
          )}
          style={contentMaxHeight ? { maxHeight: contentMaxHeight } : undefined}
          data-testid="collapse-box-content"
        >
          <div className="px-4 py-4">
            {children}
          </div>
          {footerLink && (
            <div className="px-4 pb-4 pt-0">
              <a
                href={footerLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                data-testid="collapse-box-footer-link"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                {footerLink.label}
              </a>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
