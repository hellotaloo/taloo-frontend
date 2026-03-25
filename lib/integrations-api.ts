import { authFetch } from './api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// --- Types ---

export interface IntegrationResponse {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  description: string;
  icon: string | null;
  is_active: boolean;
}

export interface ConnectionResponse {
  id: string;
  integration: IntegrationResponse;
  is_active: boolean;
  has_credentials: boolean;
  credential_hints: Record<string, string>;
  health_status: 'healthy' | 'unhealthy' | 'unknown';
  last_health_check_at: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface HealthCheckResponse {
  connection_id: string;
  provider: string;
  health_status: 'healthy' | 'unhealthy' | 'unknown';
  message: string;
  checked_at: string;
}

/** A single field parsed from the OpenAPI schema */
export interface CredentialField {
  name: string;
  type: 'text' | 'password';
  description: string;
  required: boolean;
}

/** Maps provider slugs to their OpenAPI schema name */
const schemaMap: Record<string, string> = {
  connexys: 'ConnexysCredentialsRequest',
  microsoft: 'MicrosoftCredentialsRequest',
};

const SENSITIVE_PATTERNS = /secret|password|token/i;

let cachedSpec: Record<string, unknown> | null = null;

async function getOpenAPISpec(): Promise<Record<string, unknown>> {
  if (cachedSpec) return cachedSpec;
  const response = await fetch(`${BACKEND_URL}/openapi.json`);
  if (!response.ok) throw new Error('Failed to fetch OpenAPI spec');
  cachedSpec = await response.json();
  return cachedSpec!;
}

/** Parse credential fields for a provider from the OpenAPI spec */
export async function getCredentialFields(slug: string): Promise<CredentialField[]> {
  const schemaName = schemaMap[slug];
  if (!schemaName) return [];

  const spec = await getOpenAPISpec();
  const schemas = (spec as { components?: { schemas?: Record<string, unknown> } })
    ?.components?.schemas;
  if (!schemas) return [];

  const schema = schemas[schemaName] as {
    properties?: Record<string, { type?: string; description?: string }>;
    required?: string[];
  } | undefined;
  if (!schema?.properties) return [];

  const requiredSet = new Set(schema.required ?? []);

  return Object.entries(schema.properties).map(([name, prop]) => ({
    name,
    type: SENSITIVE_PATTERNS.test(name) ? 'password' : 'text',
    description: prop.description ?? '',
    required: requiredSet.has(name),
  }));
}

// --- Mapping Types ---

export interface MappingFieldInfo {
  name: string;
  label: string;
  type: string;
  required: boolean;
  description: string;
  group?: string;
}

export interface SourceFieldInfo {
  name: string;
  label: string;
  category: string;
  sf_type?: string;
}

export interface MappingSchemaResponse {
  target_fields: MappingFieldInfo[];
  source_fields: SourceFieldInfo[];
  default_mapping: Record<string, { template: string }>;
  current_mapping: Record<string, { template: string }> | null;
}

// --- API Functions ---

export async function getIntegrations(): Promise<IntegrationResponse[]> {
  const response = await authFetch(`${BACKEND_URL}/integrations`);
  if (!response.ok) throw new Error('Failed to fetch integrations');
  return response.json();
}

export async function getConnections(): Promise<ConnectionResponse[]> {
  const response = await authFetch(`${BACKEND_URL}/integrations/connections`);
  if (!response.ok) throw new Error('Failed to fetch connections');
  return response.json();
}

export async function saveCredentials(
  slug: string,
  data: Record<string, string>
): Promise<ConnectionResponse> {
  const response = await authFetch(`${BACKEND_URL}/integrations/connections/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to save credentials');
  return response.json();
}

export async function runHealthCheck(connectionId: string): Promise<HealthCheckResponse> {
  const response = await authFetch(`${BACKEND_URL}/integrations/connections/${connectionId}/health-check`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to run health check');
  return response.json();
}

export async function updateConnection(
  connectionId: string,
  data: { is_active?: boolean; settings?: Record<string, unknown> }
): Promise<ConnectionResponse> {
  const response = await authFetch(`${BACKEND_URL}/integrations/connections/${connectionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update connection');
  return response.json();
}

export async function deleteConnection(connectionId: string): Promise<void> {
  const response = await authFetch(`${BACKEND_URL}/integrations/connections/${connectionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete connection');
}

export async function getMappingSchema(connectionId: string): Promise<MappingSchemaResponse> {
  const response = await authFetch(`${BACKEND_URL}/integrations/connections/${connectionId}/mapping-schema`);
  if (!response.ok) throw new Error('Failed to fetch mapping schema');
  return response.json();
}

export async function discoverSourceFields(connectionId: string): Promise<SourceFieldInfo[]> {
  const response = await authFetch(`${BACKEND_URL}/integrations/connections/${connectionId}/discover-fields`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to discover source fields');
  return response.json();
}

// --- Vacancy Sync ---

export interface SyncProgressResponse {
  status: 'idle' | 'syncing' | 'complete' | 'error';
  message: string;
  total_fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
}

export async function startSync(): Promise<{ status: string; message: string }> {
  const response = await authFetch(`${BACKEND_URL}/integrations/sync`, { method: 'POST' });
  if (response.status === 409) throw new Error('Sync is al bezig');
  if (!response.ok) throw new Error('Sync starten mislukt');
  return response.json();
}

export async function getSyncStatus(): Promise<SyncProgressResponse> {
  const response = await authFetch(`${BACKEND_URL}/integrations/sync/status`);
  if (!response.ok) throw new Error('Sync status ophalen mislukt');
  return response.json();
}
