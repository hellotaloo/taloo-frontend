'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  FileText,
  ChevronRight,
  Briefcase,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InspectorPanel } from './inspector-panel';
import { AddRelationDialog } from './add-relation-dialog';
import { RelationGraph } from './relation-graph';
import { getOntologyEntity } from '@/lib/ontology-api';
import { getEffectiveVisuals, REQUIREMENT_STYLES } from '@/lib/ontology-utils';
import type {
  OntologyEntityDetail,
  OntologyType,
  OntologyRelation,
  RequirementType,
} from '@/lib/types';
import { toast } from 'sonner';

export interface EntityDetailViewProps {
  entityId: string;
  types: OntologyType[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onEntityClick: (entityId: string) => void;
  onEntityLoaded?: (entity: OntologyEntityDetail) => void;
  onRefresh?: () => void;
}

export function EntityDetailView({
  entityId,
  types,
  activeTab,
  onEntityClick,
  onEntityLoaded,
  onRefresh,
}: EntityDetailViewProps) {
  const [entity, setEntity] = useState<OntologyEntityDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Inspector panel state
  const [selectedRelation, setSelectedRelation] = useState<OntologyRelation | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Add relation dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const loadEntity = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOntologyEntity(entityId);
      setEntity(data);
      onEntityLoaded?.(data);
    } catch {
      toast.error('Kon entiteit niet laden');
    } finally {
      setLoading(false);
    }
  }, [entityId, onEntityLoaded]);

  useEffect(() => {
    loadEntity();
  }, [loadEntity]);

  const handleRefresh = () => {
    loadEntity();
    onRefresh?.();
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-5xl space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-full max-w-md bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (!entity) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">Entiteit niet gevonden</p>
      </div>
    );
  }

  const { icon: EntityIcon, color: entityColor } = getEffectiveVisuals(entity, types);

  // Extract relations by type
  const documentRequirements = entity.relations
    .filter(
      (r) => r.source_entity_id === entityId && r.relation_type_slug === 'requires',
    )
    .sort(
      (a, b) =>
        ((a.metadata.priority as number) ?? 99) -
        ((b.metadata.priority as number) ?? 99),
    );

  const childJobFunctions = entity.relations.filter(
    (r) => r.target_entity_id === entityId && r.relation_type_slug === 'belongs_to',
  );

  const usedByFunctions = entity.relations.filter(
    (r) => r.target_entity_id === entityId && r.relation_type_slug === 'requires',
  );

  const belongsToCategory = entity.relations.find(
    (r) => r.source_entity_id === entityId && r.relation_type_slug === 'belongs_to',
  );

  const handleRelationClick = (relation: OntologyRelation) => {
    setSelectedRelation(relation);
    setInspectorOpen(true);
  };

  // =========================================================================
  // Tab Content Renderers
  // =========================================================================

  const renderContent = () => {
    switch (entity.type_slug) {
      case 'job_function':
        return renderJobFunctionContent();
      case 'category':
        return renderCategoryContent();
      case 'document_type':
        return renderDocumentTypeContent();
      default:
        return renderDefaultContent();
    }
  };

  const renderJobFunctionContent = () => {
    switch (activeTab) {
      case 'documents':
        return (
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Vereiste Documenten</h3>
              <Button
                size="sm"
                className="bg-gray-900 hover:bg-gray-800"
                onClick={() => setAddDialogOpen(true)}
                data-testid="add-document-btn"
              >
                <Plus className="w-4 h-4 mr-1" />
                Toevoegen
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Voorwaarde</TableHead>
                  <TableHead className="text-right">Prioriteit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentRequirements.map((rel) => {
                  const reqType = rel.metadata.requirement_type as RequirementType;
                  const style = REQUIREMENT_STYLES[reqType] || REQUIREMENT_STYLES.verplicht;
                  return (
                    <TableRow
                      key={rel.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRelationClick(rel)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          {rel.target_entity_name}
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${style.badgeClass}`}>
                          {style.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {(rel.metadata.condition as string) || '-'}
                      </TableCell>
                      <TableCell className="text-right text-gray-500">
                        {(rel.metadata.priority as number) ?? '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {documentRequirements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      Geen documenten gekoppeld
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        );
      case 'requirements':
        return (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-gray-500">Vereisten configuratie komt binnenkort.</p>
          </div>
        );
      case 'relationships':
        return renderAllRelations();
      default:
        // overview
        return (
          <div className="space-y-6">
            {entity.description && (
              <div
                className="rounded-xl border border-gray-200 bg-white p-5"
                style={{ animation: 'fade-in-up 0.3s ease-out 0ms backwards' }}
              >
                <p className="text-sm text-gray-500 mb-1">Beschrijving</p>
                <p className="text-gray-900">{entity.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="rounded-xl border border-gray-200 bg-white p-5"
                style={{ animation: `fade-in-up 0.3s ease-out ${entity.description ? 50 : 0}ms backwards` }}
              >
                <p className="text-sm text-gray-500 mb-1">Documenten</p>
                <p className="text-2xl font-semibold">{documentRequirements.length}</p>
              </div>
              <div
                className="rounded-xl border border-gray-200 bg-white p-5"
                style={{ animation: `fade-in-up 0.3s ease-out ${entity.description ? 100 : 50}ms backwards` }}
              >
                <p className="text-sm text-gray-500 mb-1">Relaties</p>
                <p className="text-2xl font-semibold">{entity.relation_count}</p>
              </div>
              {belongsToCategory && (
                <div
                  className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 cursor-pointer transition-colors"
                  onClick={() => onEntityClick(belongsToCategory.target_entity_id)}
                  style={{ animation: `fade-in-up 0.3s ease-out ${entity.description ? 150 : 100}ms backwards` }}
                >
                  <p className="text-sm text-gray-500 mb-1">Categorie</p>
                  <p className="text-2xl font-semibold">
                    {belongsToCategory.target_entity_name}
                  </p>
                </div>
              )}
            </div>
            <RelationGraph
              entityId={entityId}
              entityName={entity.name}
              entityIcon={entity.icon}
              entityColor={entityColor}
              entityTypeName={entity.type_name}
              entityTypeSlug={entity.type_slug}
              relations={entity.relations}
              types={types}
              onEntityClick={onEntityClick}
            />
          </div>
        );
    }
  };

  const renderCategoryContent = () => {
    switch (activeTab) {
      case 'job-functions':
        return (
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">
                Job Functions in deze categorie
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Functie</TableHead>
                  <TableHead className="text-right">Relaties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {childJobFunctions.map((rel) => (
                  <TableRow
                    key={rel.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onEntityClick(rel.source_entity_id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#015AD9]/10 flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-[#015AD9]" />
                        </div>
                        <span>{rel.source_entity_name}</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-gray-500">-</TableCell>
                  </TableRow>
                ))}
                {childJobFunctions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                      Geen job functions in deze categorie
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        );
      case 'relationships':
        return renderAllRelations();
      default:
        // overview
        return (
          <div className="space-y-6">
            {entity.description && (
              <div
                className="rounded-xl border border-gray-200 bg-white p-5"
                style={{ animation: 'fade-in-up 0.3s ease-out 0ms backwards' }}
              >
                <p className="text-sm text-gray-500 mb-1">Beschrijving</p>
                <p className="text-gray-900">{entity.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="rounded-xl border border-gray-200 bg-white p-5"
                style={{ animation: `fade-in-up 0.3s ease-out ${entity.description ? 50 : 0}ms backwards` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Job Functions</p>
                    <p className="text-2xl font-semibold">{childJobFunctions.length}</p>
                  </div>
                </div>
              </div>
              <div
                className="rounded-xl border border-gray-200 bg-white p-5"
                style={{ animation: `fade-in-up 0.3s ease-out ${entity.description ? 100 : 50}ms backwards` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Relaties</p>
                    <p className="text-2xl font-semibold">{entity.relation_count}</p>
                  </div>
                </div>
              </div>
            </div>
            <RelationGraph
              entityId={entityId}
              entityName={entity.name}
              entityIcon={entity.icon}
              entityColor={entityColor}
              entityTypeName={entity.type_name}
              entityTypeSlug={entity.type_slug}
              relations={entity.relations}
              types={types}
              onEntityClick={onEntityClick}
            />
          </div>
        );
    }
  };

  const renderDocumentTypeContent = () => {
    switch (activeTab) {
      case 'used-by':
        return (
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">
                Functies die dit document vereisen
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Functie</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Voorwaarde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usedByFunctions.map((rel) => {
                  const reqType = rel.metadata.requirement_type as RequirementType;
                  const style = REQUIREMENT_STYLES[reqType] || REQUIREMENT_STYLES.verplicht;
                  return (
                    <TableRow
                      key={rel.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => onEntityClick(rel.source_entity_id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          {rel.source_entity_name}
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${style.badgeClass}`}>
                          {style.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {(rel.metadata.condition as string) || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {usedByFunctions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                      Dit document wordt nog niet gebruikt
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        );
      case 'relationships':
        return renderAllRelations();
      default:
        // overview
        return (
          <div className="space-y-6">
            {entity.description && (
              <div
                className="rounded-xl border border-gray-200 bg-white p-5"
                style={{ animation: 'fade-in-up 0.3s ease-out 0ms backwards' }}
              >
                <p className="text-sm text-gray-500 mb-1">Beschrijving</p>
                <p className="text-gray-900">{entity.description}</p>
              </div>
            )}
            <RelationGraph
              entityId={entityId}
              entityName={entity.name}
              entityIcon={entity.icon}
              entityColor={entityColor}
              entityTypeName={entity.type_name}
              entityTypeSlug={entity.type_slug}
              relations={entity.relations}
              types={types}
              onEntityClick={onEntityClick}
            />
          </div>
        );
    }
  };

  const renderDefaultContent = () => {
    switch (activeTab) {
      case 'relationships':
        return renderAllRelations();
      default:
        // overview
        return (
          <div className="space-y-6">
            {entity.description && (
              <div
                className="rounded-xl border border-gray-200 bg-white p-5"
                style={{ animation: 'fade-in-up 0.3s ease-out 0ms backwards' }}
              >
                <p className="text-sm text-gray-500 mb-1">Beschrijving</p>
                <p className="text-gray-900">{entity.description}</p>
              </div>
            )}
            <RelationGraph
              entityId={entityId}
              entityName={entity.name}
              entityIcon={entity.icon}
              entityColor={entityColor}
              entityTypeName={entity.type_name}
              entityTypeSlug={entity.type_slug}
              relations={entity.relations}
              types={types}
              onEntityClick={onEntityClick}
            />
          </div>
        );
    }
  };

  const renderAllRelations = () => (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">
          Alle Relaties ({entity.relations.length})
        </h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Van</TableHead>
            <TableHead>Relatie</TableHead>
            <TableHead>Naar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entity.relations.map((rel) => (
            <TableRow key={rel.id} className="hover:bg-gray-50">
              <TableCell>
                <button
                  className="text-blue-600 hover:underline font-medium"
                  onClick={() => onEntityClick(rel.source_entity_id)}
                >
                  {rel.source_entity_name}
                </button>
                <span className="text-xs text-gray-400 ml-1">
                  ({rel.source_type_slug})
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {rel.relation_type_name}
                </Badge>
              </TableCell>
              <TableCell>
                <button
                  className="text-blue-600 hover:underline font-medium"
                  onClick={() => onEntityClick(rel.target_entity_id)}
                >
                  {rel.target_entity_name}
                </button>
                <span className="text-xs text-gray-400 ml-1">
                  ({rel.target_type_slug})
                </span>
              </TableCell>
            </TableRow>
          ))}
          {entity.relations.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                Geen relaties gevonden
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  // =========================================================================
  // Main Render
  // =========================================================================

  return (
    <>
      <div className="max-w-5xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: entityColor }}
            >
              <EntityIcon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{entity.name}</h2>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                  {entity.type_name}
                </Badge>
                {belongsToCategory && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-gray-100 text-gray-600 hover:opacity-80 cursor-pointer"
                    onClick={() => onEntityClick(belongsToCategory.target_entity_id)}
                  >
                    {belongsToCategory.target_entity_name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab content driven by sidebar */}
        {renderContent()}
      </div>

      {/* Inspector Panel */}
      <InspectorPanel
        relation={selectedRelation}
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        onSaved={handleRefresh}
        onDeleted={handleRefresh}
      />

      {/* Add Relation Dialog */}
      {entity.type_slug === 'job_function' && (
        <AddRelationDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          sourceEntityId={entityId}
          targetTypeSlug="document_type"
          relationTypeSlug="requires"
          onCreated={handleRefresh}
        />
      )}
    </>
  );
}
