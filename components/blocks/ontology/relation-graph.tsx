'use client';

import { useMemo, useCallback } from 'react';
import dagre from 'dagre';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Position,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getLucideIcon } from '@/lib/ontology-utils';
import type { OntologyRelation, OntologyType } from '@/lib/types';

// =============================================================================
// Node Components
// =============================================================================

interface MiniNodeData {
  label: string;
  icon: string | null;
  color: string;
  typeName: string;
  isCurrent?: boolean;
  isGroup?: boolean;
  [key: string]: unknown;
}

function MiniNode({ data }: { data: MiniNodeData }) {
  const Icon = getLucideIcon(data.icon);

  // Current entity — dark blue, prominent
  if (data.isCurrent) {
    return (
      <div className="px-4 py-3 rounded-xl bg-brand-dark-blue shadow-md w-[160px]">
        <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2 !h-2" />
        <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-2 !h-2" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-xs text-white truncate block">{data.label}</span>
            <span className="text-[10px] text-brand-light-blue">{data.typeName}</span>
          </div>
        </div>
      </div>
    );
  }

  // Group node — subtle label
  if (data.isGroup) {
    return (
      <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 min-w-[100px]">
        <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2 !h-2" />
        <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-2 !h-2" />
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
          <span className="font-medium text-xs text-gray-600">{data.label}</span>
        </div>
      </div>
    );
  }

  // Regular entity node
  return (
    <div
      className="px-3 py-2.5 rounded-xl bg-white border-2 shadow-sm transition-shadow cursor-pointer w-[160px]"
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${data.color}20` }}
        >
          <Icon className="w-3 h-3" style={{ color: data.color }} />
        </div>
        <div className="min-w-0">
          <span className="font-medium text-xs text-gray-900 truncate block">{data.label}</span>
          <span className="text-[10px] text-gray-400">{data.typeName}</span>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { miniNode: MiniNode };

// =============================================================================
// Group definitions per entity type
// =============================================================================

interface GroupDef {
  key: string;
  label: string;
  icon: string;
  /** Extract children from relations for this group */
  getChildren: (
    entityId: string,
    relations: OntologyRelation[],
  ) => Array<{ id: string; name: string; typeSlug: string }>;
}

const JOB_FUNCTION_GROUPS: GroupDef[] = [
  {
    key: 'documents',
    label: 'Documenten',
    icon: 'file-text',
    getChildren: (eid, rels) =>
      rels
        .filter((r) => r.source_entity_id === eid && r.relation_type_slug === 'requires')
        .map((r) => ({ id: r.target_entity_id, name: r.target_entity_name, typeSlug: r.target_type_slug })),
  },
  {
    key: 'requirements',
    label: 'Vereisten',
    icon: 'clipboard-list',
    getChildren: () => [], // no relations yet
  },
];

const CATEGORY_GROUPS: GroupDef[] = [
  {
    key: 'job-functions',
    label: 'Functies',
    icon: 'briefcase',
    getChildren: (eid, rels) =>
      rels
        .filter((r) => r.target_entity_id === eid && r.relation_type_slug === 'belongs_to')
        .map((r) => ({ id: r.source_entity_id, name: r.source_entity_name, typeSlug: r.source_type_slug })),
  },
];

const DOCUMENT_TYPE_GROUPS: GroupDef[] = [
  {
    key: 'used-by',
    label: 'Gebruikt door',
    icon: 'users',
    getChildren: (eid, rels) =>
      rels
        .filter((r) => r.target_entity_id === eid && r.relation_type_slug === 'requires')
        .map((r) => ({ id: r.source_entity_id, name: r.source_entity_name, typeSlug: r.source_type_slug })),
  },
];

function getGroupDefs(typeSlug: string): GroupDef[] {
  switch (typeSlug) {
    case 'job_function':
      return JOB_FUNCTION_GROUPS;
    case 'category':
      return CATEGORY_GROUPS;
    case 'document_type':
      return DOCUMENT_TYPE_GROUPS;
    default:
      return [];
  }
}

// =============================================================================
// Layout
// =============================================================================

const NODE_WIDTH = 160;
const NODE_HEIGHT = 56;
const GROUP_HEIGHT = 36;

function computeLayout(
  entityId: string,
  entityName: string,
  entityIcon: string | null,
  entityColor: string,
  entityTypeName: string,
  entityTypeSlug: string,
  relations: OntologyRelation[],
  types: OntologyType[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', ranksep: 50, nodesep: 24 });
  g.setDefaultEdgeLabel(() => ({}));

  // Current entity
  g.setNode(entityId, { width: NODE_WIDTH, height: NODE_HEIGHT });

  // Find parents: belongs_to where we are the source → target is parent
  const parents = relations
    .filter((r) => r.relation_type_slug === 'belongs_to' && r.source_entity_id === entityId)
    .map((r) => ({
      id: r.target_entity_id,
      name: r.target_entity_name,
      typeSlug: r.target_type_slug,
    }));

  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  // --- Parent nodes (above current entity) ---
  parents.forEach((parent) => {
    const type = types.find((t) => t.slug === parent.typeSlug);
    g.setNode(parent.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    g.setEdge(parent.id, entityId);

    rfNodes.push({
      id: parent.id,
      type: 'miniNode',
      position: { x: 0, y: 0 },
      data: {
        label: parent.name,
        icon: type?.icon ?? null,
        color: type?.color ?? '#6B7280',
        typeName: type?.name ?? parent.typeSlug,
      },
    });

    rfEdges.push({
      id: `parent-${parent.id}`,
      source: parent.id,
      target: entityId,
      type: 'straight',
      style: { stroke: '#94a3b8', strokeWidth: 2 },
    });
  });

  // --- Current entity node ---
  rfNodes.push({
    id: entityId,
    type: 'miniNode',
    position: { x: 0, y: 0 },
    data: {
      label: entityName,
      icon: entityIcon,
      color: entityColor,
      typeName: entityTypeName,
      isCurrent: true,
    },
  });

  // --- Child groups (always shown, even if empty) ---
  const groupDefs = getGroupDefs(entityTypeSlug);

  groupDefs.forEach((groupDef) => {
    const groupNodeId = `__group_${groupDef.key}__`;
    const children = groupDef.getChildren(entityId, relations);

    // Deduplicate children
    const uniqueChildren = new Map<string, { id: string; name: string; typeSlug: string }>();
    children.forEach((c) => { if (!uniqueChildren.has(c.id)) uniqueChildren.set(c.id, c); });

    g.setNode(groupNodeId, { width: NODE_WIDTH, height: GROUP_HEIGHT });
    g.setEdge(entityId, groupNodeId);

    const countLabel = uniqueChildren.size > 0 ? ` (${uniqueChildren.size})` : '';
    rfNodes.push({
      id: groupNodeId,
      type: 'miniNode',
      position: { x: 0, y: 0 },
      data: {
        label: `${groupDef.label}${countLabel}`,
        icon: groupDef.icon,
        color: '#6B7280',
        typeName: '',
        isGroup: true,
      },
    });

    rfEdges.push({
      id: `group-${groupDef.key}`,
      source: entityId,
      target: groupNodeId,
      type: 'straight',
      style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
    });

    // Individual child entities
    uniqueChildren.forEach((child) => {
      const type = types.find((t) => t.slug === child.typeSlug);
      g.setNode(child.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
      g.setEdge(groupNodeId, child.id);

      rfNodes.push({
        id: child.id,
        type: 'miniNode',
        position: { x: 0, y: 0 },
        data: {
          label: child.name,
          icon: type?.icon ?? null,
          color: type?.color ?? '#6B7280',
          typeName: type?.name ?? child.typeSlug,
        },
      });

      rfEdges.push({
        id: `child-${groupDef.key}-${child.id}`,
        source: groupNodeId,
        target: child.id,
        type: 'straight',
        style: { stroke: '#cbd5e1', strokeWidth: 1 },
      });
    });
  });

  // Run dagre layout
  dagre.layout(g);

  // Apply dagre positions to ReactFlow nodes
  const centerX = g.node(entityId).x;
  const parentIds = new Set(parents.map((p) => p.id));

  rfNodes.forEach((node) => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      const h = node.data.isGroup ? GROUP_HEIGHT : NODE_HEIGHT;
      // Align parents directly above the current entity for a straight vertical line
      const x = parentIds.has(node.id) ? centerX : dagreNode.x;
      node.position = {
        x: x - NODE_WIDTH / 2,
        y: dagreNode.y - h / 2,
      };
    }
  });

  return { nodes: rfNodes, edges: rfEdges };
}

// =============================================================================
// Component
// =============================================================================

export interface RelationGraphProps {
  entityId: string;
  entityName: string;
  entityIcon: string | null;
  entityColor: string;
  entityTypeName: string;
  entityTypeSlug: string;
  relations: OntologyRelation[];
  types: OntologyType[];
  onEntityClick?: (entityId: string) => void;
  className?: string;
}

export function RelationGraph({
  entityId,
  entityName,
  entityIcon,
  entityColor,
  entityTypeName,
  entityTypeSlug,
  relations,
  types,
  onEntityClick,
  className,
}: RelationGraphProps) {
  const { nodes, edges } = useMemo(
    () => computeLayout(entityId, entityName, entityIcon, entityColor, entityTypeName, entityTypeSlug, relations, types),
    [entityId, entityName, entityIcon, entityColor, entityTypeName, entityTypeSlug, relations, types],
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id !== entityId && !node.id.startsWith('__group_')) {
        onEntityClick?.(node.id);
      }
    },
    [entityId, onEntityClick],
  );

  if (relations.length === 0) {
    return (
      <div className={`rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-400 ${className || ''}`}>
        Geen relaties om te visualiseren
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-gray-200 bg-white overflow-hidden ${className || ''}`}>
      <div className="h-[350px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
          minZoom={0.4}
          maxZoom={1.2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#f3f4f6" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
