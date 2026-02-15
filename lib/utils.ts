import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// Date Formatting Utilities
// ============================================
// All date/time formatting should use these functions for consistency.
// Time format: Dutch style "14u31" (not "14:31")
// Date format: "15 feb 2026" or "15 feb" (short)

/**
 * Format time in Dutch style: "14u31" or "14u" (if no minutes)
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours();
  const minutes = d.getMinutes();
  return minutes > 0 ? `${hours}u${minutes.toString().padStart(2, '0')}` : `${hours}u`;
}

/**
 * Format date only: "15 feb 2026"
 */
export function formatDate(date: Date | string | null | undefined, includeYear = true): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = includeYear
    ? { day: 'numeric', month: 'short', year: 'numeric' }
    : { day: 'numeric', month: 'short' };
  return d.toLocaleDateString('nl-BE', options);
}

/**
 * Format date with time: "15 feb 2026, 14u31"
 */
export function formatDateTime(date: Date | string | null | undefined, includeYear = true): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(d, includeYear)}, ${formatTime(d)}`;
}

/**
 * Format short timestamp (no year): "15 feb, 14u31"
 */
export function formatTimestamp(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return formatDateTime(date, false);
}

/**
 * Format relative date: "2u geleden", "3d geleden", etc.
 */
export function formatRelativeDate(dateString: string | null | undefined) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Zojuist';
  if (diffMins < 60) return `${diffMins}m geleden`;
  if (diffHours < 24) return `${diffHours}u geleden`;
  if (diffDays < 7) return `${diffDays}d geleden`;
  return formatDate(date, false);
}
