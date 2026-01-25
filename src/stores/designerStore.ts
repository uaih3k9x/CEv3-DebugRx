import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import * as api from '../api/client';
import type { WorkflowDesign, DesignerNode, DesignerEdge, NodeTemplate } from '../types/workflow';

interface DesignerState {
  // 当前设计
  design: WorkflowDesign | null;
  designId: string | null;

  // React Flow 节点和边
  nodes: Node[];
  edges: Edge[];

  // 选中状态
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // 节点模板
  templates: NodeTemplate[];

  // 加载状态
  loading: boolean;
  saving: boolean;
  error: string | null;

  // 操作
  loadTemplates: () => Promise<void>;
  setTemplates: (templates: NodeTemplate[]) => void;
  createDraft: (name: string, description?: string) => Promise<string>;
  loadDraft: (id: string) => Promise<void>;
  saveDraft: () => Promise<void>;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (node: Omit<DesignerNode, 'id'> & { id?: string }) => void;
  updateNode: (nodeId: string, data: Partial<DesignerNode>) => void;
  deleteNode: (nodeId: string) => void;

  addEdge: (edge: Omit<DesignerEdge, 'id'>) => void;
  updateEdge: (edgeId: string, data: Partial<DesignerEdge>) => void;
  deleteEdge: (edgeId: string) => void;

  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;

  // 转换函数
  toDesignerNodes: () => DesignerNode[];
  toDesignerEdges: () => DesignerEdge[];

  // 验证与发布
  validate: () => Promise<api.ValidationResult>;
  publish: () => Promise<string>;

  // 清空
  reset: () => void;
}

// 将 DesignerNode 转换为 React Flow Node
const toFlowNode = (node: DesignerNode): Node => ({
  id: node.id,
  type: node.type,
  position: { x: node.position.x, y: node.position.y },
  data: {
    label: node.name,
    ...node.properties,
  },
});

// 将 DesignerEdge 转换为 React Flow Edge
const toFlowEdge = (edge: DesignerEdge): Edge => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  sourceHandle: edge.sourcePort,
  targetHandle: edge.targetPort,
  label: edge.label,
  type: 'smoothstep',
  data: {
    condition: edge.condition,
    priority: edge.priority,
  },
});

export const useDesignerStore = create<DesignerState>((set, get) => ({
  design: null,
  designId: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  templates: [],
  loading: false,
  saving: false,
  error: null,

  loadTemplates: async () => {
    try {
      const templates = await api.getTemplates();
      set({ templates: templates as NodeTemplate[] });
    } catch (err) {
      console.error('Failed to load templates:', err);
      // 使用默认模板
      set({
        templates: [
          { type: 'start', name: '开始', icon: 'play', category: 'control', description: '流程开始', defaultProps: {}, ports: { inputs: [], outputs: [{ id: 'out', name: '输出', position: 'bottom' }] }, configurable: [] },
          { type: 'end', name: '结束', icon: 'square', category: 'control', description: '流程结束', defaultProps: {}, ports: { inputs: [{ id: 'in', name: '输入', position: 'top' }], outputs: [] }, configurable: [] },
          { type: 'user_task', name: '用户任务', icon: 'user', category: 'task', description: '人工处理', defaultProps: {}, ports: { inputs: [{ id: 'in', name: '输入', position: 'top' }], outputs: [{ id: 'out', name: '输出', position: 'bottom' }] }, configurable: [] },
          { type: 'service_task', name: '服务任务', icon: 'cog', category: 'task', description: '自动服务', defaultProps: {}, ports: { inputs: [{ id: 'in', name: '输入', position: 'top' }], outputs: [{ id: 'out', name: '输出', position: 'bottom' }] }, configurable: [] },
          { type: 'exclusive_gateway', name: '排他网关', icon: 'git-branch', category: 'gateway', description: '条件分支', defaultProps: {}, ports: { inputs: [{ id: 'in', name: '输入', position: 'top' }], outputs: [{ id: 'out1', name: '条件1', position: 'bottom' }, { id: 'out2', name: '条件2', position: 'right' }] }, configurable: [] },
        ] as NodeTemplate[],
      });
    }
  },

  setTemplates: (templates) => set({ templates }),

  createDraft: async (name, description) => {
    set({ loading: true, error: null });
    try {
      const design = await api.createDraft({ name, description, addDefaultNodes: true });
      const nodes = (design as WorkflowDesign).nodes.map(toFlowNode);
      const edges = (design as WorkflowDesign).edges.map(toFlowEdge);
      set({ design: design as WorkflowDesign, designId: design.id, nodes, edges, loading: false });
      return design.id;
    } catch (err: unknown) {
      const error = err as Error;
      set({ loading: false, error: error.message });
      throw err;
    }
  },

  loadDraft: async (id) => {
    set({ loading: true, error: null });
    try {
      const design = await api.getDraft(id);
      const nodes = (design as WorkflowDesign).nodes.map(toFlowNode);
      const edges = (design as WorkflowDesign).edges.map(toFlowEdge);
      set({ design: design as WorkflowDesign, designId: id, nodes, edges, loading: false });
    } catch (err: unknown) {
      const error = err as Error;
      set({ loading: false, error: error.message });
      throw err;
    }
  },

  saveDraft: async () => {
    const { designId } = get();
    if (!designId) return;

    set({ saving: true, error: null });
    try {
      const nodes = get().toDesignerNodes();
      const edges = get().toDesignerEdges();
      const design = await api.updateDraft(designId, { nodes: nodes as api.DesignerNode[], edges: edges as api.DesignerEdge[] });
      set({ design: design as WorkflowDesign, saving: false });
    } catch (err: unknown) {
      const error = err as Error;
      set({ saving: false, error: error.message });
      throw err;
    }
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    const newEdge: Edge = {
      ...connection,
      id: `edge-${Date.now()}`,
      type: 'smoothstep',
      source: connection.source || '',
      target: connection.target || '',
    };
    set({ edges: addEdge(newEdge, get().edges) });
  },

  addNode: (node) => {
    const id = node.id || `${node.type}-${Date.now()}`;
    const flowNode = toFlowNode({ ...node, id } as DesignerNode);
    set({ nodes: [...get().nodes, flowNode] });
  },

  updateNode: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: { ...node.data, label: data.name ?? node.data?.label, ...data.properties },
              position: data.position ? { x: data.position.x, y: data.position.y } : node.position,
            }
          : node
      ),
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  addEdge: (edge) => {
    const id = `edge-${Date.now()}`;
    const flowEdge = toFlowEdge({ ...edge, id });
    set({ edges: [...get().edges, flowEdge] });
  },

  updateEdge: (edgeId, data) => {
    set({
      edges: get().edges.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              label: data.label ?? edge.label,
              data: {
                ...edge.data,
                condition: data.condition ?? edge.data?.condition,
                priority: data.priority ?? edge.data?.priority,
              },
            }
          : edge
      ),
    });
  },

  deleteEdge: (edgeId) => {
    set({
      edges: get().edges.filter((edge) => edge.id !== edgeId),
      selectedEdgeId: get().selectedEdgeId === edgeId ? null : get().selectedEdgeId,
    });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),

  toDesignerNodes: () => {
    return get().nodes.map((node) => ({
      id: node.id,
      type: node.type || 'default',
      name: (node.data?.label as string) || '',
      position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
      properties: Object.fromEntries(
        Object.entries(node.data || {}).filter(([k]) => k !== 'label')
      ),
    })) as DesignerNode[];
  },

  toDesignerEdges: () => {
    return get().edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourcePort: edge.sourceHandle ?? undefined,
      targetPort: edge.targetHandle ?? undefined,
      label: (edge.label as string) || undefined,
      condition: edge.data?.condition as DesignerEdge['condition'],
      priority: edge.data?.priority as number | undefined,
    })) as DesignerEdge[];
  },

  validate: async () => {
    const { designId } = get();
    if (!designId) throw new Error('No design loaded');
    return api.validateDesign(designId);
  },

  publish: async () => {
    const { designId } = get();
    if (!designId) throw new Error('No design loaded');
    const result = await api.publishDesign(designId);
    return result.id;
  },

  reset: () => {
    set({
      design: null,
      designId: null,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      error: null,
    });
  },
}));
