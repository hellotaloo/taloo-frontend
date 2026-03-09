import {
  Briefcase,
  Boxes,
  FileText,
  FileCheck,
  CheckCircle,
  Truck,
  Package,
  Stethoscope,
  Heart,
  Building2,
  Phone,
  Forklift,
  SprayCan,
  Folder,
  Globe2,
  ClipboardList,
  Users,
  Circle,
  Shield,
  CreditCard,
  GraduationCap,
  Wrench,
  HardHat,
  IdCard,
  Car,
  Banknote,
  Camera,
  Award,
  Stamp,
  type LucideIcon,
} from 'lucide-react';
import type {
  OntologyEntity,
  OntologyGraphNode,
  OntologyType,
  RequirementType,
} from './types';

// =============================================================================
// Icon Resolver
// =============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  folder: Folder,
  'file-text': FileText,
  'check-circle': CheckCircle,
  truck: Truck,
  package: Package,
  stethoscope: Stethoscope,
  heart: Heart,
  'building-2': Building2,
  phone: Phone,
  forklift: Forklift,
  'spray-can': SprayCan,
  'globe-2': Globe2,
  globe2: Globe2,
  'clipboard-list': ClipboardList,
  users: Users,
  boxes: Boxes,
  shield: Shield,
  'credit-card': CreditCard,
  'graduation-cap': GraduationCap,
  wrench: Wrench,
  'hard-hat': HardHat,
  circle: Circle,
  'id-card': IdCard,
  car: Car,
  banknote: Banknote,
  camera: Camera,
  award: Award,
  stamp: Stamp,
  'file-check': FileCheck,
};

/**
 * Resolve a Lucide icon name string to its React component.
 * Returns Circle as fallback if the icon name is not found.
 */
export function getLucideIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Circle;
  return ICON_MAP[name] ?? Circle;
}

// =============================================================================
// Requirement Type Styles
// =============================================================================

export interface RequirementStyle {
  color: string;
  label: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  badgeClass: string;
  dotColor: string;
}

export const REQUIREMENT_STYLES: Record<RequirementType, RequirementStyle> = {
  verplicht: {
    color: '#EF4444',
    label: 'Verplicht',
    lineStyle: 'solid',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    dotColor: 'bg-red-500',
  },
  voorwaardelijk: {
    color: '#F59E0B',
    label: 'Voorwaardelijk',
    lineStyle: 'dashed',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    dotColor: 'bg-orange-500',
  },
  gewenst: {
    color: '#3B82F6',
    label: 'Gewenst',
    lineStyle: 'dotted',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
};

// =============================================================================
// Entity Visual Resolution
// =============================================================================

/**
 * Resolve the effective icon and color for an entity,
 * falling back to its type's defaults if not overridden.
 */
export function getEffectiveVisuals(
  entity: OntologyEntity | OntologyGraphNode,
  types: OntologyType[],
): { color: string; icon: LucideIcon } {
  const type = types.find((t) => t.slug === entity.type_slug);
  return {
    color: entity.color ?? type?.color ?? '#6B7280',
    icon: getLucideIcon(entity.icon ?? type?.icon),
  };
}
