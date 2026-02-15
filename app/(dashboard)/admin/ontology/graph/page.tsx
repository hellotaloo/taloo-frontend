'use client';

import { useCallback, useState, useMemo } from 'react';
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
  ChevronRight,
  Truck,
  Package,
  Stethoscope,
  FileText,
  Boxes,
  Heart,
  Building2,
  X,
  Building,
} from 'lucide-react';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';

// =============================================================================
// CUSTOM NODE COMPONENTS WITH HANDLES
// =============================================================================

interface CompanyNodeData {
  label: string;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

function CompanyNode({ data }: { data: CompanyNodeData }) {
  const opacityClass = data.isDimmed ? 'opacity-20' : data.isHighlighted ? 'opacity-100 ring-2 ring-offset-2 ring-[#022641]' : 'opacity-100';
  return (
    <div className={`px-5 py-4 rounded-2xl bg-[#022641] text-white shadow-lg min-w-[140px] hover:shadow-xl transition-all duration-200 cursor-pointer ${opacityClass}`}>
      <Handle type="target" position={Position.Left} className="!bg-white !w-2 !h-2" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Building className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-base">{data.label}</span>
          <div className="text-xs opacity-75">Workspace</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-white !w-2 !h-2" />
    </div>
  );
}

interface CategoryNodeData {
  label: string;
  icon: React.ElementType;
  color: string;
  slug: string;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

function CategoryNode({ data }: { data: CategoryNodeData }) {
  const Icon = data.icon;
  const opacityClass = data.isDimmed ? 'opacity-20' : data.isHighlighted ? 'opacity-100 ring-2 ring-offset-2 ring-blue-500' : 'opacity-100';
  return (
    <div className={`px-4 py-3 rounded-xl border-2 ${data.color} shadow-sm min-w-[120px] hover:shadow-lg transition-all duration-200 cursor-pointer ${opacityClass}`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      <div className="text-xs mt-1 opacity-75">Category</div>
      <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-2 !h-2" />
    </div>
  );
}

interface JobFunctionNodeData {
  label: string;
  icon: React.ElementType;
  slug: string;
  documentCount: number;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

function JobFunctionNode({ data }: { data: JobFunctionNodeData }) {
  const Icon = data.icon;
  const opacityClass = data.isDimmed ? 'opacity-20' : data.isHighlighted ? 'opacity-100 ring-2 ring-offset-2 ring-[#015AD9]' : 'opacity-100';
  return (
    <div className={`px-4 py-3 rounded-xl bg-white border-2 border-[#015AD9] shadow-md min-w-[140px] hover:shadow-lg transition-all duration-200 cursor-pointer ${opacityClass}`}>
      <Handle type="target" position={Position.Left} className="!bg-[#015AD9] !w-2 !h-2" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-[#015AD9]/10 flex items-center justify-center">
          <Icon className="w-3 h-3 text-[#015AD9]" />
        </div>
        <span className="font-medium text-sm text-gray-900">{data.label}</span>
      </div>
      <div className="text-xs text-gray-500">{data.documentCount} documenten</div>
      <Handle type="source" position={Position.Right} className="!bg-[#015AD9] !w-2 !h-2" />
    </div>
  );
}

interface DocumentNodeData {
  label: string;
  type: 'mandatory' | 'preferred' | 'conditional';
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

function DocumentNode({ data }: { data: DocumentNodeData }) {
  const typeColors = {
    mandatory: 'border-red-300 bg-red-50',
    preferred: 'border-blue-300 bg-blue-50',
    conditional: 'border-orange-300 bg-orange-50',
  };
  const opacityClass = data.isDimmed ? 'opacity-20' : data.isHighlighted ? 'opacity-100 ring-2 ring-offset-2 ring-gray-400' : 'opacity-100';

  return (
    <div className={`px-3 py-2 rounded-lg border ${typeColors[data.type]} min-w-[120px] transition-all duration-200 ${opacityClass}`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <FileText className="w-3 h-3 text-gray-500" />
        <span className="text-xs font-medium text-gray-700">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = {
  company: CompanyNode,
  category: CategoryNode,
  jobFunction: JobFunctionNode,
  document: DocumentNode,
};

// =============================================================================
// GRAPH DATA - Compact layout
// =============================================================================

const initialNodes: Node[] = [
  // Company/Workspace (Column 0) - Root node
  {
    id: 'company',
    type: 'company',
    position: { x: -250, y: 250 },
    data: { label: 'Taloo Demo' },
  },

  // Categories (Column 1)
  {
    id: 'cat-transport',
    type: 'category',
    position: { x: 100, y: 0 },
    data: { label: 'Transport', icon: Truck, color: 'bg-blue-100 border-blue-300 text-blue-700', slug: 'transport' },
  },
  {
    id: 'cat-logistics',
    type: 'category',
    position: { x: 100, y: 170 },
    data: { label: 'Logistics', icon: Boxes, color: 'bg-orange-100 border-orange-300 text-orange-700', slug: 'logistics' },
  },
  {
    id: 'cat-healthcare',
    type: 'category',
    position: { x: 100, y: 340 },
    data: { label: 'Healthcare', icon: Heart, color: 'bg-pink-100 border-pink-300 text-pink-700', slug: 'healthcare' },
  },
  {
    id: 'cat-office',
    type: 'category',
    position: { x: 100, y: 510 },
    data: { label: 'Office', icon: Building2, color: 'bg-gray-100 border-gray-300 text-gray-700', slug: 'office' },
  },

  // Job Functions (Column 2)
  {
    id: 'jf-chauffeur-ce',
    type: 'jobFunction',
    position: { x: 400, y: -50 },
    data: { label: 'Chauffeur CE', icon: Truck, slug: 'chauffeur-ce', documentCount: 5 },
  },
  {
    id: 'jf-chauffeur-c',
    type: 'jobFunction',
    position: { x: 400, y: 50 },
    data: { label: 'Chauffeur C', icon: Truck, slug: 'chauffeur-c', documentCount: 4 },
  },
  {
    id: 'jf-magazijn',
    type: 'jobFunction',
    position: { x: 400, y: 150 },
    data: { label: 'Magazijnmedewerker', icon: Package, slug: 'magazijnmedewerker', documentCount: 3 },
  },
  {
    id: 'jf-heftruck',
    type: 'jobFunction',
    position: { x: 400, y: 250 },
    data: { label: 'Heftruckchauffeur', icon: Package, slug: 'heftruckchauffeur', documentCount: 4 },
  },
  {
    id: 'jf-verpleeg',
    type: 'jobFunction',
    position: { x: 400, y: 350 },
    data: { label: 'Verpleegkundige', icon: Stethoscope, slug: 'verpleegkundige', documentCount: 4 },
  },
  {
    id: 'jf-callcenter',
    type: 'jobFunction',
    position: { x: 400, y: 510 },
    data: { label: 'Callcenter Agent', icon: Building2, slug: 'callcenter-agent', documentCount: 1 },
  },

  // Documents (Column 3)
  {
    id: 'doc-id',
    type: 'document',
    position: { x: 720, y: -80 },
    data: { label: 'Identiteitskaart', type: 'mandatory' },
  },
  {
    id: 'doc-rijbewijs-ce',
    type: 'document',
    position: { x: 720, y: -20 },
    data: { label: 'Rijbewijs CE', type: 'mandatory' },
  },
  {
    id: 'doc-rijbewijs-c',
    type: 'document',
    position: { x: 720, y: 40 },
    data: { label: 'Rijbewijs C', type: 'mandatory' },
  },
  {
    id: 'doc-code95',
    type: 'document',
    position: { x: 720, y: 100 },
    data: { label: 'Code 95', type: 'mandatory' },
  },
  {
    id: 'doc-adr',
    type: 'document',
    position: { x: 720, y: 160 },
    data: { label: 'ADR Certificaat', type: 'conditional' },
  },
  {
    id: 'doc-vca',
    type: 'document',
    position: { x: 720, y: 220 },
    data: { label: 'VCA Certificaat', type: 'mandatory' },
  },
  {
    id: 'doc-heftruck',
    type: 'document',
    position: { x: 720, y: 280 },
    data: { label: 'Heftruckcertificaat', type: 'conditional' },
  },
  {
    id: 'doc-diploma',
    type: 'document',
    position: { x: 720, y: 350 },
    data: { label: 'Diploma Verpleegkunde', type: 'mandatory' },
  },
  {
    id: 'doc-riziv',
    type: 'document',
    position: { x: 720, y: 410 },
    data: { label: 'RIZIV Nummer', type: 'mandatory' },
  },
  {
    id: 'doc-medisch',
    type: 'document',
    position: { x: 720, y: 470 },
    data: { label: 'Medisch Attest', type: 'preferred' },
  },
];

const initialEdges: Edge[] = [
  // Company to Category edges
  { id: 'e-company-transport', source: 'company', target: 'cat-transport', type: 'smoothstep', style: { stroke: '#022641', strokeWidth: 2 } },
  { id: 'e-company-logistics', source: 'company', target: 'cat-logistics', type: 'smoothstep', style: { stroke: '#022641', strokeWidth: 2 } },
  { id: 'e-company-healthcare', source: 'company', target: 'cat-healthcare', type: 'smoothstep', style: { stroke: '#022641', strokeWidth: 2 } },
  { id: 'e-company-office', source: 'company', target: 'cat-office', type: 'smoothstep', style: { stroke: '#022641', strokeWidth: 2 } },

  // Category to Job Function edges
  { id: 'e-cat-transport-ce', source: 'cat-transport', target: 'jf-chauffeur-ce', type: 'smoothstep', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'e-cat-transport-c', source: 'cat-transport', target: 'jf-chauffeur-c', type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'e-cat-logistics-magazijn', source: 'cat-logistics', target: 'jf-magazijn', type: 'smoothstep', style: { stroke: '#f97316', strokeWidth: 2 } },
  { id: 'e-cat-logistics-heftruck', source: 'cat-logistics', target: 'jf-heftruck', type: 'smoothstep', style: { stroke: '#f97316', strokeWidth: 2 } },
  { id: 'e-cat-healthcare-verpleeg', source: 'cat-healthcare', target: 'jf-verpleeg', type: 'smoothstep', style: { stroke: '#ec4899', strokeWidth: 2 } },
  { id: 'e-cat-office-callcenter', source: 'cat-office', target: 'jf-callcenter', type: 'smoothstep', style: { stroke: '#6b7280', strokeWidth: 2 } },

  // Job Function to Document edges
  // Chauffeur CE
  { id: 'e-ce-id', source: 'jf-chauffeur-ce', target: 'doc-id', type: 'smoothstep', style: { stroke: '#cbd5e1' } },
  { id: 'e-ce-rijbewijs', source: 'jf-chauffeur-ce', target: 'doc-rijbewijs-ce', type: 'smoothstep', style: { stroke: '#cbd5e1' } },
  { id: 'e-ce-code95', source: 'jf-chauffeur-ce', target: 'doc-code95', type: 'smoothstep', style: { stroke: '#cbd5e1' } },
  { id: 'e-ce-adr', source: 'jf-chauffeur-ce', target: 'doc-adr', type: 'smoothstep', style: { stroke: '#cbd5e1', strokeDasharray: '5,5' } },
  { id: 'e-ce-medisch', source: 'jf-chauffeur-ce', target: 'doc-medisch', type: 'smoothstep', style: { stroke: '#cbd5e1', strokeDasharray: '3,3' } },

  // Chauffeur C
  { id: 'e-c-id', source: 'jf-chauffeur-c', target: 'doc-id', type: 'smoothstep', style: { stroke: '#cbd5e1' } },
  { id: 'e-c-rijbewijs', source: 'jf-chauffeur-c', target: 'doc-rijbewijs-c', type: 'smoothstep', style: { stroke: '#cbd5e1' } },
  { id: 'e-c-code95', source: 'jf-chauffeur-c', target: 'doc-code95', type: 'smoothstep', style: { stroke: '#cbd5e1' } },

  // Magazijn
  { id: 'e-magazijn-id', source: 'jf-magazijn', target: 'doc-id', type: 'smoothstep', style: { stroke: '#cbd5e1' } },
  { id: 'e-magazijn-vca', source: 'jf-magazijn', target: 'doc-vca', type: 'smoothstep', style: { stroke: '#cbd5e1' } },
  { id: 'e-magazijn-heftruck', source: 'jf-magazijn', target: 'doc-heftruck', type: 'smoothstep', style: { stroke: '#cbd5e1', strokeDasharray: '5,5' } },

  // Heftruck
  { id: 'e-heftruck-id', source: 'jf-heftruck', target: 'doc-id', type: 'smoothstep', style: { stroke: '#cbd5e1' } },
  { id: 'e-heftruck-vca', source: 'jf-heftruck', target: 'doc-vca', type: 'smoothstep', style: { stroke: '#cbd5e1' } },
  { id: 'e-heftruck-cert', source: 'jf-heftruck', target: 'doc-heftruck', type: 'smoothstep', style: { stroke: '#cbd5e1' } },

  // Verpleegkundige
  { id: 'e-verpleeg-id', source: 'jf-verpleeg', target: 'doc-id', type: 'smoothstep', style: { stroke: '#cbd5e1' } },
  { id: 'e-verpleeg-diploma', source: 'jf-verpleeg', target: 'doc-diploma', type: 'smoothstep', style: { stroke: '#cbd5e1' } },
  { id: 'e-verpleeg-riziv', source: 'jf-verpleeg', target: 'doc-riziv', type: 'smoothstep', style: { stroke: '#cbd5e1' } },

  // Callcenter
  { id: 'e-callcenter-id', source: 'jf-callcenter', target: 'doc-id', type: 'smoothstep', style: { stroke: '#cbd5e1' } },
];

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function OntologyGraphPage() {
  const router = useRouter();
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Compute connected nodes when hovering
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();

    const connected = new Set<string>();
    connected.add(hoveredNodeId);

    // Find all directly connected nodes via edges
    initialEdges.forEach((edge) => {
      if (edge.source === hoveredNodeId) {
        connected.add(edge.target);
      }
      if (edge.target === hoveredNodeId) {
        connected.add(edge.source);
      }
    });

    // For transitive highlighting (e.g., Category → JobFunction → Documents)
    // Also highlight nodes connected to connected nodes
    const firstLevelConnected = new Set(connected);
    firstLevelConnected.forEach((nodeId) => {
      initialEdges.forEach((edge) => {
        if (edge.source === nodeId) {
          connected.add(edge.target);
        }
        if (edge.target === nodeId) {
          connected.add(edge.source);
        }
      });
    });

    return connected;
  }, [hoveredNodeId]);

  // Apply highlight/dim styles to nodes based on hover state
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

  // Apply styles to edges based on hover state
  const styledEdges = useMemo(() => {
    if (!hoveredNodeId) return edges;

    return edges.map((edge) => {
      const isConnected = connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target);
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: isConnected ? 1 : 0.1,
          strokeWidth: isConnected ? (Number(edge.style?.strokeWidth) || 1) + 1 : Number(edge.style?.strokeWidth) || 1,
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

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'company') {
      router.push('/admin/ontology');
    } else if (node.type === 'category' && node.data.slug) {
      router.push(`/admin/ontology/category/${node.data.slug}`);
    } else if (node.type === 'jobFunction' && node.data.slug) {
      router.push(`/admin/ontology/job-function/${node.data.slug}`);
    }
  }, [router]);

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/ontology')}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-lg">
              <button
                onClick={() => router.push('/admin/ontology')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                Ontology
              </button>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <h1 className="font-semibold text-gray-900">Graph</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
                <span>Verplicht</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300" />
                <span>Voorwaardelijk</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                <span>Gewenst</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/ontology')}
            >
              <X className="w-4 h-4 mr-1" />
              Sluiten
            </Button>
          </div>
        </div>
      </PageLayoutHeader>

      <PageLayoutContent contentClassName="p-0">
        <div className="w-full h-full bg-gray-50 relative">
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
                if (node.type === 'category') return '#e5e7eb';
                if (node.type === 'jobFunction') return '#015AD9';
                return '#94a3b8';
              }}
              maskColor="rgba(255, 255, 255, 0.8)"
            />
          </ReactFlow>
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
