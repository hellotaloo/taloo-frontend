'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { OntologySidebar } from '@/components/blocks/ontology-sidebar';
import { getOntologyEntities, getOntologyEntity } from '@/lib/ontology-api';
import type { OntologyEntity, OntologyEntitiesResponse } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// =============================================================================
// Category filter tabs
// =============================================================================

const CATEGORY_TABS = [
  { key: null, label: 'Alle' },
  { key: 'identity', label: 'Identiteit' },
  { key: 'certificate', label: 'Certificaten' },
  { key: 'financial', label: 'Financieel' },
  { key: 'other', label: 'Overig' },
] as const;

// =============================================================================
// Main Page
// =============================================================================

export default function OntologyPage() {
  const [entitiesData, setEntitiesData] = useState<OntologyEntitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Detail panel
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<OntologyEntity | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load entities
  useEffect(() => {
    setLoading(true);
    getOntologyEntities({
      type: 'document_type',
      category: activeCategory || undefined,
      limit: 200,
    })
      .then(setEntitiesData)
      .catch(() => toast.error('Kon documenttypes niet laden'))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  // Load detail when selected
  useEffect(() => {
    if (!selectedId) {
      setSelectedEntity(null);
      return;
    }
    setDetailLoading(true);
    getOntologyEntity(selectedId)
      .then(setSelectedEntity)
      .catch(() => {
        setSelectedEntity(null);
        toast.error('Kon details niet laden');
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  // Filter by search query
  const filteredItems = (entitiesData?.items || []).filter(
    (entity) =>
      entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entity.description || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCloseDetail = () => setSelectedId(null);

  const sidebar = <OntologySidebar />;

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Ontology</h1>
          </div>
        </div>
      </PageLayoutHeader>

      <PageLayoutContent
        sidebar={sidebar}
        sidebarPosition="left"
        sidebarWidth={240}
        sidebarClassName="bg-gray-50/50"
      >
        <div className="space-y-6">
          {/* Category Tabs + Search */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {CATEGORY_TABS.map(({ key, label }) => (
                <button
                  key={label}
                  onClick={() => setActiveCategory(key)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    activeCategory === key
                      ? 'bg-white text-gray-900 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  data-testid={`tab-${key || 'all'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Zoek documenttype..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-6 py-2 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-6" />
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-4 bg-gray-100 rounded w-12 ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="**:data-[slot=table-container]:overflow-hidden">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Naam</TableHead>
                    <TableHead className="text-right w-24">Subtypes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((entity, index) => (
                    <TableRow
                      key={entity.id}
                      onClick={() => setSelectedId(entity.id)}
                      className={cn(
                        'cursor-pointer transition-colors',
                        selectedId === entity.id ? 'bg-gray-50' : 'hover:bg-gray-50',
                      )}
                      data-testid={`document-row-${entity.slug}`}
                    >
                      <TableCell className="text-sm text-gray-400">
                        {index + 1}
                      </TableCell>
                      <TableCell className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{entity.name}</span>
                          {entity.is_default && (
                            <Badge variant="secondary" className="text-[11px] px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-200 shrink-0">
                              Standaard
                            </Badge>
                          )}
                          {entity.metadata?.requires_front_back === true && (
                            <Badge variant="outline" className="text-[11px] px-1.5 py-0 text-gray-500 shrink-0">
                              Voor + achter
                            </Badge>
                          )}
                          {entity.metadata?.is_verifiable === true && (
                            <Badge variant="outline" className="text-[11px] px-1.5 py-0 text-green-600 border-green-200 bg-green-50 shrink-0">
                              Verifieerbaar
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-500">
                        {entity.children_count > 0 ? entity.children_count : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-sm text-gray-500">
                        {searchQuery
                          ? `Geen resultaten voor "${searchQuery}"`
                          : 'Geen documenttypes gevonden'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </PageLayoutContent>

      {/* Detail Panel */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && handleCloseDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          <SheetHeader className="shrink-0 border-b px-6 py-4">
            <SheetTitle>{selectedEntity?.name ?? 'Laden...'}</SheetTitle>
            {selectedEntity && (
              <SheetDescription>
                <span className="capitalize">{selectedEntity.category}</span>
              </SheetDescription>
            )}
          </SheetHeader>
          {detailLoading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-48" />
              <div className="h-4 bg-gray-100 rounded w-32" />
              <div className="mt-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded w-full" />
                ))}
              </div>
            </div>
          ) : selectedEntity ? (
            <div className="flex flex-col flex-1 overflow-hidden">

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Metadata */}
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedEntity.is_default && (
                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                      Standaard
                    </Badge>
                  )}
                  {selectedEntity.metadata?.requires_front_back === true && (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      Voor + achter
                    </Badge>
                  )}
                  {selectedEntity.metadata?.is_verifiable === true && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                      Verifieerbaar
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {selectedEntity.description && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Beschrijving</p>
                    <p className="text-sm text-gray-700">{selectedEntity.description}</p>
                  </div>
                )}

                {/* Subtypes */}
                {selectedEntity.children.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                      Subtypes ({selectedEntity.children.length})
                    </p>
                    <div className="**:data-[slot=table-container]:overflow-hidden">
                      <Table className="table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Naam</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedEntity.children.map((child, i) => (
                            <TableRow key={child.id}>
                              <TableCell className="text-sm text-gray-400">
                                {i + 1}
                              </TableCell>
                              <TableCell className="text-sm text-gray-900">
                                {child.name}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {selectedEntity.children.length === 0 && (
                  <p className="text-sm text-gray-500">Geen subtypes</p>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </PageLayout>
  );
}
