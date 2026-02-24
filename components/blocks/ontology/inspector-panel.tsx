'use client';

import { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { updateOntologyRelation, deleteOntologyRelation } from '@/lib/ontology-api';
import { REQUIREMENT_STYLES } from '@/lib/ontology-utils';
import type { OntologyRelation, RequirementType } from '@/lib/types';
import { toast } from 'sonner';

export interface InspectorPanelProps {
  relation: OntologyRelation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function InspectorPanel({
  relation,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: InspectorPanelProps) {
  const [requirementType, setRequirementType] = useState<RequirementType>('verplicht');
  const [condition, setCondition] = useState('');
  const [priority, setPriority] = useState('1');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync state when relation changes
  useEffect(() => {
    if (relation) {
      setRequirementType(
        (relation.metadata.requirement_type as RequirementType) || 'verplicht',
      );
      setCondition((relation.metadata.condition as string) || '');
      setPriority(String(relation.metadata.priority ?? '1'));
    }
  }, [relation]);

  const handleSave = async () => {
    if (!relation) return;
    setSaving(true);
    try {
      await updateOntologyRelation(relation.id, {
        metadata: {
          requirement_type: requirementType,
          priority: Number(priority),
          ...(condition ? { condition } : {}),
        },
      });
      toast.success('Vereiste opgeslagen');
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error('Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!relation) return;
    setDeleting(true);
    try {
      await deleteOntologyRelation(relation.id);
      toast.success('Vereiste verwijderd');
      onDeleted();
      onOpenChange(false);
    } catch {
      toast.error('Verwijderen mislukt');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[450px] flex flex-col h-full">
        <SheetHeader className="shrink-0 border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-dark-blue flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            {relation?.target_entity_name || 'Document'}
          </SheetTitle>
          <SheetDescription>Bewerk de vereisten voor dit document</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Algemeen</TabsTrigger>
              <TabsTrigger value="display">Weergave</TabsTrigger>
              <TabsTrigger value="advanced">Geavanceerd</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4 space-y-4">
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

              {requirementType === 'voorwaardelijk' && (
                <div className="space-y-2">
                  <Label>Voorwaarde</Label>
                  <Input
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="Bijv. Bij gevaarlijk transport"
                  />
                  <p className="text-xs text-gray-500">
                    Beschrijf wanneer dit document vereist is
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Prioriteit</Label>
                <Input
                  type="number"
                  min="1"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Volgorde waarin documenten worden opgevraagd
                </p>
              </div>
            </TabsContent>

            <TabsContent value="display" className="mt-4 space-y-4">
              <p className="text-sm text-gray-500">
                Weergave-instellingen komen binnenkort.
              </p>
            </TabsContent>

            <TabsContent value="advanced" className="mt-4 space-y-4">
              <p className="text-sm text-gray-500">
                Geavanceerde instellingen komen binnenkort.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter className="shrink-0 border-t flex-row justify-between">
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            {deleting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Verwijderen
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button
              className="bg-gray-900 hover:bg-gray-800"
              onClick={handleSave}
              disabled={saving || deleting}
            >
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Opslaan
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
