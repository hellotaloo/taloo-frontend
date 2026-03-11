'use client';

import { FileCheck } from 'lucide-react';
import { NavItem } from '@/components/kit/nav-item';

export interface OntologySidebarProps {
  className?: string;
}

export function OntologySidebar({ className }: OntologySidebarProps) {
  return (
    <div className={`flex flex-col h-full py-4 ${className || ''}`}>
      <div className="px-2">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Objects
        </div>
        <div className="mt-1 space-y-1">
          <NavItem
            icon={FileCheck}
            label="Certificaten"
            active
            onClick={() => {}}
            testId="object-document-type"
          />
        </div>
      </div>
    </div>
  );
}
