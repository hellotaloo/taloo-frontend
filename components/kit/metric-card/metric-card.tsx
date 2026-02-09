'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sparkline } from './sparkline';

type CardVariant = 'blue' | 'lime' | 'dark' | 'purple' | 'orange' | 'pink';

interface MetricCardProps {
  title: string;
  value: string | number;
  label?: string;
  icon?: LucideIcon;
  variant?: CardVariant;
  sparklineData?: { value: number }[];
  progress?: number; // 0-100 for progress bar
  className?: string;
}

const variantStyles: Record<CardVariant, { 
  bg: string; 
  text: string; 
  muted: string;
  sparkline: string;
  progress: string;
  progressBg: string;
}> = {
  blue: {
    bg: 'bg-sky-100',
    text: 'text-gray-900',
    muted: 'text-gray-600',
    sparkline: '#0ea5e9',
    progress: 'bg-sky-500',
    progressBg: 'bg-sky-200',
  },
  lime: {
    bg: 'bg-lime-300',
    text: 'text-gray-900',
    muted: 'text-gray-700',
    sparkline: '#000',
    progress: 'bg-lime-600',
    progressBg: 'bg-lime-200',
  },
  dark: {
    bg: 'bg-slate-800',
    text: 'text-white',
    muted: 'text-slate-400',
    sparkline: '#94a3b8',
    progress: 'bg-slate-400',
    progressBg: 'bg-slate-700',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-gray-900',
    muted: 'text-gray-600',
    sparkline: '#9333ea',
    progress: 'bg-purple-500',
    progressBg: 'bg-purple-200',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-gray-900',
    muted: 'text-gray-600',
    sparkline: '#f97316',
    progress: 'bg-orange-500',
    progressBg: 'bg-orange-200',
  },
  pink: {
    bg: 'bg-pink-100',
    text: 'text-gray-900',
    muted: 'text-gray-600',
    sparkline: '#E51399',
    progress: 'bg-pink-500',
    progressBg: 'bg-pink-200',
  },
};

export function MetricCard({
  title,
  value,
  label,
  icon: Icon,
  variant = 'blue',
  sparklineData,
  progress,
  className,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn(
      'rounded-xl p-5 min-h-[140px] flex flex-col',
      styles.bg,
      className
    )}>
      {/* Header with icon and title */}
      <div className={cn('flex items-center gap-2 text-sm font-medium', styles.text)}>
        {Icon && <Icon className="w-4 h-4" />}
        {title}
      </div>

      {/* Sparkline or Progress */}
      {sparklineData && sparklineData.length > 0 && (
        <Sparkline 
          data={sparklineData} 
          color={styles.sparkline} 
          className="h-10 my-3 flex-1"
          type="area"
          fillOpacity={0.1}
        />
      )}
      
      {progress !== undefined && (
        <div className="my-3 flex-1 flex items-center">
          <div className={cn('w-full h-2 rounded-full', styles.progressBg)}>
            <div 
              className={cn('h-full rounded-full transition-all', styles.progress)}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Value and label */}
      <div className="flex justify-between items-end mt-auto">
        <span className={cn('text-2xl font-bold', styles.text)}>
          {value}
        </span>
        {label && (
          <span className={cn('text-xs', styles.muted)}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
