'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { ApplicationForm } from '@/components/blocks/application-form';

interface TriggerInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyId: string;
  vacancyTitle: string;
  hasWhatsApp: boolean;
  hasVoice: boolean;
  hasCv: boolean;
  /** Source identifier. Defaults to 'test' for dashboard usage. */
  source?: string;
  /** If provided, called instead of the API when "Start gesprek" is clicked (for demo/playground use) */
  onStartCall?: () => void;
}

export function TriggerInterviewDialog({
  open,
  onOpenChange,
  vacancyId,
  vacancyTitle,
  hasWhatsApp,
  hasVoice,
  hasCv,
  source = 'test',
  onStartCall,
}: TriggerInterviewDialogProps) {
  const hasBothOptions = hasCv && (hasWhatsApp || hasVoice);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={`p-0 gap-0 overflow-hidden ${hasBothOptions ? 'max-w-5xl!' : 'max-w-[450px]'}`}>
        <VisuallyHidden.Root>
          <AlertDialogTitle>Solliciteer</AlertDialogTitle>
        </VisuallyHidden.Root>
        <div className="mx-8 mt-6 rounded-lg bg-brand-dark-blue/5 border border-brand-dark-blue/15 px-4 py-3 text-sm text-brand-dark-blue text-center">
          Dit is een testomgeving. Alle sollicitaties worden gemarkeerd als <span className="font-semibold">&quot;test&quot;</span> en worden niet gesynchroniseerd met het ATS.
        </div>
        <ApplicationForm
          vacancyId={vacancyId}
          vacancyTitle={vacancyTitle}
          hasWhatsApp={hasWhatsApp}
          hasVoice={hasVoice}
          hasCv={hasCv}
          source={source}
          onClose={() => onOpenChange(false)}
          onStartCall={onStartCall}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}
