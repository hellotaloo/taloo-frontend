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

// ============================================
// Phone Number Formatting
// ============================================

/**
 * Format a phone number for display: "32487441391" → "+32 487 44 13 91"
 * Supports Belgian (+32) and Dutch (+31) mobile/landline numbers.
 * Falls back to grouping digits in threes for other formats.
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';
  // Strip all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Normalize: ensure we have digits only (strip leading +)
  const digits = cleaned.replace(/^\+/, '');

  // Belgian numbers: 32 + 9 digits (mobile: 4xx, landline varies)
  if (digits.startsWith('32') && digits.length === 11) {
    const cc = digits.slice(0, 2);
    const rest = digits.slice(2); // 9 digits
    // Mobile: 4xx xx xx xx
    if (rest.startsWith('4')) {
      return `+${cc} ${rest.slice(0, 3)} ${rest.slice(3, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)}`;
    }
    // Landline: 2-digit area (2x, 3x, etc.) + 7 digits
    return `+${cc} ${rest.slice(0, 1)} ${rest.slice(1, 4)} ${rest.slice(4, 6)} ${rest.slice(6, 9)}`;
  }

  // Dutch numbers: 31 + 9 digits
  if (digits.startsWith('31') && digits.length === 11) {
    const cc = digits.slice(0, 2);
    const rest = digits.slice(2);
    // Mobile: 6xx xx xx xx
    if (rest.startsWith('6')) {
      return `+${cc} ${rest.slice(0, 1)} ${rest.slice(1, 3)} ${rest.slice(3, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)}`;
    }
    return `+${cc} ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 7)} ${rest.slice(7, 9)}`;
  }

  // Fallback: +CC then groups of 3
  if (digits.length > 6) {
    const groups: string[] = [];
    let i = 0;
    // Assume first 2 digits are country code
    groups.push(digits.slice(0, 2));
    i = 2;
    while (i < digits.length) {
      groups.push(digits.slice(i, i + 3));
      i += 3;
    }
    return `+${groups[0]} ${groups.slice(1).join(' ')}`;
  }

  return phone;
}
