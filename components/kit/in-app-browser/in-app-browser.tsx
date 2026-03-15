'use client';

import { useState } from 'react';
import { X, Lock, ChevronLeft, ChevronRight, Share, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InAppBrowserProps {
  url: string;
  onClose: () => void;
}

export function InAppBrowser({ url, onClose }: InAppBrowserProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Extract hostname for display
  let displayHost = '';
  try {
    displayHost = new URL(url).hostname;
  } catch {
    displayHost = url;
  }

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col bg-white"
      style={{
        animation: 'inAppBrowserSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {/* iOS Status bar */}
      <div className="bg-[#f8f8f8] px-6 flex items-center justify-between text-black text-sm font-semibold h-[50px]">
        <span className="mt-1">22:07</span>
        <div className="flex items-center gap-1 mt-1">
          <div className="flex gap-0.5 items-end">
            <div className="w-[3px] h-[4px] bg-black rounded-sm" />
            <div className="w-[3px] h-[6px] bg-black rounded-sm" />
            <div className="w-[3px] h-[8px] bg-black rounded-sm" />
            <div className="w-[3px] h-[10px] bg-black rounded-sm" />
          </div>
          <div className="ml-1 flex items-center">
            <div className="w-[22px] h-[11px] border border-black rounded-[3px] relative flex items-center p-px">
              <div className="bg-black rounded-sm h-full" style={{ width: '100%' }} />
            </div>
            <div className="w-px h-[4px] bg-black rounded-r-sm ml-px" />
          </div>
        </div>
      </div>

      {/* Safari-style top bar */}
      <div className="bg-[#f8f8f8] border-b border-gray-200 px-3 pb-2">
        {/* Done button + URL bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-[#007AFF] text-[15px] font-medium shrink-0"
          >
            Klaar
          </button>
          <div className="flex-1 flex items-center justify-center bg-gray-200/70 rounded-lg h-[34px] px-3 gap-1.5">
            <Lock className="w-3 h-3 text-gray-500 shrink-0" />
            <span className="text-[13px] text-gray-700 truncate">{displayHost}</span>
          </div>
          <button className="text-[#007AFF] shrink-0">
            <Share className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Loading bar */}
      {isLoading && (
        <div className="h-[2px] bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-[#007AFF] rounded-r"
            style={{
              animation: 'browserLoadBar 1.5s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 bg-white relative overflow-hidden">
        <iframe
          src={url}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="In-app browser"
        />

        {/* Fallback when iframe can't load */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white gap-3">
            <Globe className="w-10 h-10 text-gray-300" />
            <p className="text-sm text-gray-400">Laden...</p>
          </div>
        )}
      </div>

      {/* Bottom toolbar - Safari style */}
      <div className="bg-[#f8f8f8] border-t border-gray-200 px-6 pt-2 pb-1">
        <div className="flex items-center justify-between">
          <button className="text-gray-300 p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="text-gray-300 p-1">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button className="text-[#007AFF] p-1">
            <Share className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom safe area */}
      <div className="bg-[#f8f8f8] h-5 flex items-center justify-center">
        <div className="w-32 h-1 bg-black rounded-full" />
      </div>

      <style jsx>{`
        @keyframes inAppBrowserSlideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes browserLoadBar {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
