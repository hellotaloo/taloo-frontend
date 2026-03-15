import type { LucideIcon } from 'lucide-react';
import { Phone, CheckCircle2, Users, UserCheck, FileText, FileCheck, AlertCircle } from 'lucide-react';
import type { AgentStatItem } from './types';

/**
 * Extract a stat value from an AgentStatItem array by key.
 */
export function getStatValue(stats: AgentStatItem[], key: string): number {
  return stats.find(s => s.key === key)?.value ?? 0;
}

/**
 * Map backend icon names to Lucide components for MetricCard rendering.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  'users': Users,
  'check-circle': CheckCircle2,
  'check-circle-2': CheckCircle2,
  'user-check': UserCheck,
  'phone': Phone,
  'file-text': FileText,
  'file-check': FileCheck,
  'alert-circle': AlertCircle,
};

export function getStatIcon(iconName: string | null | undefined): LucideIcon | undefined {
  return iconName ? ICON_MAP[iconName] : undefined;
}
