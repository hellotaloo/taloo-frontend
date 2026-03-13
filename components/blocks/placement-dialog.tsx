'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Candidacy, PlacementRegime, PlacementCreate } from '@/lib/types';

const regimeLabels: Record<PlacementRegime, string> = {
  full: 'Voltijds',
  flex: 'Flex',
  day: 'Dagcontract',
};

interface PlacementDialogProps {
  candidacy: Candidacy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (placement: PlacementCreate) => Promise<void>;
}

export function PlacementDialog({ candidacy, open, onOpenChange, onConfirm }: PlacementDialogProps) {
  const [regime, setRegime] = useState<PlacementRegime>('full');
  const [startDate, setStartDate] = useState('');
  const [createContract, setCreateContract] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!candidacy || !candidacy.vacancy) return;

    setSubmitting(true);
    try {
      await onConfirm({
        candidate_id: candidacy.candidate_id,
        vacancy_id: candidacy.vacancy.id,
        regime,
        start_date: startDate || undefined,
        create_contract: createContract,
      });
      // Reset form
      setRegime('full');
      setStartDate('');
      setCreateContract(true);
    } finally {
      setSubmitting(false);
    }
  }

  const candidateName = candidacy?.candidate?.full_name ?? '';
  const vacancyTitle = candidacy?.vacancy?.title ?? '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Plaatsing bevestigen</DialogTitle>
          <DialogDescription>
            {candidateName} wordt geplaatst op <strong>{vacancyTitle}</strong>.
            Vul de plaatsingsgegevens in om de plaatsing te bevestigen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="regime">Regime</Label>
            <Select value={regime} onValueChange={(v) => setRegime(v as PlacementRegime)}>
              <SelectTrigger id="regime">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(regimeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Startdatum</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2.5">
            <div className="min-w-0">
              <Label htmlFor="create_contract" className="cursor-pointer">Contract aanmaken</Label>
              <p className="text-xs text-gray-500 mt-0.5">
                {regime === 'day'
                  ? 'Agent genereert het contract en verstuurt het 15 min. voor aanvang ter ondertekening'
                  : 'Agent genereert het contract en volgt de ondertekening op'}
              </p>
            </div>
            <Switch
              id="create_contract"
              checked={createContract}
              onCheckedChange={setCreateContract}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Bevestigen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
