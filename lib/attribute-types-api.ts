import { authFetch } from './api';
import type {
  AttributeType,
  AttributeTypesResponse,
  AttributeCategory,
  AttributeDataType,
  AttributeCollectedBy,
  AttributeOption,
  AttributeFieldDefinition,
} from './types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

function getWorkspaceId(): string {
  return typeof window !== 'undefined'
    ? localStorage.getItem('workspace_id') || ''
    : '';
}

// =============================================================================
// List
// =============================================================================

export interface GetAttributeTypesParams {
  category?: string;
  collected_by?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export async function getAttributeTypes(
  params: GetAttributeTypesParams = {},
): Promise<AttributeTypesResponse> {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set('category', params.category);
  if (params.collected_by) searchParams.set('collected_by', params.collected_by);
  if (params.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());

  const qs = searchParams.toString();
  const url = `${BACKEND_URL}/workspaces/${getWorkspaceId()}/candidate-attribute-types${qs ? `?${qs}` : ''}`;
  const response = await authFetch(url);
  if (!response.ok) throw new Error('Failed to fetch attribute types');
  return response.json();
}

// =============================================================================
// Create
// =============================================================================

export interface CreateAttributeTypeBody {
  slug: string;
  name: string;
  description?: string;
  category: AttributeCategory;
  data_type: AttributeDataType;
  options?: AttributeOption[];
  fields?: AttributeFieldDefinition[] | null;
  icon?: string;
  is_default?: boolean;
  collected_by?: AttributeCollectedBy | null;
  sort_order?: number;
}

export async function createAttributeType(body: CreateAttributeTypeBody): Promise<AttributeType> {
  const url = `${BACKEND_URL}/workspaces/${getWorkspaceId()}/candidate-attribute-types`;
  const response = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.status === 409) {
    const err = new Error('Slug already exists') as Error & { status: number };
    err.status = 409;
    throw err;
  }
  if (!response.ok) throw new Error('Failed to create attribute type');
  return response.json();
}

// =============================================================================
// Patch
// =============================================================================

export interface PatchAttributeTypeBody {
  name?: string;
  description?: string | null;
  category?: AttributeCategory;
  data_type?: AttributeDataType;
  options?: AttributeOption[] | null;
  fields?: AttributeFieldDefinition[] | null;
  icon?: string | null;
  is_default?: boolean;
  is_active?: boolean;
  collected_by?: AttributeCollectedBy | null;
  sort_order?: number;
  ai_hint?: string | null;
}

export async function patchAttributeType(
  id: string,
  body: PatchAttributeTypeBody,
): Promise<AttributeType> {
  const url = `${BACKEND_URL}/workspaces/${getWorkspaceId()}/candidate-attribute-types/${id}`;
  const response = await authFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Failed to update attribute type');
  return response.json();
}

// =============================================================================
// Delete
// =============================================================================

export async function deleteAttributeType(id: string): Promise<void> {
  const url = `${BACKEND_URL}/workspaces/${getWorkspaceId()}/candidate-attribute-types/${id}`;
  const response = await authFetch(url, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete attribute type');
}
