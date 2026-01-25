import { useDesignerStore } from '../../stores/designerStore';
import { Trash2 } from 'lucide-react';

export default function PropertiesPanel() {
  const { nodes, edges, selectedNodeId, selectedEdgeId, updateNode, updateEdge, deleteNode, deleteEdge } =
    useDesignerStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="properties-panel w-72 p-4 bg-white border-l border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">属性</h2>
        <p className="text-sm text-gray-500">选择一个节点或连线查看属性</p>
      </div>
    );
  }

  if (selectedNode) {
    return (
      <div className="properties-panel w-72 p-4 overflow-y-auto bg-white border-l border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">节点属性</h2>
          <button
            onClick={() => deleteNode(selectedNode.id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded"
            title="删除节点"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* ID */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">ID</label>
            <input
              type="text"
              value={selectedNode.id}
              disabled
              className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500 text-sm"
            />
          </div>

          {/* 类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">类型</label>
            <input
              type="text"
              value={selectedNode.type || ''}
              disabled
              className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500 text-sm"
            />
          </div>

          {/* 名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">名称</label>
            <input
              type="text"
              value={(selectedNode.data?.label as string) || ''}
              onChange={(e) =>
                updateNode(selectedNode.id, { name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 位置 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">X</label>
              <input
                type="number"
                value={Math.round(selectedNode.position.x)}
                onChange={(e) =>
                  updateNode(selectedNode.id, {
                    position: {
                      x: parseInt(e.target.value) || 0,
                      y: selectedNode.position.y,
                    },
                  })
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedNode.position.y)}
                onChange={(e) =>
                  updateNode(selectedNode.id, {
                    position: {
                      x: selectedNode.position.x,
                      y: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          {/* 动态属性 */}
          {selectedNode.data &&
            Object.entries(selectedNode.data)
              .filter(([key]) => key !== 'label')
              .map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">
                    {key}
                  </label>
                  <input
                    type="text"
                    value={String(value || '')}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        properties: {
                          ...selectedNode.data,
                          [key]: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    return (
      <div className="properties-panel w-72 p-4 overflow-y-auto bg-white border-l border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">连线属性</h2>
          <button
            onClick={() => deleteEdge(selectedEdge.id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded"
            title="删除连线"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* ID */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">ID</label>
            <input
              type="text"
              value={selectedEdge.id}
              disabled
              className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500 text-sm"
            />
          </div>

          {/* 源节点 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">源节点</label>
            <input
              type="text"
              value={selectedEdge.source}
              disabled
              className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500 text-sm"
            />
          </div>

          {/* 目标节点 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">目标节点</label>
            <input
              type="text"
              value={selectedEdge.target}
              disabled
              className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500 text-sm"
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">标签</label>
            <input
              type="text"
              value={(selectedEdge.label as string) || ''}
              onChange={(e) => updateEdge(selectedEdge.id, { label: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="连线标签"
            />
          </div>

          {/* 条件表达式 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">条件表达式</label>
            <textarea
              value={(selectedEdge.data?.condition as { expression?: string } | undefined)?.expression || ''}
              onChange={(e) =>
                updateEdge(selectedEdge.id, {
                  condition: {
                    type: 'expression',
                    expression: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="例如: score >= 60"
            />
          </div>

          {/* 优先级 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">优先级</label>
            <input
              type="number"
              value={(selectedEdge.data?.priority as number) || 0}
              onChange={(e) =>
                updateEdge(selectedEdge.id, { priority: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
              min={0}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
