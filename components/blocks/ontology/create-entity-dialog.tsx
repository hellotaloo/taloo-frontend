'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
import { getOntologyTypes, createOntologyEntity } from '@/lib/ontology-api';
import { getLucideIcon } from '@/lib/ontology-utils';
import type { OntologyType } from '@/lib/types';
import { toast } from 'sonner';

export interface CreateEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (entityId: string) => void;
  defaultTypeSlug?: string;
}

export function CreateEntityDialog({
  open,
  onOpenChange,
  onCreated,
  defaultTypeSlug,
}: CreateEntityDialogProps) {
  const [types, setTypes] = useState<OntologyType[]>([]);
  const [selectedTypeSlug, setSelectedTypeSlug] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    async function loadTypes() {
      try {
        const data = await getOntologyTypes();
        setTypes(data);
        if (data.length > 0 && !selectedTypeSlug) {
          setSelectedTypeSlug(defaultTypeSlug || data[0].slug);
        }
      } catch {
        toast.error('Kon types niet laden');
      }
    }
    loadTypes();
  }, [open, selectedTypeSlug]);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setName('');
      setDescription('');
    }
  }, [open]);

  const handleCreate = async () => {
    if (!name.trim() || !selectedTypeSlug) return;
    setSaving(true);
    try {
      const entity = await createOntologyEntity({
        type_slug: selectedTypeSlug,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success(`${entity.name} aangemaakt`);
      onCreated(entity.id);
      onOpenChange(false);
    } catch {
      toast.error('Aanmaken mislukt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[450px] flex flex-col h-full">
        <SheetHeader className="shrink-0 border-b pb-4">
          <SheetTitle>Nieuw entity</SheetTitle>
          <SheetDescription>
            Voeg een nieuw item toe aan de ontologie
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={selectedTypeSlug} onValueChange={setSelectedTypeSlug}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => {
                  const Icon = getLucideIcon(type.icon);
                  return (
                    <SelectItem key={type.slug} value={type.slug}>
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {type.name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Naam</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Chauffeur CE"
            />
          </div>

          <div className="space-y-2">
            <Label>Beschrijving (optioneel)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Korte beschrijving..."
            />
          </div>
        </div>

        <SheetFooter className="shrink-0 border-t">
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button
              className="bg-gray-900 hover:bg-gray-800"
              onClick={handleCreate}
              disabled={!name.trim() || !selectedTypeSlug || saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Aanmaken
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
