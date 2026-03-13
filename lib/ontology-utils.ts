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
  ShieldCheck,
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
  Layers,
  Tags,
  type LucideIcon,
} from 'lucide-react';

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
  layers: Layers,
  tags: Tags,
  'shield-check': ShieldCheck,
};

/**
 * Resolve a Lucide icon name string to its React component.
 * Returns Circle as fallback if the icon name is not found.
 */
export function getLucideIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Circle;
  return ICON_MAP[name] ?? Circle;
}
