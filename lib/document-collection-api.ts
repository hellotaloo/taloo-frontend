import { authFetch } from './api';
import type {
  CollectionStatus,
  DocumentCollectionFullDetailResponse,
  DocumentCollectionResponse,
  GlobalActivitiesResponse,
  PaginatedCollectionsResponse,
} from './types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

function getBaseUrl(): string {
  const workspaceId =
    typeof window !== 'undefined'
      ? localStorage.getItem('workspace_id') || ''
      : '';
  return `${BACKEND_URL}/workspaces/${workspaceId}/document-collection`;
}

// =============================================================================
// Collections
// =============================================================================

export interface GetCollectionsParams {
  vacancy_id?: string;
  status?: CollectionStatus;
  limit?: number;
  offset?: number;
}

export async function getDocumentCollections(
  params: GetCollectionsParams = {}
): Promise<PaginatedCollectionsResponse> {
  const searchParams = new URLSearchParams();

  if (params.vacancy_id) searchParams.set('vacancy_id', params.vacancy_id);
  if (params.status) searchParams.set('status', params.status);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const url = `${getBaseUrl()}/collections${queryString ? `?${queryString}` : ''}`;

  const response = await authFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch document collections: ${response.status}`);
  }

  return response.json();
}

export async function getDocumentCollection(
  collectionId: string
): Promise<DocumentCollectionFullDetailResponse> {
  const url = `${getBaseUrl()}/collections/${collectionId}/detail`;

  const response = await authFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch document collection: ${response.status}`);
  }

  return response.json();
}

export async function getCollectionActivities(
  candidateId: string,
  vacancyId: string,
  params?: { limit?: number }
): Promise<GlobalActivitiesResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('candidate_id', candidateId);
  searchParams.set('vacancy_id', vacancyId);
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const url = `${BACKEND_URL}/monitoring?${searchParams}`;

  const response = await authFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch collection activities: ${response.status}`);
  }

  return response.json();
}

export async function triggerCollectionTask(
  collectionId: string,
  taskSlug: string,
): Promise<void> {
  const url = `${getBaseUrl()}/collections/${collectionId}/tasks/${taskSlug}/trigger`;
  const response = await authFetch(url, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Failed to trigger task: ${response.status}`);
  }
}
