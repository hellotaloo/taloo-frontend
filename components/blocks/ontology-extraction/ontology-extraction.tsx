'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { patchOntologyEntity, getVerificationSchema } from '@/lib/ontology-api';
import type { OntologyEntity, ExtractField, VerificationSchemaField } from '@/lib/types';
import { toast } from 'sonner';

// ─── Schema cache (shared with verification component) ────────────────────────

let _presetsCache: VerificationSchemaField[] | null = null;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OntologyExtractionProps {
  entity: OntologyEntity;
  onEntityChange: (updates: Partial<OntologyEntity>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OntologyExtraction({ entity, onEntityChange }: OntologyExtractionProps) {
  const [fields, setFields] = useState<ExtractField[]>(
    entity.verification_config?.extract_fields ?? [],
  );
  const [presets, setPresets] = useState<VerificationSchemaField[]>(_presetsCache ?? []);

  // Add form
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState('');
  const [addDescription, setAddDescription] = useState('');

  // Edit form
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Fetch presets once (silent fail — they're optional)
  useEffect(() => {
    if (_presetsCache) return;
    getVerificationSchema()
      .then((s) => {
        _presetsCache = s.extract_fields;
        setPresets(s.extract_fields);
      })
      .catch(() => {});
  }, []);

  // ── Patch helper ──────────────────────────────────────────────────────────

  async function patchFields(newFields: ExtractField[]) {
    const prevFields = fields;
    setFields(newFields);
    const newConfig = { ...(entity.verification_config ?? {}), extract_fields: newFields };
    try {
      await patchOntologyEntity(entity.id, { verification_config: newConfig });
      onEntityChange({ verification_config: newConfig });
    } catch {
      setFields(prevFields);
      toast.error('Kon velden niet opslaan');
    }
  }

  // ── Add ───────────────────────────────────────────────────────────────────

  async function handleAdd() {
    const name = addName.trim();
    const description = addDescription.trim();
    if (!name || !description) return;
    await patchFields([...fields, { name, description }]);
    setAddName('');
    setAddDescription('');
    setAdding(false);
  }

  function applyPreset(preset: VerificationSchemaField) {
    setAddName(preset.key);
    setAddDescription(preset.description);
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditName(fields[index].name);
    setEditDescription(fields[index].description);
  }

  async function handleEditSave(index: number) {
    const name = editName.trim();
    const description = editDescription.trim();
    setEditingIndex(null);
    if (!name && !description) return;
    const newFields = fields.map((f, i) =>
      i === index ? { name: name || f.name, description: description || f.description } : f,
    );
    await patchFields(newFields);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(index: number) {
    await patchFields(fields.filter((_, i) => i !== index));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const unusedPresets = presets.filter((p) => !fields.some((f) => f.name === p.key));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Extractie</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">
          Velden die de AI uitleest en doorstuurt naar externe systemen
        </p>
      </div>

      {/* Field list */}
      <div className="space-y-1">
        {/* empty state removed — the "+ Veld toevoegen" button is sufficient */}

        {fields.map((field, index) =>
          editingIndex === index ? (
            // ── Edit row ──
            <div key={index} className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setEditingIndex(null)}
                className="w-full text-sm font-medium text-gray-900 bg-white border border-input rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Veldnaam (bv. expiry_date)"
              />
              <input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSave(index);
                  if (e.key === 'Escape') setEditingIndex(null);
                }}
                className="w-full text-sm text-gray-500 bg-white border border-input rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Omschrijving voor de AI"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setEditingIndex(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => handleEditSave(index)}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Opslaan
                </button>
              </div>
            </div>
          ) : (
            // ── Display row ──
            <div
              key={index}
              className="group flex items-start gap-2 py-2 px-2 rounded-md hover:bg-gray-50 -mx-2 cursor-text"
              onClick={() => startEdit(index)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{field.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{field.description}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(index); }}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shrink-0 mt-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ),
        )}
      </div>

      {/* Add form */}
      {adding ? (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {/* Preset suggestions */}
          {unusedPresets.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {unusedPresets.slice(0, 6).map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    'text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md hover:border-gray-400 transition-colors',
                    addName === preset.key && 'border-gray-400 bg-gray-50',
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          <input
            autoFocus
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            className="w-full text-sm font-medium text-gray-900 bg-white border border-input rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring placeholder:font-normal"
            placeholder="Veldnaam (bv. expiry_date)"
          />
          <input
            value={addDescription}
            onChange={(e) => setAddDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') {
                setAdding(false);
                setAddName('');
                setAddDescription('');
              }
            }}
            className="w-full text-sm text-gray-500 bg-white border border-input rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Omschrijving voor de AI (bv. Datum waarop het document vervalt)"
          />
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => { setAdding(false); setAddName(''); setAddDescription(''); }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Annuleren
            </button>
            <button
              onClick={handleAdd}
              disabled={!addName.trim() || !addDescription.trim()}
              className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-40"
            >
              Toevoegen
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-gray-900 hover:text-gray-600 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Veld toevoegen
        </button>
      )}
    </div>
  );
}
