import { useState } from 'react';
import {
  Save,
  Upload,
  Download,
  Play,
  CheckCircle,
  Bug,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useDesignerStore } from '../../stores/designerStore';

interface ToolbarProps {
  onToggleDebug: () => void;
}

export default function Toolbar({ onToggleDebug }: ToolbarProps) {
  const { design, toDesignerNodes, toDesignerEdges } = useDesignerStore();
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

  // 保存设计
  const handleSave = async () => {
    if (!design) return;
    setSaving(true);
    try {
      const nodes = toDesignerNodes();
      const edges = toDesignerEdges();
      await fetch(`/api/v1/designer/drafts/${design.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });
      alert('保存成功');
    } catch (error) {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 验证设计
  const handleValidate = async () => {
    if (!design) return;
    setValidating(true);
    try {
      const response = await fetch(`/api/v1/designer/drafts/${design.id}/validate`, {
        method: 'POST',
      });
      const result = await response.json();
      if (result.data?.valid) {
        alert('验证通过');
      } else {
        const errors = result.data?.errors?.map((e: { message: string }) => e.message).join('\n');
        alert(`验证失败:\n${errors}`);
      }
    } catch (error) {
      alert('验证请求失败');
    } finally {
      setValidating(false);
    }
  };

  // 发布设计
  const handlePublish = async () => {
    if (!design) return;
    if (!confirm('确定要发布此工作流吗？')) return;

    try {
      const response = await fetch(`/api/v1/designer/drafts/${design.id}/publish`, {
        method: 'POST',
      });
      const result = await response.json();
      if (result.data?.id) {
        alert(`发布成功！工作流ID: ${result.data.id}`);
      } else {
        alert('发布失败');
      }
    } catch (error) {
      alert('发布请求失败');
    }
  };

  // 导出设计
  const handleExport = async () => {
    if (!design) return;
    try {
      const response = await fetch(`/api/v1/designer/drafts/${design.id}/export`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${design.name || 'workflow'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('导出失败');
    }
  };

  // 导入设计
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const response = await fetch('/api/v1/designer/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: event.target?.result as string,
          });
          const result = await response.json();
          if (result.data?.id) {
            alert(`导入成功！设计ID: ${result.data.id}`);
            // TODO: 加载导入的设计
          }
        } catch (error) {
          alert('导入失败');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="toolbar h-12 px-4 flex items-center justify-between bg-white border-b border-gray-200">
      {/* 左侧：文件操作 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? '保存中...' : '保存'}
        </button>

        <button
          onClick={handleImport}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
        >
          <Upload size={16} />
          导入
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
        >
          <Download size={16} />
          导出
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button
          onClick={handleValidate}
          disabled={validating}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
        >
          <CheckCircle size={16} />
          {validating ? '验证中...' : '验证'}
        </button>

        <button
          onClick={handlePublish}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
        >
          <Play size={16} />
          发布
        </button>
      </div>

      {/* 中间：撤销/重做 */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded hover:bg-gray-100"
          title="撤销"
          disabled
        >
          <Undo size={18} className="text-gray-400" />
        </button>
        <button
          className="p-2 rounded hover:bg-gray-100"
          title="重做"
          disabled
        >
          <Redo size={18} className="text-gray-400" />
        </button>
      </div>

      {/* 右侧：视图控制 + 调试 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => zoomIn()}
          className="p-2 rounded hover:bg-gray-100"
          title="放大"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={() => zoomOut()}
          className="p-2 rounded hover:bg-gray-100"
          title="缩小"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={() => fitView()}
          className="p-2 rounded hover:bg-gray-100"
          title="适应视图"
        >
          <Maximize size={18} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button
          onClick={onToggleDebug}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-800"
        >
          <Bug size={16} />
          调试
        </button>
      </div>
    </div>
  );
}
