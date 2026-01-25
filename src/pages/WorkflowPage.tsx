import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useDesignerStore } from '../stores/designerStore';
import { useDebugStore } from '../stores/debugStore';
import Sidebar from '../components/workflow/Sidebar';
import PropertiesPanel from '../components/workflow/PropertiesPanel';
import Toolbar from '../components/workflow/Toolbar';
import DebugPanel from '../components/workflow/DebugPanel';
import { nodeTypes } from '../components/workflow/nodes';

function DesignerCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    selectEdge,
    addNode,
    templates,
  } = useDesignerStore();

  const { highlightedNodeId } = useDebugStore();
  const { screenToFlowPosition } = useReactFlow();

  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // 处理拖放
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const template = templates.find((t) => t.type === type);
      if (!template) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type: type as 'start' | 'end' | 'user_task' | 'service_task' | 'script_task' | 'exclusive_gateway' | 'parallel_gateway' | 'inclusive_gateway' | 'sub_process',
        name: template.name,
        position: { x: position.x, y: position.y },
        properties: { ...template.defaultProps },
        ports: template.ports,
      };

      addNode(newNode);
    },
    [screenToFlowPosition, templates, addNode]
  );

  // 处理节点选择
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // 处理边选择
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: { id: string }) => {
      selectEdge(edge.id);
    },
    [selectEdge]
  );

  // 处理画布点击（取消选择）
  const onPaneClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
  }, [selectNode, selectEdge]);

  // 高亮当前调试节点
  const styledNodes = nodes.map((node) => ({
    ...node,
    style: {
      ...node.style,
      boxShadow:
        node.id === highlightedNodeId
          ? '0 0 0 3px #22c55e, 0 0 20px rgba(34, 197, 94, 0.5)'
          : undefined,
    },
  }));

  return (
    <div className="flex h-full">
      {/* 左侧边栏 - 节点模板 */}
      <Sidebar />

      {/* 中间画布区域 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <Toolbar onToggleDebug={() => setShowDebugPanel(!showDebugPanel)} />

        {/* 画布 */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={styledNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: false,
            }}
          >
            <Background gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="bg-white rounded shadow"
            />
            <Panel position="top-right" className="bg-white p-2 rounded shadow text-sm">
              节点: {nodes.length} | 连线: {edges.length}
            </Panel>
          </ReactFlow>

          {/* 调试面板 */}
          {showDebugPanel && (
            <div className="absolute bottom-0 left-0 right-0 h-64">
              <DebugPanel onClose={() => setShowDebugPanel(false)} />
            </div>
          )}
        </div>
      </div>

      {/* 右侧属性面板 */}
      <PropertiesPanel />
    </div>
  );
}

export default function WorkflowPage() {
  return (
    <ReactFlowProvider>
      <div className="h-[calc(100vh-120px)]">
        <DesignerCanvas />
      </div>
    </ReactFlowProvider>
  );
}
