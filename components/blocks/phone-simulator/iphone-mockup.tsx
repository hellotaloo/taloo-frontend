'use client';

import { ReactNode } from 'react';

export type PhoneSize = 'default' | 'compact';

interface IPhoneMockupProps {
  children: ReactNode;
  size?: PhoneSize;
}

const sizeConfig: Record<PhoneSize, { scale: number; borderRadius: number; innerRadius: number }> = {
  default: { scale: 1, borderRadius: 55, innerRadius: 45 },
  compact: { scale: 0.754, borderRadius: 41, innerRadius: 34 },
};

// Base dimensions (default size)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export function IPhoneMockup({ children, size = 'default' }: IPhoneMockupProps) {
  const config = sizeConfig[size];
  const s = config.scale;

  // Scaled dimensions
  const width = BASE_WIDTH * s;
  const height = BASE_HEIGHT * s;
  const padding = 12 * s;

  // Side button positions (scaled)
  const volToggleTop = 120 * s;
  const volUpTop = 160 * s;
  const volDownTop = 230 * s;
  const powerTop = 180 * s;

  // Side button sizes (scaled)
  const volToggleHeight = 30 * s;
  const volHeight = 60 * s;
  const powerHeight = 80 * s;

  // Dynamic Island (scaled)
  const islandWidth = 120 * s;
  const islandHeight = 34 * s;
  const islandTop = 12 * s;

  return (
    <div className="relative">
      {/* Device frame */}
      <div
        className="relative bg-black shadow-2xl"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          padding: `${padding}px`,
          borderRadius: `${config.borderRadius}px`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
        }}
      >
        {/* Side buttons - Volume */}
        <div
          className="absolute bg-gray-800 rounded-l-sm"
          style={{ left: '-3px', top: `${volToggleTop}px`, width: '3px', height: `${volToggleHeight}px` }}
        />
        <div
          className="absolute bg-gray-800 rounded-l-sm"
          style={{ left: '-3px', top: `${volUpTop}px`, width: '3px', height: `${volHeight}px` }}
        />
        <div
          className="absolute bg-gray-800 rounded-l-sm"
          style={{ left: '-3px', top: `${volDownTop}px`, width: '3px', height: `${volHeight}px` }}
        />

        {/* Side button - Power */}
        <div
          className="absolute bg-gray-800 rounded-r-sm"
          style={{ right: '-3px', top: `${powerTop}px`, width: '3px', height: `${powerHeight}px` }}
        />

        {/* Screen bezel */}
        <div
          className="relative w-full h-full bg-black overflow-hidden"
          style={{
            borderRadius: `${config.innerRadius}px`,
            boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          {/* Dynamic Island */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-50"
            style={{ top: `${islandTop}px` }}
          >
            <div
              className="bg-black rounded-full flex items-center justify-center"
              style={{ width: `${islandWidth}px`, height: `${islandHeight}px` }}
            >
              {/* Camera lens */}
              <div
                className="absolute rounded-full bg-gray-900 border border-gray-800"
                style={{ right: `${16 * s}px`, width: `${12 * s}px`, height: `${12 * s}px` }}
              >
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-900/50"
                  style={{ width: `${6 * s}px`, height: `${6 * s}px` }}
                />
              </div>
            </div>
          </div>

          {/* Screen content area - renders at base size then scales */}
          <div
            className="origin-top-left"
            style={{
              width: `${BASE_WIDTH - 24}px`,
              height: `${BASE_HEIGHT - 24}px`,
              transform: `scale(${s})`,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
