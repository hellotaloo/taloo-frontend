'use client';

import { useState, useEffect, useRef } from 'react';
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
import type { AttributeType, AttributeOption, AttributeDataType, AttributeFieldDefinition, SyncWithEntry } from '@/lib/types';
import { SyncWithSection } from '@/components/kit/sync-with-section/sync-with-section';
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
  { value: 'structured', label: 'Gestructureerd' },
];

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Tekst' },
  { value: 'phone', label: 'Telefoon' },
  { value: 'email', label: 'E-mail' },
  { value: 'date', label: 'Datum' },
  { value: 'number', label: 'Nummer' },
  { value: 'boolean', label: 'Ja/Nee' },
  { value: 'select', label: 'Keuzelijst' },
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
  const [aiHintValue, setAiHintValue] = useState(attributeType.ai_hint || '');

  // Options editor state
  const [addingOption, setAddingOption] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [editingOptionIdx, setEditingOptionIdx] = useState<number | null>(null);
  const [editOptionValue, setEditOptionValue] = useState('');
  const [editOptionLabel, setEditOptionLabel] = useState('');

  // Fields editor state
  const [addingField, setAddingField] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [editingFieldIdx, setEditingFieldIdx] = useState<number | null>(null);
  const [editFieldKey, setEditFieldKey] = useState('');
  const [editFieldLabel, setEditFieldLabel] = useState('');
  const [editFieldType, setEditFieldType] = useState('text');

  const hasOptions = attributeType.data_type === 'select' || attributeType.data_type === 'multi_select';
  const hasFields = attributeType.data_type === 'structured';
  const options = attributeType.options || [];
  const fields: AttributeFieldDefinition[] = attributeType.fields || [];

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

  // ── Debounced auto-save for description & AI hint ───────────────────────

  const descTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const aiHintTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const descRef = useRef(descValue);
  const aiHintRef = useRef(aiHintValue);
  const attrRef = useRef(attributeType);
  descRef.current = descValue;
  aiHintRef.current = aiHintValue;
  attrRef.current = attributeType;

  function handleDescChange(value: string) {
    const clamped = value.slice(0, 500);
    setDescValue(clamped);
    clearTimeout(descTimer.current);
    descTimer.current = setTimeout(() => {
      const trimmed = clamped.trim();
      if (trimmed === (attrRef.current.description || '')) return;
      patch({ description: trimmed || null });
    }, 600);
  }

  function handleAiHintChange(value: string) {
    const clamped = value.slice(0, 500);
    setAiHintValue(clamped);
    clearTimeout(aiHintTimer.current);
    aiHintTimer.current = setTimeout(() => {
      const trimmed = clamped.trim();
      if (trimmed === (attrRef.current.ai_hint || '')) return;
      patch({ ai_hint: trimmed || null });
    }, 600);
  }

  // Flush pending saves on unmount (panel close / ESC)
  useEffect(() => {
    return () => {
      clearTimeout(descTimer.current);
      clearTimeout(aiHintTimer.current);
      const a = attrRef.current;
      const descTrimmed = descRef.current.trim();
      if (descTrimmed !== (a.description || '')) {
        patchAttributeType(a.id, { description: descTrimmed || null }).catch(() => {});
      }
      const hintTrimmed = aiHintRef.current.trim();
      if (hintTrimmed !== (a.ai_hint || '')) {
        patchAttributeType(a.id, { ai_hint: hintTrimmed || null }).catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (value !== 'structured') {
      updates.fields = null;
    } else if (!attributeType.fields) {
      updates.fields = [];
    }
    await patch(updates);
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

  // ── Fields management ───────────────────────────────────────────────

  async function handleAddField() {
    const key = newFieldKey.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const label = newFieldLabel.trim();
    if (!key || !label) return;
    const newFields = [...fields, { key, label, type: newFieldType, required: true }];
    setAddingField(false);
    setNewFieldKey('');
    setNewFieldLabel('');
    setNewFieldType('text');
    await patch({ fields: newFields });
  }

  async function handleDeleteField(idx: number) {
    const newFields = fields.filter((_, i) => i !== idx);
    await patch({ fields: newFields });
  }

  async function handleSaveFieldEdit(idx: number) {
    const key = editFieldKey.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const label = editFieldLabel.trim();
    setEditingFieldIdx(null);
    if (!key || !label) return;
    if (key === fields[idx].key && label === fields[idx].label && editFieldType === fields[idx].type) return;
    const newFields = fields.map((f, i) => (i === idx ? { ...f, key, label, type: editFieldType } : f));
    await patch({ fields: newFields });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  const categoryLabel = ATTRIBUTE_CATEGORY_OPTIONS.find((o) => o.value === attributeType.category)?.label ?? attributeType.category;
  const dataTypeLabel = DATA_TYPE_OPTIONS.find((o) => o.value === attributeType.data_type)?.label ?? attributeType.data_type;

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

              {/* is_default */}
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`default-${attributeType.id}`}
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Standaard attribuut voor alle records
                </Label>
                <Switch
                  id={`default-${attributeType.id}`}
                  checked={attributeType.is_default}
                  onCheckedChange={handleIsDefaultChange}
                />
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

                {/* Options inline below data type selector */}
                {hasOptions && (
                  <div className="space-y-1 pt-1">
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
                        className="flex items-center gap-1.5 text-xs text-gray-900 hover:text-black transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Voeg optie toe
                      </button>
                    )}
                  </div>
                )}

                {/* Fields inline below data type selector */}
                {hasFields && (
                  <div className="space-y-1 pt-1">
                    <div className="space-y-0.5">
                      {fields.map((field, idx) => (
                        <div
                          key={`${field.key}-${idx}`}
                          className="group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-50 -mx-2"
                        >
                          <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0" />

                          {editingFieldIdx === idx ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                autoFocus
                                value={editFieldLabel}
                                onChange={(e) => setEditFieldLabel(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveFieldEdit(idx);
                                  if (e.key === 'Escape') setEditingFieldIdx(null);
                                }}
                                placeholder="label"
                                className="flex-1 text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-gray-900 outline-none py-0.5"
                              />
                              <input
                                value={editFieldKey}
                                onChange={(e) => setEditFieldKey(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveFieldEdit(idx);
                                  if (e.key === 'Escape') setEditingFieldIdx(null);
                                }}
                                placeholder="key"
                                className="w-24 text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-gray-900 outline-none py-0.5"
                              />
                              <select
                                value={editFieldType}
                                onChange={(e) => setEditFieldType(e.target.value)}
                                className="text-xs text-gray-700 bg-gray-100 border border-gray-200 rounded px-1.5 py-1"
                              >
                                {FIELD_TYPE_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleSaveFieldEdit(idx)}
                                className="w-6 h-6 flex items-center justify-center text-green-600 hover:text-green-700 shrink-0"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingFieldIdx(null)}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingFieldIdx(idx);
                                  setEditFieldKey(field.key);
                                  setEditFieldLabel(field.label);
                                  setEditFieldType(field.type);
                                }}
                                className="flex-1 text-left truncate"
                              >
                                <span className="text-sm text-gray-900">{field.label}</span>
                                <span className="text-xs text-gray-400 ml-2">({field.key})</span>
                                <span className="text-xs text-gray-300 ml-1.5">
                                  {FIELD_TYPE_OPTIONS.find((o) => o.value === field.type)?.label ?? field.type}
                                </span>
                              </button>

                              <button
                                onClick={() => handleDeleteField(idx)}
                                className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      ))}

                      {/* New field row */}
                      {addingField && (
                        <div className="flex items-center gap-2 py-1.5 px-2 -mx-2">
                          <GripVertical className="w-3.5 h-3.5 text-gray-200 shrink-0" />
                          <input
                            autoFocus
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                            placeholder="label (bv. Naam)"
                            className="flex-1 text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-gray-900 outline-none placeholder:text-gray-400"
                          />
                          <input
                            value={newFieldKey}
                            onChange={(e) => setNewFieldKey(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddField();
                              if (e.key === 'Escape') {
                                setAddingField(false);
                                setNewFieldKey('');
                                setNewFieldLabel('');
                                setNewFieldType('text');
                              }
                            }}
                            placeholder="key (bv. name)"
                            className="w-24 text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:border-gray-900 outline-none placeholder:text-gray-400"
                          />
                          <select
                            value={newFieldType}
                            onChange={(e) => setNewFieldType(e.target.value)}
                            className="text-xs text-gray-700 bg-gray-100 border border-gray-200 rounded px-1.5 py-1"
                          >
                            {FIELD_TYPE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={handleAddField}
                            className="w-6 h-6 flex items-center justify-center text-green-600 hover:text-green-700 shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setAddingField(false); setNewFieldKey(''); setNewFieldLabel(''); setNewFieldType('text'); }}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {!addingField && (
                      <button
                        onClick={() => setAddingField(true)}
                        className="flex items-center gap-1.5 text-xs text-gray-900 hover:text-black transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Voeg veld toe
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">Naam</span>
                <span className="text-sm text-gray-900">{attributeType.name} <code className="text-xs text-gray-400 font-mono ml-1">{attributeType.slug}</code></span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">Categorie</span>
                <span className="text-sm text-gray-900">{categoryLabel}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">Gegevenstype</span>
                <span className="text-sm text-gray-900">{dataTypeLabel}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">Standaard</span>
                <span className="text-sm text-gray-900">{attributeType.is_default ? 'Ja' : 'Nee'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* ── Instructies voor de AI (always visible, like doc type verification) */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Instructies voor de AI</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500">Beschrijving / instructies</label>
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    descValue.length >= 450 ? 'text-orange-500' : 'text-gray-400',
                  )}
                >
                  {descValue.length}/500
                </span>
              </div>
              <textarea
                value={descValue}
                onChange={(e) => handleDescChange(e.target.value)}
                placeholder="bv. Beschrijving van het attribuut..."
                rows={3}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500">AI Hint</label>
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    aiHintValue.length >= 450 ? 'text-orange-500' : 'text-gray-400',
                  )}
                >
                  {aiHintValue.length}/500
                </span>
              </div>
              <textarea
                value={aiHintValue}
                onChange={(e) => handleAiHintChange(e.target.value)}
                placeholder="bv. ALTIJD verzamelen. Uit identiteitsdocument aflezen..."
                rows={3}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
              />
              <p className="text-xs text-gray-400">Instructie voor de AI planner wanneer/hoe dit attribuut verzameld moet worden.</p>
            </div>
          </div>

          <Separator />

          {/* ── Koppelingen ──────────────────────────────────────────── */}
          <SyncWithSection
            entityId={attributeType.id}
            syncWith={attributeType.sync_with || []}
            tableName="types_attributes"
            onSyncChange={(syncWith) => onAttributeTypeChange({ sync_with: syncWith })}
          />

          <Separator />

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
