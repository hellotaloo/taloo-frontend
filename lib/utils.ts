import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Locale } from './i18n/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// Date Formatting Utilities
// ============================================
// All date/time formatting should use these functions for consistency.
// NL time format: "14u31" — EN time format: "2:31 PM"
// NL date format: "15 feb 2026" — EN date format: "15 Feb 2026"

const INTL_LOCALE: Record<Locale, string> = { nl: 'nl-BE', en: 'en-GB' };

/**
 * Format time. NL: "14u31" / EN: "14:31"
 */
export function formatTime(date: Date | string | null | undefined, locale: Locale = 'nl'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours();
  const minutes = d.getMinutes();
  if (locale === 'en') {
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }
  return minutes > 0 ? `${hours}u${minutes.toString().padStart(2, '0')}` : `${hours}u`;
}

/**
 * Format date only. NL: "15 feb 2026" / EN: "15 Feb 2026"
 */
export function formatDate(date: Date | string | null | undefined, includeYear = true, locale: Locale = 'nl'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = includeYear
    ? { day: 'numeric', month: 'short', year: 'numeric' }
    : { day: 'numeric', month: 'short' };
  return d.toLocaleDateString(INTL_LOCALE[locale], options);
}

/**
 * Format date with time. NL: "15 feb 2026, 14u31" / EN: "15 Feb 2026, 14:31"
 */
export function formatDateTime(date: Date | string | null | undefined, includeYear = true, locale: Locale = 'nl'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(d, includeYear, locale)}, ${formatTime(d, locale)}`;
}

/**
 * Format short timestamp (no year). NL: "15 feb, 14u31" / EN: "15 Feb, 14:31"
 */
export function formatTimestamp(date: Date | string | null | undefined, locale: Locale = 'nl'): string {
  if (!date) return '-';
  return formatDateTime(date, false, locale);
}

/**
 * Format relative date. NL: "2u geleden" / EN: "2h ago"
 */
export function formatRelativeDate(dateString: string | null | undefined, locale: Locale = 'nl') {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (locale === 'en') {
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date, false, 'en');
  }

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
