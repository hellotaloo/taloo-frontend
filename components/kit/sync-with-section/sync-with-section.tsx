'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, X, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIntegrations, addSyncWith, removeSyncWith } from '@/lib/ontology-api';
import type { Integration, SyncWithEntry } from '@/lib/types';
import { toast } from 'sonner';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SyncWithSectionProps {
  entityId: string;
  syncWith: SyncWithEntry[];
  tableName: 'types_documents' | 'types_attributes';
  onSyncChange: (syncWith: SyncWithEntry[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SyncWithSection({
  entityId,
  syncWith,
  tableName,
  onSyncChange,
}: SyncWithSectionProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    getIntegrations()
      .then(setIntegrations)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const linkedIds = new Set(syncWith.map((s) => s.integration_id));

  async function handleToggle(integration: Integration) {
    const existing = syncWith.find((s) => s.integration_id === integration.id);
    setSaving(integration.id);

    try {
      if (existing) {
        await removeSyncWith(entityId, existing.id);
        const next = syncWith.filter((s) => s.id !== existing.id);
        onSyncChange(next);
      } else {
        const entry = await addSyncWith(entityId, integration.id, tableName);
        onSyncChange([...syncWith, entry]);
      }
    } catch {
      toast.error('Kon koppeling niet wijzigen');
    } finally {
      setSaving(null);
    }
  }

  if (!loaded) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <RefreshCw className="w-3.5 h-3.5" />
        Koppelingen
      </p>

      <div className="flex flex-wrap gap-2">
        {[...integrations].sort((a, b) => {
          const aLinked = linkedIds.has(a.id) ? 0 : 1;
          const bLinked = linkedIds.has(b.id) ? 0 : 1;
          return aLinked - bLinked;
        }).map((integration) => {
          const isLinked = linkedIds.has(integration.id);
          const isSaving = saving === integration.id;

          return (
            <button
              key={integration.id}
              onClick={() => handleToggle(integration)}
              disabled={isSaving}
              className={cn(
                'group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                isLinked
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600',
                isSaving && 'opacity-60 cursor-not-allowed',
              )}
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isLinked ? (
                <>
                  <Check className="w-3 h-3 group-hover:hidden" />
                  <X className="w-3 h-3 hidden group-hover:block" />
                </>
              ) : (
                <Plus className="w-3 h-3" />
              )}
              {integration.name}
            </button>
          );
        })}
      </div>

      {integrations.length === 0 && (
        <p className="text-xs text-gray-400">Geen integraties beschikbaar</p>
      )}
    </div>
  );
}
