'use client';

import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: 'female' | 'male';
  voiceId?: string;
  avatar?: string;
}

export interface VoiceSelectionCardProps {
  voice: VoiceOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function VoiceSelectionCard({
  voice,
  isSelected,
  onSelect,
  disabled = false,
}: VoiceSelectionCardProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(voice.id)}
      disabled={disabled}
      className={cn(
        'w-full text-left rounded-xl p-5 border transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#015AD9]/50',
        isSelected
          ? 'border-[#015AD9] bg-blue-50 ring-2 ring-[#015AD9]/20'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center mb-3',
          voice.gender === 'female'
            ? 'bg-gradient-to-br from-pink-400 to-purple-500'
            : 'bg-gradient-to-br from-blue-400 to-indigo-500'
        )}
      >
        <User className="w-6 h-6 text-white" />
      </div>

      {/* Voice name */}
      <h3 className="font-semibold text-gray-900 mb-1">{voice.name}</h3>

      {/* Description */}
      <p className="text-sm text-gray-500">{voice.description}</p>

      {/* Selected indicator */}
      {isSelected && (
        <div className="mt-3 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#015AD9]" />
          <span className="text-xs font-medium text-[#015AD9]">Selected</span>
        </div>
      )}
    </button>
  );
}
