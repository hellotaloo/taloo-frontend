import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  GitBranch,
  Briefcase,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { OntologyEntityDetail } from './types';

export interface EntityTab {
  id: string;
  label: string;
  icon: LucideIcon;
  getCount?: (entity: OntologyEntityDetail) => number;
  dividerBefore?: boolean;
}

const JOB_FUNCTION_TABS: EntityTab[] = [
  { id: 'overview', label: 'Overzicht', icon: LayoutDashboard },
  {
    id: 'relationships',
    label: 'Relaties',
    icon: GitBranch,
    getCount: (e) => e.relations.length,
  },
  {
    id: 'documents',
    label: 'Documenten',
    icon: FileText,
    dividerBefore: true,
    getCount: (e) =>
      e.relations.filter(
        (r) => r.source_entity_id === e.id && r.relation_type_slug === 'requires',
      ).length,
  },
  { id: 'requirements', label: 'Vereisten', icon: ClipboardList },
];

const CATEGORY_TABS: EntityTab[] = [
  { id: 'overview', label: 'Overzicht', icon: LayoutDashboard },
  {
    id: 'relationships',
    label: 'Relaties',
    icon: GitBranch,
    getCount: (e) => e.relations.length,
  },
  {
    id: 'job-functions',
    label: 'Functies',
    icon: Briefcase,
    dividerBefore: true,
    getCount: (e) =>
      e.relations.filter(
        (r) => r.target_entity_id === e.id && r.relation_type_slug === 'belongs_to',
      ).length,
  },
];

const DOCUMENT_TYPE_TABS: EntityTab[] = [
  { id: 'overview', label: 'Overzicht', icon: LayoutDashboard },
  {
    id: 'relationships',
    label: 'Relaties',
    icon: GitBranch,
    getCount: (e) => e.relations.length,
  },
  {
    id: 'used-by',
    label: 'Gebruikt door',
    icon: Users,
    getCount: (e) =>
      e.relations.filter(
        (r) => r.target_entity_id === e.id && r.relation_type_slug === 'requires',
      ).length,
  },
];

const DEFAULT_TABS: EntityTab[] = [
  { id: 'overview', label: 'Overzicht', icon: LayoutDashboard },
  {
    id: 'relationships',
    label: 'Relaties',
    icon: GitBranch,
    getCount: (e) => e.relations.length,
  },
];

export function getEntityTabs(typeSlug: string): EntityTab[] {
  switch (typeSlug) {
    case 'job_function':
      return JOB_FUNCTION_TABS;
    case 'category':
      return CATEGORY_TABS;
    case 'document_type':
      return DOCUMENT_TYPE_TABS;
    default:
      return DEFAULT_TABS;
  }
}

export function getDefaultTab(typeSlug: string): string {
  switch (typeSlug) {
    case 'job_function':
      return 'documents';
    case 'category':
      return 'job-functions';
    case 'document_type':
      return 'used-by';
    default:
      return 'overview';
  }
}
