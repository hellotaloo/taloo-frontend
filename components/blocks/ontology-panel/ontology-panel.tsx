'use client';

import { useState } from 'react';
import { Trash2, GripVertical, Plus, Check, X, Pencil } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { OntologyVerification } from '@/components/blocks/ontology-verification';
import { OntologyExtraction } from '@/components/blocks/ontology-extraction';
import {
  patchOntologyEntity,
  deleteOntologyEntity,
  createOntologyEntity,
} from '@/lib/ontology-api';
import type { OntologyEntity, OntologyChildEntity, ScanMode } from '@/lib/types';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────

export const SCAN_MODE_OPTIONS: { value: ScanMode; label: string }[] = [
  { value: 'single', label: '1 foto' },
  { value: 'front_back', label: 'Voor- en achterkant' },
  { value: 'multi_page', label: "Meerdere pagina's" },
];

export const CATEGORY_OPTIONS = [
  { value: 'identity', label: 'Identiteit' },
  { value: 'certificate', label: 'Certificaat' },
  { value: 'financial', label: 'Financieel' },
  { value: 'other', label: 'Overige' },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

async function createChildWithRetry(
  name: string,
  parentId: string,
  category: string,
  sortOrder: number,
): Promise<OntologyEntity> {
  const base = slugify(name);
  for (let i = 0; i < 5; i++) {
    const slug = i === 0 ? base : `${base}_${i + 1}`;
    try {
      return await createOntologyEntity({ slug, name, parent_id: parentId, category, sort_order: sortOrder });
    } catch (err) {
      if (i < 4 && (err as { status?: number }).status === 409) continue;
      throw err;
    }
  }
  throw new Error('Slug conflict');
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OntologyDetailPanelProps {
  entity: OntologyEntity;
  onEntityChange: (updates: Partial<OntologyEntity>) => void;
  onEntityDelete: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OntologyDetailPanel({
  entity,
  onEntityChange,
  onEntityDelete,
}: OntologyDetailPanelProps) {
  const isParent = entity.parent_id === null;

  // Core fields edit mode
  const [editingCore, setEditingCore] = useState(false);

  // Name editing
  const [nameValue, setNameValue] = useState(entity.name);

  // Children state (managed locally after load)
  const [children, setChildren] = useState<OntologyChildEntity[]>(entity.children);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editingChildName, setEditingChildName] = useState('');
  const [addingChild, setAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [childSaving, setChildSaving] = useState(false);

  // ── Name ──────────────────────────────────────────────────────────────────

  async function handleNameBlur() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === entity.name) {
      setNameValue(entity.name);
      return;
    }
    try {
      await patchOntologyEntity(entity.id, { name: trimmed });
      onEntityChange({ name: trimmed });
    } catch {
      setNameValue(entity.name);
      toast.error('Kon naam niet opslaan');
    }
  }

  // ── Category ──────────────────────────────────────────────────────────────

  async function handleCategoryChange(value: string) {
    const prev = entity.category;
    onEntityChange({ category: value });
    try {
      await patchOntologyEntity(entity.id, { category: value });
    } catch {
      onEntityChange({ category: prev });
      toast.error('Kon categorie niet opslaan');
    }
  }

  // ── Scan mode ─────────────────────────────────────────────────────────────

  async function handleScanModeChange(value: ScanMode) {
    const prev = entity.scan_mode;
    onEntityChange({ scan_mode: value });
    try {
      await patchOntologyEntity(entity.id, { scan_mode: value });
    } catch {
      onEntityChange({ scan_mode: prev });
      toast.error('Kon scanmodus niet opslaan');
    }
  }

  // ── is_default ────────────────────────────────────────────────────────────

  async function handleIsDefaultChange(value: boolean) {
    const prev = entity.is_default;
    onEntityChange({ is_default: value });
    try {
      await patchOntologyEntity(entity.id, { is_default: value });
    } catch {
      onEntityChange({ is_default: prev });
      toast.error('Kon instelling niet opslaan');
    }
  }

  // ── Delete parent ─────────────────────────────────────────────────────────

  async function handleDelete() {
    try {
      await deleteOntologyEntity(entity.id);
      onEntityDelete();
    } catch {
      toast.error('Kon documenttype niet verwijderen');
    }
  }

  // ── Child edit ────────────────────────────────────────────────────────────

  async function saveChildName(child: OntologyChildEntity) {
    const trimmed = editingChildName.trim();
    setEditingChildId(null);
    if (!trimmed || trimmed === child.name) return;
    try {
      await patchOntologyEntity(child.id, { name: trimmed });
      setChildren((prev) => prev.map((c) => (c.id === child.id ? { ...c, name: trimmed } : c)));
    } catch {
      toast.error('Kon naam niet opslaan');
    }
  }

  async function handleDeleteChild(childId: string) {
    try {
      await deleteOntologyEntity(childId);
      setChildren((prev) => prev.filter((c) => c.id !== childId));
      onEntityChange({ children_count: entity.children_count - 1 });
    } catch {
      toast.error('Kon subtype niet verwijderen');
    }
  }

  async function handleAddChild() {
    const trimmed = newChildName.trim();
    if (!trimmed) {
      setAddingChild(false);
      setNewChildName('');
      return;
    }
    setChildSaving(true);
    try {
      const created = await createChildWithRetry(trimmed, entity.id, entity.category, children.length);
      setChildren((prev) => [
        ...prev,
        {
          id: created.id,
          slug: created.slug,
          name: created.name,
          category: created.category,
          sort_order: created.sort_order,
          metadata: created.metadata,
        },
      ]);
      onEntityChange({ children_count: entity.children_count + 1 });
      setNewChildName('');
      setAddingChild(false);
    } catch {
      toast.error('Kon subtype niet aanmaken');
    } finally {
      setChildSaving(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const categoryLabel = CATEGORY_OPTIONS.find((o) => o.value === entity.category)?.label ?? entity.category;
  const scanModeLabel = SCAN_MODE_OPTIONS.find((o) => o.value === entity.scan_mode)?.label ?? entity.scan_mode;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto">

        {/* ── Core fields ──────────────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gegevens</p>
            <button
              onClick={() => {
                setNameValue(entity.name);
                setEditingCore((v) => !v);
              }}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded-md transition-colors',
                editingCore
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
              )}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          {editingCore ? (
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-400">Naam</label>
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleNameBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') setNameValue(entity.name);
                  }}
                  className="w-full text-sm text-gray-900 bg-background border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Category — parent only */}
              {isParent && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-400">Categorie</label>
                  <Select value={entity.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="h-9 text-sm">
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
              )}

              {/* Scan mode — parent only */}
              {isParent && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-400">Scanmodus</label>
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {SCAN_MODE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleScanModeChange(opt.value)}
                        className={cn(
                          'flex-1 px-2 py-1.5 text-xs rounded-md transition-colors text-center',
                          entity.scan_mode === opt.value
                            ? 'bg-white text-gray-900 shadow-sm font-medium'
                            : 'text-gray-500 hover:text-gray-700',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* is_default — parent only */}
              {isParent && (
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={`default-${entity.id}`}
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    Standaard aangevraagd bij kandidaten
                  </Label>
                  <Switch
                    id={`default-${entity.id}`}
                    checked={entity.is_default}
                    onCheckedChange={handleIsDefaultChange}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">Naam</span>
                <span className="text-sm text-gray-900">{entity.name}</span>
              </div>
              {isParent && (
                <>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-gray-400 w-20 shrink-0">Categorie</span>
                    <span className="text-sm text-gray-900">{categoryLabel}</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-gray-400 w-20 shrink-0">Scanmodus</span>
                    <span className="text-sm text-gray-900">{scanModeLabel}</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-gray-400 w-20 shrink-0">Standaard</span>
                    <span className="text-sm text-gray-900">{entity.is_default ? 'Ja' : 'Nee'}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* Verification + Extraction — parent only */}
          {isParent && (
            <>
              <OntologyVerification entity={entity} onEntityChange={onEntityChange} />
              <Separator />
              <OntologyExtraction entity={entity} onEntityChange={onEntityChange} />
              <Separator />
            </>
          )}

          {/* ── Subtypes ─────────────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Subtypes{children.length > 0 ? ` (${children.length})` : ''}
            </p>

            <div className="space-y-0.5">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-50 -mx-2"
                >
                  <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0" />

                  {editingChildId === child.id ? (
                    <input
                      autoFocus
                      value={editingChildName}
                      onChange={(e) => setEditingChildName(e.target.value)}
                      onBlur={() => saveChildName(child)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setEditingChildId(null);
                      }}
                      className="flex-1 text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-gray-900 outline-none py-0.5"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingChildId(child.id);
                        setEditingChildName(child.name);
                      }}
                      className="flex-1 text-sm text-gray-900 text-left truncate"
                    >
                      {child.name}
                    </button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Subtype verwijderen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &ldquo;{child.name}&rdquo; wordt verwijderd.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteChild(child.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Verwijderen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}

              {children.length === 0 && !addingChild && (
                <p className="text-sm text-gray-400 py-1">Geen subtypes</p>
              )}

              {/* New child row */}
              {addingChild && (
                <div className="flex items-center gap-2 py-1.5 px-2 -mx-2">
                  <GripVertical className="w-3.5 h-3.5 text-gray-200 shrink-0" />
                  <input
                    autoFocus
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddChild();
                      if (e.key === 'Escape') {
                        setAddingChild(false);
                        setNewChildName('');
                      }
                    }}
                    placeholder="Naam van subtype..."
                    disabled={childSaving}
                    className="flex-1 text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-gray-900 outline-none placeholder:text-gray-400"
                  />
                  <button
                    onClick={handleAddChild}
                    disabled={childSaving}
                    className="w-6 h-6 flex items-center justify-center text-green-600 hover:text-green-700 disabled:opacity-40 shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setAddingChild(false); setNewChildName(''); }}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {!addingChild && (
              <button
                onClick={() => setAddingChild(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Voeg subtype toe
              </button>
            )}
          </div>

          {/* ── Delete parent ─────────────────────────────────────────── */}
          {isParent && (
            <>
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    Documenttype verwijderen
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Documenttype verwijderen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &ldquo;{entity.name}&rdquo; wordt gedeactiveerd. Alle gekoppelde subtypes worden ook verborgen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Verwijderen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
