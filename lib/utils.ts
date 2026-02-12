import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
  return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
}
