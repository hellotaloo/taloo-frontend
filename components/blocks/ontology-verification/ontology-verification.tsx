'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { patchOntologyEntity } from '@/lib/ontology-api';
import type { OntologyEntity, VerificationConfig } from '@/lib/types';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: VerificationConfig = {
  check_expiry: true,
  check_name: true,
  extract_fields: [],
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OntologyVerificationProps {
  entity: OntologyEntity;
  onEntityChange: (updates: Partial<OntologyEntity>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OntologyVerification({ entity, onEntityChange }: OntologyVerificationProps) {
  // Only local state for is_verifiable (visibility) and textarea (controlled input)
  const [isVerifiable, setIsVerifiable] = useState(entity.is_verifiable);
  const [instructions, setInstructions] = useState(
    entity.verification_config?.additional_instructions ?? '',
  );

  const config = entity.verification_config;

  // ── Toggles ──────────────────────────────────────────────────────────────

  async function patchVerifiable(value: boolean) {
    const prev = isVerifiable;
    setIsVerifiable(value);
    try {
      if (value && !config) {
        // First time enabling — apply defaults in a single PATCH
        await patchOntologyEntity(entity.id, {
          is_verifiable: true,
          verification_config: DEFAULT_CONFIG,
        });
        onEntityChange({ is_verifiable: true, verification_config: DEFAULT_CONFIG });
      } else {
        await patchOntologyEntity(entity.id, { is_verifiable: value });
        onEntityChange({ is_verifiable: value });
      }
    } catch {
      setIsVerifiable(prev);
      toast.error('Kon wijziging niet opslaan');
    }
  }

  async function patchConfigField(key: 'check_expiry' | 'check_name', value: boolean) {
    const newConfig = { ...(config ?? DEFAULT_CONFIG), [key]: value };
    onEntityChange({ verification_config: newConfig });
    try {
      await patchOntologyEntity(entity.id, { verification_config: newConfig });
    } catch {
      onEntityChange({ verification_config: config });
      toast.error('Kon instelling niet opslaan');
    }
  }

  async function handleInstructionsBlur() {
    const trimmed = instructions.trim();
    const prev = config?.additional_instructions ?? '';
    if (trimmed === prev) return;
    const newConfig = { ...(config ?? DEFAULT_CONFIG), additional_instructions: trimmed };
    try {
      await patchOntologyEntity(entity.id, { verification_config: newConfig });
      onEntityChange({ verification_config: newConfig });
    } catch {
      setInstructions(prev);
      toast.error('Kon instructies niet opslaan');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Verificatie</p>

      {/* Verifieerbaar toggle */}
      <div className="flex items-center justify-between">
        <Label
          htmlFor={`verifiable-${entity.id}`}
          className="text-sm font-medium text-gray-900 cursor-pointer"
        >
          Verifieerbaar door AI
        </Label>
        <Switch
          id={`verifiable-${entity.id}`}
          checked={isVerifiable}
          onCheckedChange={patchVerifiable}
        />
      </div>

      {isVerifiable && (
        <>
          {/* Check toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor={`check-expiry-${entity.id}`}
                className="text-sm text-gray-700 cursor-pointer"
              >
                Controleer vervaldatum
              </Label>
              <Switch
                id={`check-expiry-${entity.id}`}
                checked={config?.check_expiry ?? true}
                onCheckedChange={(v) => patchConfigField('check_expiry', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor={`check-name-${entity.id}`}
                className="text-sm text-gray-700 cursor-pointer"
              >
                Controleer naam
              </Label>
              <Switch
                id={`check-name-${entity.id}`}
                checked={config?.check_name ?? true}
                onCheckedChange={(v) => patchConfigField('check_name', v)}
              />
            </div>
          </div>

          {/* Instructies */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500">Instructies voor de AI</label>
              <span
                className={cn(
                  'text-xs tabular-nums',
                  instructions.length >= 450 ? 'text-orange-500' : 'text-gray-400',
                )}
              >
                {instructions.length}/500
              </span>
            </div>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value.slice(0, 500))}
              onBlur={handleInstructionsBlur}
              placeholder="bv. Controleer of het document een officieel stempel bevat..."
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
            />
          </div>
        </>
      )}
    </div>
  );
}
