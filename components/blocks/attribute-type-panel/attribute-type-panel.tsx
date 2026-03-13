'use client';

import { useState } from 'react';
import { Trash2, Plus, Check, X, Pencil, GripVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { patchAttributeType, deleteAttributeType } from '@/lib/attribute-types-api';
import type { AttributeType, AttributeOption, AttributeDataType, AttributeCollectedBy } from '@/lib/types';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────

export const ATTRIBUTE_CATEGORY_OPTIONS = [
  { value: 'legal', label: 'Juridisch' },
  { value: 'transport', label: 'Vervoer' },
  { value: 'availability', label: 'Beschikbaarheid' },
  { value: 'financial', label: 'Financieel' },
  { value: 'personal', label: 'Persoonlijk' },
  { value: 'general', label: 'Algemeen' },
];

export const DATA_TYPE_OPTIONS: { value: AttributeDataType; label: string }[] = [
  { value: 'text', label: 'Tekst' },
  { value: 'boolean', label: 'Ja/Nee' },
  { value: 'date', label: 'Datum' },
  { value: 'number', label: 'Nummer' },
  { value: 'select', label: 'Keuzelijst' },
  { value: 'multi_select', label: 'Meervoudige keuze' },
];

export const COLLECTED_BY_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: 'Niet toegewezen' },
  { value: 'pre_screening', label: 'Pre-screening' },
  { value: 'contract', label: 'Contract' },
  { value: 'document_collection', label: 'Documentcollectie' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AttributeTypeDetailPanelProps {
  attributeType: AttributeType;
  onAttributeTypeChange: (updates: Partial<AttributeType>) => void;
  onAttributeTypeDelete: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AttributeTypeDetailPanel({
  attributeType,
  onAttributeTypeChange,
  onAttributeTypeDelete,
}: AttributeTypeDetailPanelProps) {
  const [editingCore, setEditingCore] = useState(false);
  const [nameValue, setNameValue] = useState(attributeType.name);
  const [descValue, setDescValue] = useState(attributeType.description || '');

  // Options editor state
  const [addingOption, setAddingOption] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [editingOptionIdx, setEditingOptionIdx] = useState<number | null>(null);
  const [editOptionValue, setEditOptionValue] = useState('');
  const [editOptionLabel, setEditOptionLabel] = useState('');

  const hasOptions = attributeType.data_type === 'select' || attributeType.data_type === 'multi_select';
  const options = attributeType.options || [];

  // ── Patch helper ────────────────────────────────────────────────────────

  async function patch(updates: Partial<AttributeType>) {
    const prev = { ...attributeType };
    onAttributeTypeChange(updates);
    try {
      await patchAttributeType(attributeType.id, updates);
    } catch {
      onAttributeTypeChange(prev);
      toast.error('Kon wijziging niet opslaan');
    }
  }

  // ── Name ────────────────────────────────────────────────────────────────

  async function handleNameBlur() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === attributeType.name) {
      setNameValue(attributeType.name);
      return;
    }
    await patch({ name: trimmed });
  }

  // ── Description ─────────────────────────────────────────────────────────

  async function handleDescBlur() {
    const trimmed = descValue.trim();
    const current = attributeType.description || '';
    if (trimmed === current) return;
    await patch({ description: trimmed || null });
  }

  // ── Category ────────────────────────────────────────────────────────────

  async function handleCategoryChange(value: string) {
    await patch({ category: value as AttributeType['category'] });
  }

  // ── Data type ───────────────────────────────────────────────────────────

  async function handleDataTypeChange(value: AttributeDataType) {
    const updates: Partial<AttributeType> = { data_type: value };
    if (value !== 'select' && value !== 'multi_select') {
      updates.options = null;
    } else if (!attributeType.options) {
      updates.options = [];
    }
    await patch(updates);
  }

  // ── Collected by ────────────────────────────────────────────────────────

  async function handleCollectedByChange(value: string) {
    await patch({ collected_by: value === 'none' ? null : value as AttributeCollectedBy });
  }

  // ── is_default ──────────────────────────────────────────────────────────

  async function handleIsDefaultChange(value: boolean) {
    await patch({ is_default: value });
  }

  // ── Delete ──────────────────────────────────────────────────────────────

  async function handleDelete() {
    try {
      await deleteAttributeType(attributeType.id);
      onAttributeTypeDelete();
    } catch {
      toast.error('Kon attribuuttype niet verwijderen');
    }
  }

  // ── Options management ──────────────────────────────────────────────────

  async function handleAddOption() {
    const val = newOptionValue.trim();
    const lbl = newOptionLabel.trim();
    if (!val || !lbl) return;
    const newOptions = [...options, { value: val, label: lbl }];
    setAddingOption(false);
    setNewOptionValue('');
    setNewOptionLabel('');
    await patch({ options: newOptions });
  }

  async function handleDeleteOption(idx: number) {
    const newOptions = options.filter((_, i) => i !== idx);
    await patch({ options: newOptions });
  }

  async function handleSaveOptionEdit(idx: number) {
    const val = editOptionValue.trim();
    const lbl = editOptionLabel.trim();
    setEditingOptionIdx(null);
    if (!val || !lbl) return;
    if (val === options[idx].value && lbl === options[idx].label) return;
    const newOptions = options.map((o, i) => (i === idx ? { value: val, label: lbl } : o));
    await patch({ options: newOptions });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  const categoryLabel = ATTRIBUTE_CATEGORY_OPTIONS.find((o) => o.value === attributeType.category)?.label ?? attributeType.category;
  const dataTypeLabel = DATA_TYPE_OPTIONS.find((o) => o.value === attributeType.data_type)?.label ?? attributeType.data_type;
  const collectedByLabel = COLLECTED_BY_OPTIONS.find((o) => o.value === (attributeType.collected_by || 'none'))?.label ?? 'Niet toegewezen';

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto">

        {/* ── Core fields ──────────────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gegevens</p>
            <button
              onClick={() => {
                setNameValue(attributeType.name);
                setDescValue(attributeType.description || '');
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
                    if (e.key === 'Escape') setNameValue(attributeType.name);
                  }}
                  className="w-full text-sm text-gray-900 bg-background border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-400">Beschrijving</label>
                <input
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  onBlur={handleDescBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  placeholder="Optionele beschrijving..."
                  className="w-full text-sm text-gray-900 bg-background border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-gray-400"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-400">Categorie</label>
                <Select value={attributeType.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTRIBUTE_CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-400">Gegevenstype</label>
                <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
                  {DATA_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleDataTypeChange(opt.value)}
                      className={cn(
                        'px-2.5 py-1.5 text-xs rounded-md transition-colors',
                        attributeType.data_type === opt.value
                          ? 'bg-white text-gray-900 shadow-sm font-medium'
                          : 'text-gray-500 hover:text-gray-700',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collected by */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-400">Verzameld door</label>
                <Select
                  value={attributeType.collected_by || 'none'}
                  onValueChange={handleCollectedByChange}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLLECTED_BY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* is_default */}
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`default-${attributeType.id}`}
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Standaard attribuut voor nieuwe werkruimtes
                </Label>
                <Switch
                  id={`default-${attributeType.id}`}
                  checked={attributeType.is_default}
                  onCheckedChange={handleIsDefaultChange}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-gray-400 w-24 shrink-0">Naam</span>
                <span className="text-sm text-gray-900">{attributeType.name}</span>
              </div>
              {attributeType.description && (
                <div className="flex items-baseline gap-3">
                  <span className="text-xs text-gray-400 w-24 shrink-0">Beschrijving</span>
                  <span className="text-sm text-gray-900">{attributeType.description}</span>
                </div>
              )}
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-gray-400 w-24 shrink-0">Categorie</span>
                <span className="text-sm text-gray-900">{categoryLabel}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-gray-400 w-24 shrink-0">Gegevenstype</span>
                <span className="text-sm text-gray-900">{dataTypeLabel}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-gray-400 w-24 shrink-0">Verzameld door</span>
                <span className="text-sm text-gray-900">{collectedByLabel}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-gray-400 w-24 shrink-0">Standaard</span>
                <span className="text-sm text-gray-900">{attributeType.is_default ? 'Ja' : 'Nee'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* ── Options (select / multi_select only) ───────────────────── */}
          {hasOptions && (
            <>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Opties{options.length > 0 ? ` (${options.length})` : ''}
                </p>

                <div className="space-y-0.5">
                  {options.map((option, idx) => (
                    <div
                      key={`${option.value}-${idx}`}
                      className="group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-50 -mx-2"
                    >
                      <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0" />

                      {editingOptionIdx === idx ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            autoFocus
                            value={editOptionValue}
                            onChange={(e) => setEditOptionValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveOptionEdit(idx);
                              if (e.key === 'Escape') setEditingOptionIdx(null);
                            }}
                            placeholder="waarde"
                            className="flex-1 text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-gray-900 outline-none py-0.5"
                          />
                          <input
                            value={editOptionLabel}
                            onChange={(e) => setEditOptionLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveOptionEdit(idx);
                              if (e.key === 'Escape') setEditingOptionIdx(null);
                            }}
                            placeholder="label"
                            className="flex-1 text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-gray-900 outline-none py-0.5"
                          />
                          <button
                            onClick={() => handleSaveOptionEdit(idx)}
                            className="w-6 h-6 flex items-center justify-center text-green-600 hover:text-green-700 shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingOptionIdx(null)}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingOptionIdx(idx);
                              setEditOptionValue(option.value);
                              setEditOptionLabel(option.label);
                            }}
                            className="flex-1 text-left truncate"
                          >
                            <span className="text-sm text-gray-900">{option.label}</span>
                            <span className="text-xs text-gray-400 ml-2">({option.value})</span>
                          </button>

                          <button
                            onClick={() => handleDeleteOption(idx)}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}

                  {options.length === 0 && !addingOption && (
                    <p className="text-sm text-gray-400 py-1">Geen opties</p>
                  )}

                  {/* New option row */}
                  {addingOption && (
                    <div className="flex items-center gap-2 py-1.5 px-2 -mx-2">
                      <GripVertical className="w-3.5 h-3.5 text-gray-200 shrink-0" />
                      <input
                        autoFocus
                        value={newOptionValue}
                        onChange={(e) => setNewOptionValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setAddingOption(false);
                            setNewOptionValue('');
                            setNewOptionLabel('');
                          }
                        }}
                        placeholder="waarde"
                        className="flex-1 text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-gray-900 outline-none placeholder:text-gray-400"
                      />
                      <input
                        value={newOptionLabel}
                        onChange={(e) => setNewOptionLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddOption();
                          if (e.key === 'Escape') {
                            setAddingOption(false);
                            setNewOptionValue('');
                            setNewOptionLabel('');
                          }
                        }}
                        placeholder="label"
                        className="flex-1 text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-gray-900 outline-none placeholder:text-gray-400"
                      />
                      <button
                        onClick={handleAddOption}
                        className="w-6 h-6 flex items-center justify-center text-green-600 hover:text-green-700 shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setAddingOption(false); setNewOptionValue(''); setNewOptionLabel(''); }}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {!addingOption && (
                  <button
                    onClick={() => setAddingOption(true)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Voeg optie toe
                  </button>
                )}
              </div>

              <Separator />
            </>
          )}

          {/* ── Delete ─────────────────────────────────────────────────── */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
                Attribuuttype verwijderen
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Attribuuttype verwijderen?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{attributeType.name}&rdquo; wordt gedeactiveerd.
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

        </div>
      </div>
    </div>
  );
}
