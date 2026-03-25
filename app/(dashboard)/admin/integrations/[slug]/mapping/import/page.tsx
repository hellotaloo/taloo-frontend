'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronRight, Loader2, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type ConnectionResponse,
  type MappingFieldInfo,
  type MappingSchemaResponse,
  type SourceFieldInfo,
  getConnections,
  getMappingSchema,
  discoverSourceFields,
  updateConnection,
} from '@/lib/integrations-api';

export default function MappingImportPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [connection, setConnection] = useState<ConnectionResponse | null>(null);
  const [schema, setSchema] = useState<MappingSchemaResponse | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [sourceExpanded, setSourceExpanded] = useState(true);
  const [fieldSearch, setFieldSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const connections = await getConnections();
        const conn = connections.find((c) => c.integration.slug === slug);
        if (!conn) {
          toast.error('Geen verbinding gevonden');
          return;
        }
        setConnection(conn);

        const data = await getMappingSchema(conn.id);
        setSchema(data);

        // Initialize from current_mapping or default_mapping
        const source = data.current_mapping ?? data.default_mapping;
        const initial: Record<string, string> = {};
        for (const field of data.target_fields) {
          initial[field.name] = source[field.name]?.template ?? '';
        }
        setMappings(initial);
      } catch {
        toast.error('Kon mapping schema niet laden');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleLoadDefaults = () => {
    if (!schema) return;
    const defaults: Record<string, string> = {};
    for (const field of schema.target_fields) {
      defaults[field.name] = schema.default_mapping[field.name]?.template ?? '';
    }
    setMappings(defaults);
    toast.success('Standaard mapping geladen');
  };

  const handleDiscoverFields = async () => {
    if (!connection) return;
    setDiscovering(true);
    try {
      await discoverSourceFields(connection.id);
      // Reload the mapping schema to get the freshly cached fields
      const data = await getMappingSchema(connection.id);
      setSchema(data);
      toast.success(`${data.source_fields.length} velden opgehaald uit bronsysteem`);
    } catch {
      toast.error('Kon velden niet ophalen uit het bronsysteem');
    } finally {
      setDiscovering(false);
    }
  };

  const handleSave = async () => {
    if (!schema || !connection) return;
    setSaving(true);
    try {
      const mappingConfig: Record<string, { template: string }> = {};
      for (const [key, value] of Object.entries(mappings)) {
        if (value.trim()) {
          mappingConfig[key] = { template: value };
        }
      }

      await updateConnection(connection.id, {
        settings: {
          field_mapping: {
            version: 1,
            mappings: mappingConfig,
          },
        },
      });
      toast.success('Mapping opgeslagen');
    } catch {
      toast.error('Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  const copySourceField = (fieldName: string) => {
    const text = `{{${fieldName}}}`;
    navigator.clipboard.writeText(text);
    toast.success(`${text} gekopieerd`, { duration: 1500 });
  };

  // Determine if a target field needs a textarea (multi-line) or input
  const isMultiLine = (field: MappingFieldInfo) =>
    field.type === 'html' || (mappings[field.name] ?? '').includes('\n');

  // Check if required fields are filled
  const isValid = schema?.target_fields
    .filter((f) => f.required)
    .every((f) => mappings[f.name]?.trim()) ?? false;

  // Group target fields by their group label (preserving backend order)
  const groupedFields = useMemo(() => {
    if (!schema) return [];
    const groups: { label: string; fields: typeof schema.target_fields }[] = [];
    const seen = new Map<string, number>();
    for (const field of schema.target_fields) {
      const group = field.group ?? 'Algemeen';
      const idx = seen.get(group);
      if (idx !== undefined) {
        groups[idx].fields.push(field);
      } else {
        seen.set(group, groups.length);
        groups.push({ label: group, fields: [field] });
      }
    }
    return groups;
  }, [schema]);

  // Filter source fields by search query — only show when searching
  const hasSearch = fieldSearch.trim().length > 0;
  const filteredFields = hasSearch
    ? (schema?.source_fields.filter((field) => {
        const q = fieldSearch.toLowerCase();
        return field.name.toLowerCase().includes(q) || field.label.toLowerCase().includes(q);
      }) ?? [])
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!schema) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page description */}
      <div style={{ animation: 'fade-in-up 0.3s ease-out backwards' }}>
        <h2 className="text-base font-semibold text-gray-900">Vacature import mapping</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configureer hoe vacaturevelden uit het bronsysteem worden omgezet naar Taloo-velden.
        </p>
      </div>

      {/* Source fields panel */}
      <div
        className="rounded-xl border border-gray-200 bg-white"
        style={{ animation: 'fade-in-up 0.3s ease-out 50ms backwards' }}
      >
        <div className="flex items-center justify-between p-4">
          <button
            type="button"
            className="flex items-center gap-2 text-left flex-1"
            onClick={() => setSourceExpanded(!sourceExpanded)}
          >
            {sourceExpanded
              ? <ChevronDown className="w-4 h-4 text-gray-400" />
              : <ChevronRight className="w-4 h-4 text-gray-400" />
            }
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Beschikbare bronvelden
                <span className="text-xs font-normal text-gray-400 ml-1.5">
                  ({schema.source_fields.length})
                </span>
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">Klik op een veld om het te kopiëren</p>
            </div>
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscoverFields}
            disabled={discovering}
          >
            {discovering
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />
            }
            Velden ophalen
          </Button>
        </div>

        {sourceExpanded && (
          <div className="px-4 pb-4 space-y-3">
            {/* Search filter */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                placeholder="Zoek op veldnaam of label..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Field chips */}
            <div className="flex flex-wrap gap-1.5">
              {filteredFields.map((field) => (
                <button
                  key={field.name}
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-xs font-mono text-gray-700 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                  onClick={() => copySourceField(field.name)}
                  title={field.label}
                >
                  {field.name}
                </button>
              ))}
              {!hasSearch && (
                <p className="text-xs text-gray-400 py-1">Typ om velden te zoeken uit {schema.source_fields.length} beschikbare velden</p>
              )}
              {hasSearch && filteredFields.length === 0 && (
                <p className="text-xs text-gray-400 py-1">Geen velden gevonden</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mapping fields */}
      <div
        className="rounded-xl border border-gray-200 bg-white p-5 space-y-5"
        style={{ animation: 'fade-in-up 0.3s ease-out 100ms backwards' }}
      >
        <div>
          <h3 className="font-semibold text-gray-900">Veldmapping</h3>
          <p className="text-sm text-gray-500 mt-1">
            Gebruik <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono">{'{{veldnaam}}'}</code> syntax om bronvelden te koppelen. Combineer meerdere velden op aparte regels.
          </p>
        </div>

        <div className="space-y-6">
          {groupedFields.map((group, groupIdx) => (
            <div key={group.label} className="space-y-4">
              {groupedFields.length > 1 && (
                <div className={groupIdx > 0 ? 'border-t border-gray-100 pt-5' : ''}>
                  <h4 className="text-sm font-medium text-gray-700">{group.label}</h4>
                </div>
              )}
              {group.fields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <Label htmlFor={`mapping-${field.name}`} className="flex items-center gap-2">
                    {field.label}
                    {field.required && (
                      <span className="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                        verplicht
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 font-normal">{field.type}</span>
                  </Label>
                  <p className="text-xs text-gray-400">{field.description}</p>
                  {isMultiLine(field) ? (
                    <textarea
                      id={`mapping-${field.name}`}
                      className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[72px]"
                      rows={3}
                      value={mappings[field.name] ?? ''}
                      onChange={(e) => setMappings((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={`bv. {{${field.name === 'description' ? 'cxsrec__Job_description__c' : field.name}}}`}
                    />
                  ) : (
                    <Input
                      id={`mapping-${field.name}`}
                      className="font-mono text-sm"
                      value={mappings[field.name] ?? ''}
                      onChange={(e) => setMappings((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={`bv. {{${schema.default_mapping[field.name]?.template ? schema.default_mapping[field.name].template.replace(/\{\{|\}\}/g, '') : field.name}}}`}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" onClick={handleLoadDefaults}>
            <RotateCcw className="w-3.5 h-3.5" />
            Standaard laden
          </Button>
          <Button onClick={handleSave} disabled={saving || !isValid}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Opslaan
          </Button>
        </div>
      </div>
    </div>
  );
}
