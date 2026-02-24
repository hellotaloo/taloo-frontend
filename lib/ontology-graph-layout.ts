import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import { REQUIREMENT_STYLES } from './ontology-utils';
import type {
  OntologyGraphNode,
  OntologyGraphEdge,
  OntologyType,
  RequirementType,
} from './types';

interface LayoutOptions {
  rankdir?: 'LR' | 'TB';
  nodeWidth?: number;
  nodeHeight?: number;
  ranksep?: number;
  nodesep?: number;
  workspaceName?: string;
}

const WORKSPACE_ROOT_ID = '__workspace_root__';

/**
 * Compute a hierarchical layout for ontology graph data using dagre.
 *
 * All nodes use the same fixed width (matching the CSS `w-[180px]`),
 * so they align into clean columns and dagre can route edges properly.
 */
export function computeGraphLayout(
  apiNodes: OntologyGraphNode[],
  apiEdges: OntologyGraphEdge[],
  types: OntologyType[],
  options: LayoutOptions = {},
): { nodes: Node[]; edges: Edge[] } {
  const {
    rankdir = 'LR',
    nodeWidth = 180,
    nodeHeight = 70,
    ranksep = 150,
    nodesep = 50,
    workspaceName = 'Workspace',
  } = options;

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir, ranksep, nodesep });
  g.setDefaultEdgeLabel(() => ({}));

  // Add a synthetic workspace root node
  g.setNode(WORKSPACE_ROOT_ID, { width: nodeWidth, height: nodeHeight });

  // Add entity nodes — all same width
  apiNodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Track belongs_to children/parents
  const childNodeIds = new Set<string>();
  const parentNodeIds = new Set<string>();

  // Add edges — reverse belongs_to so parent→child for LR layout
  apiEdges.forEach((edge) => {
    if (edge.relation_type === 'belongs_to') {
      g.setEdge(edge.target, edge.source);
      childNodeIds.add(edge.source);
      parentNodeIds.add(edge.target);
    } else {
      g.setEdge(edge.source, edge.target);
    }
  });

  // Connect workspace root to top-level category nodes
  const topLevelNodes = new Set<string>();
  apiNodes.forEach((node) => {
    if (node.type_slug === 'category' && !childNodeIds.has(node.id)) {
      topLevelNodes.add(node.id);
    }
  });

  if (topLevelNodes.size === 0) {
    apiNodes.forEach((node) => {
      if (!childNodeIds.has(node.id) && parentNodeIds.has(node.id)) {
        topLevelNodes.add(node.id);
      }
    });
  }

  if (topLevelNodes.size === 0) {
    apiNodes.forEach((node) => {
      if (node.type_slug === 'category') {
        topLevelNodes.add(node.id);
      }
    });
  }

  topLevelNodes.forEach((nodeId) => {
    g.setEdge(WORKSPACE_ROOT_ID, nodeId);
  });

  dagre.layout(g);

  // ── Build ReactFlow nodes ────────────────────────────────────────────────

  const dagreRoot = g.node(WORKSPACE_ROOT_ID);
  const rfNodes: Node[] = [
    {
      id: WORKSPACE_ROOT_ID,
      type: 'ontologyNode',
      position: {
        x: dagreRoot.x - nodeWidth / 2,
        y: dagreRoot.y - nodeHeight / 2,
      },
      data: {
        label: workspaceName,
        icon: 'building-2',
        color: '#022641',
        typeSlug: 'workspace',
        typeName: 'Workspace',
        description: null,
        metadata: {},
        isWorkspaceRoot: true,
      },
    },
  ];

  apiNodes.forEach((apiNode) => {
    const dagreNode = g.node(apiNode.id);
    const type = types.find((t) => t.slug === apiNode.type_slug);

    rfNodes.push({
      id: apiNode.id,
      type: 'ontologyNode',
      position: {
        x: dagreNode.x - nodeWidth / 2,
        y: dagreNode.y - nodeHeight / 2,
      },
      data: {
        label: apiNode.name,
        icon: apiNode.icon,
        color: apiNode.color ?? type?.color ?? '#6B7280',
        typeSlug: apiNode.type_slug,
        typeName: apiNode.type_name,
        description: apiNode.description,
        metadata: apiNode.metadata,
      },
    });
  });

  // ── Build ReactFlow edges ────────────────────────────────────────────────

  const rfEdges: Edge[] = [];

  // Workspace → category connectors
  topLevelNodes.forEach((nodeId) => {
    rfEdges.push({
      id: `root-${nodeId}`,
      source: WORKSPACE_ROOT_ID,
      target: nodeId,
      type: 'smoothstep',
      style: { stroke: '#022641', strokeWidth: 2 },
    });
  });

  // API edges — reverse belongs_to visually so parent→child
  // Structural edges (belongs_to) are prominent; requires edges are subtle
  // so the hierarchy reads clearly. Hover state highlights specific connections.
  apiEdges.forEach((apiEdge) => {
    const isBelongsTo = apiEdge.relation_type === 'belongs_to';
    const requirementType = apiEdge.metadata
      ?.requirement_type as RequirementType | undefined;
    const reqStyle = requirementType
      ? REQUIREMENT_STYLES[requirementType]
      : null;

    rfEdges.push({
      id: apiEdge.id,
      source: isBelongsTo ? apiEdge.target : apiEdge.source,
      target: isBelongsTo ? apiEdge.source : apiEdge.target,
      type: 'smoothstep',
      style: isBelongsTo
        ? { stroke: '#94a3b8', strokeWidth: 2 }
        : {
            stroke: reqStyle?.color ?? '#cbd5e1',
            strokeWidth: 1,
            opacity: 0.35,
            ...(reqStyle?.lineStyle === 'dashed' && { strokeDasharray: '5,5' }),
            ...(reqStyle?.lineStyle === 'dotted' && { strokeDasharray: '3,3' }),
          },
    });
  });

  return { nodes: rfNodes, edges: rfEdges };
}
