'use client';

import { useState, useEffect } from 'react';
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
import { useTranslations } from '@/lib/i18n';

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
  defaultChannels?: PublishChannels;
}

export function PublishDialog({
  open,
  onOpenChange,
  onPublish,
  isRepublish = false,
  defaultChannels,
}: PublishDialogProps) {
  const [enableVoice, setEnableVoice] = useState(defaultChannels?.voice ?? true);
  const [enableWhatsApp, setEnableWhatsApp] = useState(defaultChannels?.whatsapp ?? true);
  const [enableCv, setEnableCv] = useState(defaultChannels?.cv ?? true);
  const [isPublishing, setIsPublishing] = useState(false);
  const t = useTranslations('screening');
  const tCommon = useTranslations('common');

  // Sync state when defaultChannels loads (async fetch)
  useEffect(() => {
    if (defaultChannels) {
      setEnableVoice(defaultChannels.voice);
      setEnableWhatsApp(defaultChannels.whatsapp);
      setEnableCv(defaultChannels.cv);
    }
  }, [defaultChannels]);

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
            {isRepublish ? t('republish') : t('publish')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isRepublish ? t('republishDesc') : t('publishDesc')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm font-medium text-gray-700">{t('activateChannels')}</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-brand-dark-blue rounded-lg">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('voiceCall')}</p>
                  <p className="text-xs text-gray-500">{t('voiceDesc')}</p>
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
                <div className="flex items-center justify-center w-8 h-8 bg-brand-dark-blue rounded-lg">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('whatsapp')}</p>
                  <p className="text-xs text-gray-500">{t('whatsappDesc')}</p>
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
                <div className="flex items-center justify-center w-8 h-8 bg-brand-dark-blue rounded-lg">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('smartCv')}</p>
                  <p className="text-xs text-gray-500">{t('cvDesc')}</p>
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
              {t('selectChannel')}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPublishing}>{tCommon('cancel')}</AlertDialogCancel>
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
                {tCommon('publishing')}
              </>
            ) : (
              isRepublish ? tCommon('update') : tCommon('publish')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
