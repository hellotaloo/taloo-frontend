'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Phone, MessageSquare, Loader2, FileText } from 'lucide-react';

export interface PublishChannels {
  voice: boolean;
  whatsapp: boolean;
  cv: boolean;
}

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (channels: PublishChannels) => Promise<void>;
  isRepublish?: boolean;
}

export function PublishDialog({
  open,
  onOpenChange,
  onPublish,
  isRepublish = false,
}: PublishDialogProps) {
  const [enableVoice, setEnableVoice] = useState(true);
  const [enableWhatsApp, setEnableWhatsApp] = useState(true);
  const [enableCv, setEnableCv] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!enableVoice && !enableWhatsApp && !enableCv) {
      return; // At least one channel must be enabled
    }

    setIsPublishing(true);
    try {
      await onPublish({ voice: enableVoice, whatsapp: enableWhatsApp, cv: enableCv });
      onOpenChange(false);
    } catch (error) {
      console.error('Publish failed:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const canPublish = enableVoice || enableWhatsApp || enableCv;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isRepublish ? 'Wijzigingen publiceren?' : 'Pre-screening publiceren?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isRepublish
              ? 'Je staat op het punt om de wijzigingen te publiceren. De AI-agents worden bijgewerkt met de nieuwe vragen.'
              : 'Je staat op het punt om dit pre-screening interview te publiceren. Na publicatie kunnen kandidaten direct starten met het interview.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm font-medium text-gray-700">Kanalen activeren</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Voice Call</p>
                  <p className="text-xs text-gray-500">Voice agent voor telefonische interviews</p>
                </div>
              </div>
              <Switch
                checked={enableVoice}
                onCheckedChange={setEnableVoice}
                disabled={isPublishing}
                className="data-[state=checked]:bg-green-600"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                  <p className="text-xs text-gray-500">Chat-agent voor WhatsApp berichten</p>
                </div>
              </div>
              <Switch
                checked={enableWhatsApp}
                onCheckedChange={setEnableWhatsApp}
                disabled={isPublishing}
                className="data-[state=checked]:bg-green-600"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Smart CV</p>
                  <p className="text-xs text-gray-500">Automatische CV-analyse en screening</p>
                </div>
              </div>
              <Switch
                checked={enableCv}
                onCheckedChange={setEnableCv}
                disabled={isPublishing}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>

          {!canPublish && (
            <p className="text-xs text-red-500">
              Selecteer minimaal één kanaal om te publiceren.
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPublishing}>Annuleren</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handlePublish();
            }}
            disabled={!canPublish || isPublishing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publiceren...
              </>
            ) : (
              isRepublish ? 'Bijwerken' : 'Publiceren'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
