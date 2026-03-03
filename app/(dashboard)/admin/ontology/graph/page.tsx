'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { OntologySidebar } from '@/components/blocks/ontology-sidebar';
import { getOntologyGraph } from '@/lib/ontology-api';
import { computeGraphLayout } from '@/lib/ontology-graph-layout';
import { getLucideIcon, REQUIREMENT_STYLES } from '@/lib/ontology-utils';
import type { OntologyType, RequirementType } from '@/lib/types';
import { toast } from 'sonner';

// =============================================================================
// GENERIC NODE COMPONENT
// =============================================================================

interface OntologyNodeData {
  label: string;
  icon: string | null;
  color: string;
  typeSlug: string;
  typeName: string;
  description: string | null;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isWorkspaceRoot?: boolean;
  [key: string]: unknown;
}

function OntologyNode({ data }: { data: OntologyNodeData }) {
  const Icon = getLucideIcon(data.icon);
  const isRoot = data.isWorkspaceRoot;
  const opacityClass = data.isDimmed
    ? 'opacity-20'
    : data.isHighlighted
      ? 'opacity-100 ring-2 ring-offset-2 ring-blue-500'
      : 'opacity-100';

  if (isRoot) {
    return (
      <div
        className={`w-[180px] px-5 py-4 rounded-xl bg-brand-dark-blue shadow-lg transition-all duration-200 ${opacityClass}`}
      >
        <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-sm text-white">{data.label}</span>
            <div className="text-xs text-brand-light-blue">{data.typeName}</div>
          </div>
        </div>
        <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-2 !h-2" />
      </div>
    );
  }

  return (
    <div
      className={`w-[180px] px-4 py-3 rounded-xl bg-white border-2 shadow-sm transition-all duration-200 cursor-pointer ${opacityClass}`}
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${data.color}20` }}
        >
          <Icon className="w-3 h-3" style={{ color: data.color }} />
        </div>
        <span className="font-medium text-sm text-gray-900 truncate">{data.label}</span>
      </div>
      <div className="text-xs mt-1 text-gray-400 truncate">{data.typeName}</div>
      <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { ontologyNode: OntologyNode };

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function OntologyGraphPage() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [graphTypes, setGraphTypes] = useState<OntologyType[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch graph data
  useEffect(() => {
    async function load() {
      try {
        const graphData = await getOntologyGraph();
        const { nodes: layoutNodes, edges: layoutEdges } = computeGraphLayout(
          graphData.nodes,
          graphData.edges,
          graphData.types,
        );
        setNodes(layoutNodes);
        setEdges(layoutEdges);
        setGraphTypes(graphData.types);
      } catch {
        toast.error('Kon graph niet laden');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setNodes, setEdges]);

  // Compute connected nodes when hovering
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();

    const connected = new Set<string>();
    connected.add(hoveredNodeId);

    edges.forEach((edge) => {
      if (edge.source === hoveredNodeId) connected.add(edge.target);
      if (edge.target === hoveredNodeId) connected.add(edge.source);
    });

    return connected;
  }, [hoveredNodeId, edges]);

  // Apply highlight/dim styles to nodes
  const styledNodes = useMemo(() => {
    if (!hoveredNodeId) return nodes;
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isHighlighted: connectedNodeIds.has(node.id),
        isDimmed: !connectedNodeIds.has(node.id),
      },
    }));
  }, [nodes, hoveredNodeId, connectedNodeIds]);

  // Apply styles to edges
  const styledEdges = useMemo(() => {
    if (!hoveredNodeId) return edges;
    return edges.map((edge) => {
      const isConnected =
        connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target);
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: isConnected ? 1 : 0.1,
          strokeWidth: isConnected
            ? (Number(edge.style?.strokeWidth) || 1) + 1
            : Number(edge.style?.strokeWidth) || 1,
        },
        animated: isConnected && edge.source === hoveredNodeId,
      };
    });
  }, [edges, hoveredNodeId, connectedNodeIds]);

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id === '__workspace_root__') return;
      const data = node.data as OntologyNodeData;
      router.push(`/admin/ontology?section=${data.typeSlug}&entity=${node.id}`);
    },
    [router],
  );

  const sidebar = (
    <OntologySidebar
      mode="browse"
      activeSection="graph"
      onSectionChange={(section) => {
        router.push(`/admin/ontology?section=${section}`);
      }}
      searchQuery=""
      onSearchChange={() => {}}
      onGraphClick={() => {}}
    />
  );

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/ontology')}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Ontology</h1>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {(Object.entries(REQUIREMENT_STYLES) as [RequirementType, typeof REQUIREMENT_STYLES[RequirementType]][]).map(
              ([key, style]) => (
                <div key={key} className="flex items-center gap-1">
                  <div
                    className="w-3 h-0.5"
                    style={{
                      backgroundColor: style.color,
                      borderStyle: style.lineStyle === 'dashed' ? 'dashed' : style.lineStyle === 'dotted' ? 'dotted' : 'solid',
                    }}
                  />
                  <span>{style.label}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </PageLayoutHeader>

      <PageLayoutContent sidebar={sidebar} sidebarPosition="left" sidebarWidth={240} contentClassName="p-0">
        <div className="w-full h-full bg-gray-50 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
                <p className="text-sm text-gray-500">Graph laden...</p>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={styledNodes}
              edges={styledEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onNodeMouseEnter={onNodeMouseEnter}
              onNodeMouseLeave={onNodeMouseLeave}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.5, maxZoom: 0.8 }}
              minZoom={0.3}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#e5e7eb" gap={20} />
              <Controls showInteractive={false} />
              <MiniMap
                nodeColor={(node) => {
                  const color = (node.data as OntologyNodeData)?.color;
                  return color || '#94a3b8';
                }}
                maskColor="rgba(255, 255, 255, 0.8)"
              />
            </ReactFlow>
          )}
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
