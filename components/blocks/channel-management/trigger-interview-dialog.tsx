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
