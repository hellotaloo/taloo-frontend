'use client';

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  HelpCircle,
  X,
  FileText,
  Inbox,
  Phone,
  FileCheck,
  ScanSearch,
  SlidersHorizontal,
  Settings,
  LayoutList,
  Mic,
  type LucideIcon,
} from 'lucide-react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SystemStatus } from './SystemStatus';

type PageConfig = {
  title: string;
  icon: LucideIcon | typeof PencilSquareIcon;
};

// Map pathnames to page titles and icons
const pageConfigs: Record<string, PageConfig> = {
  '/': { title: 'Nieuw gesprek', icon: PencilSquareIcon },
  '/inbox': { title: 'Inbox', icon: Inbox },
  '/overviews': { title: 'Overzichten', icon: LayoutList },
  '/pre-screening': { title: 'Pre-screening', icon: Phone },
  '/pre-onboarding': { title: 'Pre-onboarding', icon: FileCheck },
  '/insights': { title: 'Pattern Finder', icon: ScanSearch },
  '/finetune': { title: 'Finetune', icon: SlidersHorizontal },
  '/admin': { title: 'Admin', icon: Settings },
  '/agent-settings/voice': { title: 'Voice Agent', icon: Mic },
  // Legacy routes
  '/metrics': { title: 'Pre-screening Metrics', icon: Phone },
  '/knockout-interviews': { title: 'Pre-screening', icon: Phone },
  '/search': { title: 'Zoeken', icon: ScanSearch },
  '/vacatures': { title: 'Vacatures', icon: LayoutList },
  '/kandidaten': { title: 'Kandidaten', icon: LayoutList },
  '/onboarding': { title: 'Onboarding', icon: FileCheck },
};

// Dynamic route patterns with their configs
const dynamicRoutes: Array<{ pattern: RegExp; config: PageConfig }> = [
  { pattern: /^\/pre-screening\/edit\//, config: { title: 'Pre-screening bewerken', icon: Phone } },
  { pattern: /^\/pre-screening\/view\//, config: { title: 'Pre-screening', icon: Phone } },
  { pattern: /^\/pre-screening\/generate\//, config: { title: 'Pre-screening', icon: Phone } },
  { pattern: /^\/interviews\/generate\//, config: { title: 'Interview vragen', icon: Phone } },
  { pattern: /^\/pre-onboarding\/generate\//, config: { title: 'Pre-onboarding', icon: FileCheck } },
];

const defaultConfig: PageConfig = { title: 'Nieuw tabblad', icon: FileText };

function getPageConfig(pathname: string): PageConfig {
  // Check exact match first
  if (pageConfigs[pathname]) return pageConfigs[pathname];

  // Check for dynamic routes
  for (const { pattern, config } of dynamicRoutes) {
    if (pattern.test(pathname)) return config;
  }

  return defaultConfig;
}

export function Header() {
  const pathname = usePathname();
  const { title: pageTitle, icon: PageIcon } = getPageConfig(pathname);

  return (
    <header className="h-10 bg-[#fbfbfa] border-b border-gray-200 flex items-center sticky top-0 z-10">
      {/* Mobile sidebar trigger */}
      <SidebarTrigger className="md:hidden ml-2" />

      {/* Navigation arrows */}
      <div className="flex items-center pl-3 pr-2 gap-0.5">
        <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-stretch flex-1 min-w-0 h-full">
        {/* Active tab */}
        <div className="flex items-center gap-2 px-3 bg-white border-x border-gray-200 max-w-[200px] group mb-[-1px] pb-[1px]">
          <PageIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-700 truncate">{pageTitle}</span>
          <button className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Add tab button */}
        <button className="p-1.5 mx-1 self-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* System status and Help button */}
      <div className="flex items-center gap-1 pr-3">
        <SystemStatus />
        <button className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
          <HelpCircle className="w-4 h-4" />
          <span>Hulp</span>
        </button>
      </div>
    </header>
  );
}
