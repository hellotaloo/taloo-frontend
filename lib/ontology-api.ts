import { authFetch } from './api';
import type {
  OntologyOverview,
  OntologyGraph,
  OntologyType,
  OntologyTypeCreate,
  OntologyTypeUpdate,
  OntologyEntity,
  OntologyEntityDetail,
  OntologyEntityCreate,
  OntologyEntityUpdate,
  OntologyRelationType,
  OntologyRelationTypeCreate,
  OntologyRelation,
  OntologyRelationCreate,
  OntologyRelationUpdate,
  PaginatedResponse,
} from './types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

function getBaseUrl(): string {
  const workspaceId =
    typeof window !== 'undefined'
      ? localStorage.getItem('workspace_id') || ''
      : '';
  return `${BACKEND_URL}/workspaces/${workspaceId}/ontology`;
}

// =============================================================================
// Overview & Graph
// =============================================================================

export async function getOntologyOverview(): Promise<OntologyOverview> {
  const response = await authFetch(getBaseUrl());
  if (!response.ok) throw new Error('Failed to fetch ontology overview');
  return response.json();
}

export async function getOntologyGraph(): Promise<OntologyGraph> {
  const response = await authFetch(`${getBaseUrl()}/graph`);
  if (!response.ok) throw new Error('Failed to fetch ontology graph');
  return response.json();
}

// =============================================================================
// Entity Types CRUD
// =============================================================================

export async function getOntologyTypes(): Promise<OntologyType[]> {
  const response = await authFetch(`${getBaseUrl()}/types`);
  if (!response.ok) throw new Error('Failed to fetch ontology types');
  return response.json();
}

export async function createOntologyType(
  data: OntologyTypeCreate,
): Promise<OntologyType> {
  const response = await authFetch(`${getBaseUrl()}/types`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create ontology type');
  return response.json();
}

export async function updateOntologyType(
  typeId: string,
  data: OntologyTypeUpdate,
): Promise<OntologyType> {
  const response = await authFetch(`${getBaseUrl()}/types/${typeId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update ontology type');
  return response.json();
}

export async function deleteOntologyType(typeId: string): Promise<void> {
  const response = await authFetch(`${getBaseUrl()}/types/${typeId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete ontology type');
}

// =============================================================================
// Entities CRUD
// =============================================================================

export interface GetEntitiesParams {
  type?: string;
  search?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

export async function getOntologyEntities(
  params: GetEntitiesParams = {},
): Promise<PaginatedResponse<OntologyEntity>> {
  const searchParams = new URLSearchParams();
  if (params.type) searchParams.set('type', params.type);
  if (params.search) searchParams.set('search', params.search);
  if (params.active !== undefined)
    searchParams.set('active', params.active.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const url = `${getBaseUrl()}/entities${queryString ? `?${queryString}` : ''}`;

  const response = await authFetch(url);
  if (!response.ok) throw new Error('Failed to fetch ontology entities');
  return response.json();
}

export async function getOntologyEntity(
  entityId: string,
): Promise<OntologyEntityDetail> {
  const response = await authFetch(`${getBaseUrl()}/entities/${entityId}`);
  if (!response.ok) throw new Error('Failed to fetch ontology entity');
  return response.json();
}

export async function createOntologyEntity(
  data: OntologyEntityCreate,
): Promise<OntologyEntity> {
  const response = await authFetch(`${getBaseUrl()}/entities`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create ontology entity');
  return response.json();
}

export async function updateOntologyEntity(
  entityId: string,
  data: OntologyEntityUpdate,
): Promise<OntologyEntity> {
  const response = await authFetch(`${getBaseUrl()}/entities/${entityId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update ontology entity');
  return response.json();
}

export async function deleteOntologyEntity(entityId: string): Promise<void> {
  const response = await authFetch(`${getBaseUrl()}/entities/${entityId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete ontology entity');
}

// =============================================================================
// Relation Types
// =============================================================================

export async function getOntologyRelationTypes(): Promise<
  OntologyRelationType[]
> {
  const response = await authFetch(`${getBaseUrl()}/relation-types`);
  if (!response.ok) throw new Error('Failed to fetch relation types');
  return response.json();
}

export async function createOntologyRelationType(
  data: OntologyRelationTypeCreate,
): Promise<OntologyRelationType> {
  const response = await authFetch(`${getBaseUrl()}/relation-types`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create relation type');
  return response.json();
}

// =============================================================================
// Relations CRUD
// =============================================================================

export interface GetRelationsParams {
  source_id?: string;
  target_id?: string;
  type?: string;
}

export async function getOntologyRelations(
  params: GetRelationsParams = {},
): Promise<OntologyRelation[]> {
  const searchParams = new URLSearchParams();
  if (params.source_id) searchParams.set('source_id', params.source_id);
  if (params.target_id) searchParams.set('target_id', params.target_id);
  if (params.type) searchParams.set('type', params.type);

  const queryString = searchParams.toString();
  const url = `${getBaseUrl()}/relations${queryString ? `?${queryString}` : ''}`;

  const response = await authFetch(url);
  if (!response.ok) throw new Error('Failed to fetch ontology relations');
  return response.json();
}

export async function createOntologyRelation(
  data: OntologyRelationCreate,
): Promise<OntologyRelation> {
  const response = await authFetch(`${getBaseUrl()}/relations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create ontology relation');
  return response.json();
}

export async function updateOntologyRelation(
  relationId: string,
  data: OntologyRelationUpdate,
): Promise<OntologyRelation> {
  const response = await authFetch(`${getBaseUrl()}/relations/${relationId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update ontology relation');
  return response.json();
}

export async function deleteOntologyRelation(
  relationId: string,
): Promise<void> {
  const response = await authFetch(`${getBaseUrl()}/relations/${relationId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete ontology relation');
}
