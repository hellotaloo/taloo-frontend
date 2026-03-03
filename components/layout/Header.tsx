'use client';

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  HelpCircle,
  X,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SystemStatus } from './SystemStatus';
import { getPageConfig } from '@/lib/page-registry';

/**
 * Application header with page tab bar.
 *
 * The page title and icon are determined by the current pathname
 * using the page registry at `lib/page-registry.ts`.
 *
 * If a page shows "Nieuw tabblad", add it to the page registry!
 */
export function Header() {
  const pathname = usePathname();
  const { title: pageTitle, icon: PageIcon } = getPageConfig(pathname);

  return (
    <header className="h-10 bg-[#fbfbfa] border-b border-gray-200 flex items-center sticky top-0 z-10">
      {/* Mobile sidebar trigger */}
      <SidebarTrigger className="md:hidden ml-2" />

      {/* Navigation arrows */}
      <div className="flex items-center pl-3 pr-2 gap-0.5">
        <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Page tab bar - title comes from lib/page-registry.ts */}
      <div className="flex items-stretch flex-1 min-w-0 h-full">
        {/* Active tab */}
        <div className="flex items-center gap-2 px-3 bg-white border-x border-gray-200 max-w-[200px] group mb-[-1px] pb-[1px]">
          <PageIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-700 truncate">{pageTitle}</span>
          <button className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Add tab button */}
        <button className="p-1.5 mx-1 self-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* System status and Help button */}
      <div className="flex items-center gap-1 pr-3">
        <SystemStatus />
        <button className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors">
          <HelpCircle className="w-4 h-4" />
          <span>Hulp</span>
        </button>
      </div>
    </header>
  );
}
