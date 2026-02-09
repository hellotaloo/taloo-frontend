'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColorSwatchProps {
  name: string;
  hex: string;
  className?: string;
}

export function ColorSwatch({ name, hex, className }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Determine if text should be white or black based on background luminance
  const getTextColor = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'text-gray-900' : 'text-white';
  };

  const textColor = getTextColor(hex);

  return (
    <button
      onClick={copyToClipboard}
      className={cn(
        'group relative rounded-lg overflow-hidden transition-all hover:scale-105 hover:shadow-lg',
        className
      )}
      style={{ backgroundColor: hex }}
      title={`Click to copy ${hex}`}
    >
      <div className="aspect-square w-full flex flex-col items-center justify-center p-4">
        {copied ? (
          <Check className={cn('w-6 h-6 mb-2', textColor)} />
        ) : (
          <div className={cn('text-sm font-medium mb-1', textColor)}>
            {name}
          </div>
        )}
        <div className={cn('text-xs font-mono', textColor, !copied && 'opacity-90')}>
          {copied ? 'Copied!' : hex}
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
    </button>
  );
}
