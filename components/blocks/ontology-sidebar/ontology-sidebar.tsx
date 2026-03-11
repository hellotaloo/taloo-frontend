'use client';

import { FileCheck, LayoutDashboard } from 'lucide-react';
import { NavItem } from '@/components/kit/nav-item';

export interface OntologySidebarProps {
  className?: string;
  activeObject?: string | null;
  onSelectObject?: (key: string | null) => void;
}

export function OntologySidebar({ className, activeObject, onSelectObject }: OntologySidebarProps) {
  return (
    <div className={`flex flex-col h-full py-4 ${className || ''}`}>
      <div className="px-2">
        <div className="mt-1 space-y-1">
          <NavItem
            icon={LayoutDashboard}
            label="Overzicht"
            active={activeObject === null}
            onClick={() => onSelectObject?.(null)}
            testId="overview"
          />
        </div>
        <div className="px-3 py-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Objects
        </div>
        <div className="mt-1 space-y-1">
          <NavItem
            icon={FileCheck}
            label="Certificaten"
            active={activeObject === 'document_type'}
            onClick={() => onSelectObject?.('document_type')}
            testId="object-document-type"
          />
        </div>
      </div>
    </div>
  );
}
