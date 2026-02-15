'use client';

import { Phone, MessageCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChannelIconsProps {
  channels: {
    voice: boolean;
    whatsapp: boolean;
    cv: boolean;
  };
  className?: string;
}

/**
 * Channel icons component showing active communication channels
 * Uses brand dark blue background with white icons for on-brand styling.
 */
export function ChannelIcons({ channels, className }: ChannelIconsProps) {
  const hasAnyChannel = channels.voice || channels.whatsapp || channels.cv;

  if (!hasAnyChannel) {
    return <span className={cn("text-gray-400", className)}>-</span>;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {channels.whatsapp && (
        <MessageCircle
          className="w-4 h-4 text-gray-600"
          title="WhatsApp-kanaal actief"
        />
      )}
      {channels.voice && (
        <Phone
          className="w-4 h-4 text-gray-600"
          title="Telefoon-kanaal actief"
        />
      )}
      {channels.cv && (
        <FileText
          className="w-4 h-4 text-gray-600"
          title="Smart CV-kanaal actief"
        />
      )}
    </div>
  );
}
