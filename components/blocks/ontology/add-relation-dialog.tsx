'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getOntologyEntities, createOntologyRelation } from '@/lib/ontology-api';
import { REQUIREMENT_STYLES } from '@/lib/ontology-utils';
import type { OntologyEntity, RequirementType } from '@/lib/types';
import { toast } from 'sonner';

export interface AddRelationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceEntityId: string;
  targetTypeSlug: string;
  relationTypeSlug: string;
  onCreated: () => void;
}

export function AddRelationDialog({
  open,
  onOpenChange,
  sourceEntityId,
  targetTypeSlug,
  relationTypeSlug,
  onCreated,
}: AddRelationDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [entities, setEntities] = useState<OntologyEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [requirementType, setRequirementType] = useState<RequirementType>('verplicht');
  const [priority, setPriority] = useState('1');
  const [condition, setCondition] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch target entities when dialog opens or search changes
  useEffect(() => {
    if (!open) return;

    async function fetchEntities() {
      setLoading(true);
      try {
        const result = await getOntologyEntities({
          type: targetTypeSlug,
          search: searchQuery || undefined,
          limit: 50,
        });
        setEntities(result.items);
      } catch {
        toast.error('Kon entiteiten niet laden');
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(fetchEntities, 300);
    return () => clearTimeout(timeout);
  }, [open, searchQuery, targetTypeSlug]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedEntityId(null);
      setSearchQuery('');
      setRequirementType('verplicht');
      setPriority('1');
      setCondition('');
    }
  }, [open]);

  const handleCreate = async () => {
    if (!selectedEntityId) return;
    setSaving(true);
    try {
      await createOntologyRelation({
        source_entity_id: sourceEntityId,
        target_entity_id: selectedEntityId,
        relation_type_slug: relationTypeSlug,
        metadata: {
          requirement_type: requirementType,
          priority: Number(priority),
          ...(condition ? { condition } : {}),
        },
      });
      toast.success('Vereiste toegevoegd');
      onCreated();
      onOpenChange(false);
    } catch {
      toast.error('Toevoegen mislukt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[450px] flex flex-col h-full">
        <SheetHeader className="shrink-0 border-b pb-4">
          <SheetTitle>Document toevoegen</SheetTitle>
          <SheetDescription>
            Selecteer een document en stel de vereisten in
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Entity search & select */}
          <div className="space-y-3">
            <Label>Document</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Zoek document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Laden...
                </div>
              ) : entities.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Geen documenten gevonden
                </div>
              ) : (
                entities.map((entity) => (
                  <button
                    key={entity.id}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                      selectedEntityId === entity.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700'
                    }`}
                    onClick={() => setSelectedEntityId(entity.id)}
                  >
                    {entity.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Requirement type */}
          <div className="space-y-2">
            <Label>Vereiste Type</Label>
            <Select
              value={requirementType}
              onValueChange={(v) => setRequirementType(v as RequirementType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(REQUIREMENT_STYLES) as [RequirementType, typeof REQUIREMENT_STYLES[RequirementType]][]).map(
                  ([key, style]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${style.dotColor}`} />
                        {style.label}
                      </span>
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Prioriteit</Label>
            <Input
              type="number"
              min="1"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </div>

          {/* Condition (for voorwaardelijk) */}
          {requirementType === 'voorwaardelijk' && (
            <div className="space-y-2">
              <Label>Voorwaarde</Label>
              <Input
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="Bijv. Bij gevaarlijk transport"
              />
            </div>
          )}
        </div>

        <SheetFooter className="shrink-0 border-t">
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button
              className="bg-gray-900 hover:bg-gray-800"
              onClick={handleCreate}
              disabled={!selectedEntityId || saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Toevoegen
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
