'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  FileText,
  ClipboardList,
  Search,
  History,
  GitBranch,
  ChevronRight,
  Boxes,
  Globe2,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { NavItem } from '@/components/kit/nav-item';
import { getLucideIcon } from '@/lib/ontology-utils';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import type { OntologyType, OntologyNavigationEntry } from '@/lib/types';

export interface OntologySidebarProps {
  // Browse mode
  activeSection: string;
  onSectionChange: (section: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  entityTypes?: OntologyType[];
  onCreateEntity?: () => void;
  onGraphClick?: () => void;
  className?: string;

  // Entity mode
  mode?: 'browse' | 'entity';
  entityName?: string;
  entityTypeName?: string;
  onBack?: () => void;
  navigationStack?: OntologyNavigationEntry[];
  onBreadcrumbJump?: (index: number) => void;
  entityTabs?: Array<{
    id: string;
    label: string;
    icon: LucideIcon;
    count?: number;
    dividerBefore?: boolean;
  }>;
  activeEntityTab?: string;
  onEntityTabChange?: (tabId: string) => void;
  onAddEntity?: () => void;
}

export function OntologySidebar({
  mode = 'browse',
  ...props
}: OntologySidebarProps) {
  if (mode === 'entity') {
    return <EntityModeSidebar {...props} />;
  }
  return <BrowseModeSidebar {...props} />;
}

// =============================================================================
// Browse Mode (default)
// =============================================================================

function BrowseModeSidebar({
  activeSection,
  onSectionChange,
  searchQuery,
  onSearchChange,
  entityTypes,
  onCreateEntity,
  onGraphClick,
  className,
}: OntologySidebarProps) {
  const [resourcesOpen, setResourcesOpen] = useState(true);

  return (
    <div className={`flex flex-col h-full py-4 ${className || ''}`}>
      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Zoeken..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="px-2 space-y-1">
        <NavItem
          icon={Search}
          label="Ontdekken"
          active={activeSection === 'discover'}
          onClick={() => onSectionChange('discover')}
          testId="discover"
        />
        <NavItem
          icon={History}
          label="Geschiedenis"
          active={activeSection === 'history'}
          onClick={() => onSectionChange('history')}
          testId="history"
        />
        {onGraphClick && (
          <NavItem
            icon={GitBranch}
            label="Graph"
            active={activeSection === 'graph'}
            onClick={onGraphClick}
            testId="graph"
          />
        )}
      </div>

      {/* Object Types Section */}
      <Collapsible open={resourcesOpen} onOpenChange={setResourcesOpen}>
        <div className="mt-6 px-2">
          <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <ChevronRight
              className={`w-3 h-3 transition-transform ${resourcesOpen ? 'rotate-90' : ''}`}
            />
            Object Types
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1 space-y-1">
              {entityTypes && entityTypes.length > 0 ? (
                entityTypes.map((type) => (
                  <NavItem
                    key={type.slug}
                    icon={getLucideIcon(type.icon)}
                    label={type.name_plural || type.name}
                    count={type.entity_count}
                    active={activeSection === type.slug}
                    onClick={() => onSectionChange(type.slug)}
                    testId={type.slug}
                  />
                ))
              ) : (
                <>
                  <NavItem
                    icon={Boxes}
                    label="Categorieën"
                    count={0}
                    active={activeSection === 'categories'}
                    onClick={() => onSectionChange('categories')}
                    testId="categories"
                  />
                  <NavItem
                    icon={Briefcase}
                    label="Functies"
                    count={0}
                    active={activeSection === 'job-functions'}
                    onClick={() => onSectionChange('job-functions')}
                    testId="job-functions"
                  />
                  <NavItem
                    icon={FileText}
                    label="Documenten"
                    count={0}
                    active={activeSection === 'documents'}
                    onClick={() => onSectionChange('documents')}
                    testId="documents"
                  />
                  <NavItem
                    icon={Globe2}
                    label="Vaardigheden"
                    count={0}
                    active={activeSection === 'skills'}
                    onClick={() => onSectionChange('skills')}
                    testId="skills"
                  />
                  <NavItem
                    icon={ClipboardList}
                    label="Vereisten"
                    count={0}
                    active={activeSection === 'requirements'}
                    onClick={() => onSectionChange('requirements')}
                    testId="requirements"
                  />
                </>
              )}
              {onCreateEntity && (
                <button
                  onClick={onCreateEntity}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  data-testid="add-entity-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nieuw object
                </button>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}

// =============================================================================
// Entity Mode
// =============================================================================

function EntityModeSidebar({
  entityTypeName,
  onBack,
  navigationStack = [],
  onBreadcrumbJump,
  entityTabs,
  activeEntityTab,
  onEntityTabChange,
  onAddEntity,
  className,
}: OntologySidebarProps) {
  return (
    <div className={`flex flex-col h-full py-4 ${className || ''}`}>
      {/* Breadcrumb trail */}
      <SidebarBreadcrumb
        entityTypeName={entityTypeName}
        navigationStack={navigationStack}
        onBack={onBack!}
        onBreadcrumbJump={onBreadcrumbJump || (() => {})}
      />

      {/* Divider */}
      <div className="border-t border-gray-200 mx-4 mb-4" />

      {/* Entity tabs */}
      <div className="px-2 space-y-1">
        {entityTabs?.map((tab) => (
          <div key={tab.id}>
            {tab.dividerBefore && (
              <div className="border-t border-gray-200 mx-3 my-2" />
            )}
            <NavItem
              icon={tab.icon}
              label={tab.label}
              count={tab.count}
              active={activeEntityTab === tab.id}
              onClick={() => onEntityTabChange?.(tab.id)}
              testId={`entity-tab-${tab.id}`}
            />
          </div>
        ))}
        {onAddEntity && (
          <button
            onClick={onAddEntity}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            data-testid="add-entity-detail-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            Object relatie toevoegen
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sidebar Breadcrumb
// =============================================================================

interface SidebarBreadcrumbProps {
  entityTypeName?: string;
  navigationStack: OntologyNavigationEntry[];
  onBack: () => void;
  onBreadcrumbJump: (index: number) => void;
}

function SidebarBreadcrumb({
  entityTypeName,
  navigationStack,
  onBack,
  onBreadcrumbJump,
}: SidebarBreadcrumbProps) {
  // Total segments = root type + stack entries
  // e.g., Categorieën → Transport → (current entity in detail pane)
  const totalSegments = 1 + navigationStack.length;

  return (
    <div className="px-2 mb-2">
      <div className="flex items-center gap-1.5 px-3 py-2 min-w-0">
        {/* Back arrow */}
        <button
          onClick={onBack}
          className="shrink-0 flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-700 transition-colors"
          data-testid="sidebar-back-btn"
          aria-label="Ga terug"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Breadcrumb — shows full ancestor trail (root + stack), not the current entity */}
        <nav className="flex items-center gap-1 min-w-0 text-sm" aria-label="Navigatie">
          {totalSegments <= 2 ? (
            // Show all segments inline: ← Categorieën  or  ← Categorieën › Transport
            <>
              <button
                onClick={() => onBreadcrumbJump(-1)}
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors truncate max-w-[100px]"
                title={entityTypeName}
              >
                {entityTypeName}
              </button>
              {navigationStack.length > 0 && (
                <>
                  <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
                  <button
                    onClick={() => onBreadcrumbJump(0)}
                    className="text-gray-500 hover:text-gray-700 transition-colors truncate"
                    title={navigationStack[0].name}
                  >
                    {navigationStack[0].name}
                  </button>
                </>
              )}
            </>
          ) : (
            // 3+ segments: ← ··· › Last Stack Entry
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors font-medium px-1"
                    data-testid="breadcrumb-ancestors-btn"
                    aria-label="Toon volledige navigatie"
                  >
                    &middot;&middot;&middot;
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="start" className="w-56 p-2">
                  <div className="space-y-0.5">
                    {/* Root (type list) */}
                    <button
                      onClick={() => onBreadcrumbJump(-1)}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {entityTypeName}
                    </button>
                    {/* All stack entries except the last (shown inline) */}
                    {navigationStack.slice(0, -1).map((entry, i) => (
                      <button
                        key={entry.id}
                        onClick={() => onBreadcrumbJump(i)}
                        className="w-full text-left px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors pl-5"
                      >
                        {entry.name}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
              <button
                onClick={() => onBreadcrumbJump(navigationStack.length - 1)}
                className="text-gray-500 hover:text-gray-700 transition-colors truncate"
                title={navigationStack[navigationStack.length - 1].name}
              >
                {navigationStack[navigationStack.length - 1].name}
              </button>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
