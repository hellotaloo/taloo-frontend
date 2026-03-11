'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, FileCheck, GitBranch, Clock, Hash, Tag, Layers, Plus } from 'lucide-react';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { OntologySidebar } from '@/components/blocks/ontology-sidebar';
import { OntologyDetailPanel, CATEGORY_OPTIONS } from '@/components/blocks/ontology-panel';
import { getOntologyEntities, getOntologyEntity, createOntologyEntity } from '@/lib/ontology-api';
import type { OntologyEntity, OntologyEntitiesResponse } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// =============================================================================
// Constants
// =============================================================================

const CATEGORY_TABS = [
  { key: null, label: 'Alle' },
  { key: 'identity', label: 'Identiteit' },
  { key: 'certificate', label: 'Certificaten' },
  { key: 'financial', label: 'Financieel' },
  { key: 'other', label: 'Overig' },
] as const;

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// =============================================================================
// Main Page
// =============================================================================

export default function OntologyPage() {
  const [activeObject, setActiveObject] = useState<string | null>(null);
  const [entitiesData, setEntitiesData] = useState<OntologyEntitiesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Detail panel
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<OntologyEntity | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createSlugEdited, setCreateSlugEdited] = useState(false);
  const [createCategory, setCreateCategory] = useState('identity');
  const [createSlugError, setCreateSlugError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const displaySlug = createSlugEdited ? createSlug : slugify(createName);

  // Load entities when an object is selected
  useEffect(() => {
    if (!activeObject) return;
    setLoading(true);
    getOntologyEntities({
      type: 'document_type',
      category: activeCategory || undefined,
      limit: 200,
    })
      .then(setEntitiesData)
      .catch(() => toast.error('Kon documenttypes niet laden'))
      .finally(() => setLoading(false));
  }, [activeObject, activeCategory]);

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

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const handleCloseDetail = () => setSelectedId(null);

  const handleSelectedEntityChange = (updates: Partial<OntologyEntity>) => {
    setSelectedEntity((prev) => (prev ? { ...prev, ...updates } : prev));
    // Keep list in sync for name / is_verifiable changes
    setEntitiesData((prev) =>
      prev
        ? { ...prev, items: prev.items.map((e) => (e.id === selectedId ? { ...e, ...updates } : e)) }
        : prev,
    );
  };

  const handleEntityDelete = () => {
    setEntitiesData((prev) =>
      prev
        ? { ...prev, items: prev.items.filter((e) => e.id !== selectedId), total: prev.total - 1 }
        : prev,
    );
    handleCloseDetail();
  };

  // ── Create ─────────────────────────────────────────────────────────────────

  function openCreate() {
    setCreateName('');
    setCreateSlug('');
    setCreateSlugEdited(false);
    setCreateCategory('identity');
    setCreateSlugError(null);
    setShowCreate(true);
  }

  async function handleCreate() {
    const trimName = createName.trim();
    if (!trimName) return;
    const slug = displaySlug || slugify(trimName);
    setCreateLoading(true);
    setCreateSlugError(null);
    try {
      const created = await createOntologyEntity({
        slug,
        name: trimName,
        category: createCategory,
        is_verifiable: false,
        is_default: false,
        scan_mode: 'single',
        sort_order: 0,
      });
      setEntitiesData((prev) =>
        prev
          ? { ...prev, items: [...prev.items, created], total: prev.total + 1 }
          : prev,
      );
      setShowCreate(false);
      setSelectedId(created.id);
      setSelectedEntity(created);
    } catch (err) {
      if ((err as { status?: number }).status === 409) {
        setCreateSlugError('Deze slug bestaat al — pas de naam of slug aan.');
      } else {
        toast.error('Kon documenttype niet aanmaken');
      }
    } finally {
      setCreateLoading(false);
    }
  }

  // ── Sidebar ────────────────────────────────────────────────────────────────

  const sidebar = (
    <OntologySidebar
      activeObject={activeObject}
      onSelectObject={setActiveObject}
    />
  );

  // ==========================================================================
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
        {/* Overview — no object selected */}
        {!activeObject ? (
          <div className="space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900">Overzicht</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">coming soon</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Een overzicht van alle ontology objecten en recente wijzigingen.
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: FileCheck, label: 'Documenttypes', value: '—', color: 'bg-brand-dark-blue' },
                { icon: Tag, label: 'Subtypes', value: '—', color: 'bg-brand-dark-blue' },
                { icon: GitBranch, label: 'Categorieën', value: '—', color: 'bg-brand-dark-blue' },
                { icon: Hash, label: 'Verifieerbaar', value: '—', color: 'bg-brand-dark-blue' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white border border-gray-100 rounded-xl p-5">
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-3`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Recent changes */}
            <div className="bg-white border border-gray-100 rounded-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">Recente wijzigingen</span>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Binnenkort beschikbaar</span>
              </div>
              <div className="divide-y divide-gray-50">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-7 h-7 rounded-full bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 rounded w-40" />
                      <div className="h-2.5 bg-gray-50 rounded w-24" />
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded w-12" />
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 flex items-center justify-center gap-2 border-t border-gray-50">
                <Layers className="w-4 h-4 text-gray-300" />
                <p className="text-xs text-gray-400">Wijzigingshistorie wordt hier weergegeven</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Category Tabs + Search + New button */}
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
              <div className="flex items-center gap-2">
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Zoek documenttype..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-white"
                  />
                </div>
                <Button
                  onClick={openCreate}
                  size="sm"
                  className="h-9 gap-1.5 bg-gray-900 hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4" />
                  Nieuw
                </Button>
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
                            {entity.scan_mode === 'front_back' && (
                              <Badge variant="outline" className="text-[11px] px-1.5 py-0 text-gray-500 shrink-0">
                                Voor + achter
                              </Badge>
                            )}
                            {entity.scan_mode === 'multi_page' && (
                              <Badge variant="outline" className="text-[11px] px-1.5 py-0 text-gray-500 shrink-0">
                                Meerdere pagina&apos;s
                              </Badge>
                            )}
                            {entity.is_verifiable && (
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
        )}
      </PageLayoutContent>

      {/* ── Create dialog ────────────────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nieuw documenttype</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Naam</Label>
              <Input
                id="create-name"
                autoFocus
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="bv. Rijbewijs"
              />
            </div>

            {/* Slug — shown when name is filled */}
            {createName.trim() && (
              <div className="space-y-1.5">
                <Label htmlFor="create-slug" className="text-gray-500">Slug</Label>
                <Input
                  id="create-slug"
                  value={displaySlug}
                  onChange={(e) => {
                    setCreateSlug(e.target.value);
                    setCreateSlugEdited(true);
                    setCreateSlugError(null);
                  }}
                  className={cn(createSlugError && 'border-red-400 focus-visible:ring-red-400')}
                />
                {createSlugError && (
                  <p className="text-xs text-red-500">{createSlugError}</p>
                )}
              </div>
            )}

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Categorie</Label>
              <Select value={createCategory} onValueChange={setCreateCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={createLoading}>
              Annuleren
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createName.trim() || createLoading}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {createLoading ? 'Aanmaken...' : 'Aanmaken'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Panel ─────────────────────────────────────────────────────── */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && handleCloseDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="shrink-0 border-b px-6 py-4">
            <SheetTitle>{selectedEntity?.name ?? 'Laden...'}</SheetTitle>
            {selectedEntity && (
              <SheetDescription className="capitalize">
                {CATEGORY_OPTIONS.find((o) => o.value === selectedEntity.category)?.label ?? selectedEntity.category}
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
            <OntologyDetailPanel
              key={selectedEntity.id}
              entity={selectedEntity}
              onEntityChange={handleSelectedEntityChange}
              onEntityDelete={handleEntityDelete}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </PageLayout>
  );
}
