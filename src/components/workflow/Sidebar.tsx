import { useEffect } from 'react';
import {
  Play,
  Square,
  User,
  Cog,
  Code,
  GitBranch,
  GitMerge,
  Layers,
} from 'lucide-react';
import { useDesignerStore } from '../../stores/designerStore';
import type { NodeTemplate } from '../../types/workflow';

// 默认模板（如果 API 未返回）
const defaultTemplates: NodeTemplate[] = [
  {
    type: 'start',
    name: '开始',
    icon: 'play',
    category: 'control',
    description: '流程开始节点',
    defaultProps: {},
    ports: { inputs: [], outputs: [{ id: 'out', name: '输出', position: 'bottom' }] },
    configurable: [],
  },
  {
    type: 'end',
    name: '结束',
    icon: 'square',
    category: 'control',
    description: '流程结束节点',
    defaultProps: {},
    ports: { inputs: [{ id: 'in', name: '输入', position: 'top' }], outputs: [] },
    configurable: [],
  },
  {
    type: 'user_task',
    name: '用户任务',
    icon: 'user',
    category: 'task',
    description: '需要人工处理的任务',
    defaultProps: { assignee: '', form: '' },
    ports: {
      inputs: [{ id: 'in', name: '输入', position: 'top' }],
      outputs: [{ id: 'out', name: '输出', position: 'bottom' }],
    },
    configurable: [
      { key: 'assignee', label: '处理人', type: 'assignee', required: true },
      { key: 'form', label: '表单', type: 'text', required: false },
    ],
  },
  {
    type: 'service_task',
    name: '服务任务',
    icon: 'cog',
    category: 'task',
    description: '自动执行的服务调用',
    defaultProps: { service: '', method: '' },
    ports: {
      inputs: [{ id: 'in', name: '输入', position: 'top' }],
      outputs: [{ id: 'out', name: '输出', position: 'bottom' }],
    },
    configurable: [
      { key: 'service', label: '服务名', type: 'text', required: true },
      { key: 'method', label: '方法', type: 'text', required: true },
    ],
  },
  {
    type: 'script_task',
    name: '脚本任务',
    icon: 'code',
    category: 'task',
    description: '执行脚本代码',
    defaultProps: { script: '', language: 'javascript' },
    ports: {
      inputs: [{ id: 'in', name: '输入', position: 'top' }],
      outputs: [{ id: 'out', name: '输出', position: 'bottom' }],
    },
    configurable: [
      { key: 'language', label: '语言', type: 'select', required: true, options: [
        { label: 'JavaScript', value: 'javascript' },
        { label: 'Python', value: 'python' },
      ]},
      { key: 'script', label: '脚本', type: 'code', required: true },
    ],
  },
  {
    type: 'exclusive_gateway',
    name: '排他网关',
    icon: 'git-branch',
    category: 'gateway',
    description: '条件分支，只走一条路径',
    defaultProps: {},
    ports: {
      inputs: [{ id: 'in', name: '输入', position: 'top' }],
      outputs: [
        { id: 'out1', name: '条件1', type: 'conditional', position: 'bottom' },
        { id: 'out2', name: '条件2', type: 'conditional', position: 'right' },
      ],
    },
    configurable: [],
  },
  {
    type: 'parallel_gateway',
    name: '并行网关',
    icon: 'git-merge',
    category: 'gateway',
    description: '并行执行多条路径',
    defaultProps: {},
    ports: {
      inputs: [{ id: 'in', name: '输入', position: 'top' }],
      outputs: [
        { id: 'out1', name: '分支1', position: 'bottom' },
        { id: 'out2', name: '分支2', position: 'right' },
      ],
    },
    configurable: [],
  },
  {
    type: 'sub_process',
    name: '子流程',
    icon: 'layers',
    category: 'control',
    description: '嵌套的子工作流',
    defaultProps: { subProcessId: '' },
    ports: {
      inputs: [{ id: 'in', name: '输入', position: 'top' }],
      outputs: [{ id: 'out', name: '输出', position: 'bottom' }],
    },
    configurable: [
      { key: 'subProcessId', label: '子流程ID', type: 'text', required: true },
    ],
  },
];

const iconMap: Record<string, React.ReactNode> = {
  play: <Play size={18} />,
  square: <Square size={18} />,
  user: <User size={18} />,
  cog: <Cog size={18} />,
  code: <Code size={18} />,
  'git-branch': <GitBranch size={18} />,
  'git-merge': <GitMerge size={18} />,
  layers: <Layers size={18} />,
};

const categoryLabels: Record<string, string> = {
  control: '控制节点',
  task: '任务节点',
  gateway: '网关节点',
};

export default function Sidebar() {
  const { templates, setTemplates } = useDesignerStore();

  useEffect(() => {
    // 加载模板
    fetch('/api/v1/designer/templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.items?.length > 0) {
          setTemplates(data.data.items);
        } else {
          setTemplates(defaultTemplates);
        }
      })
      .catch(() => {
        setTemplates(defaultTemplates);
      });
  }, [setTemplates]);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // 按类别分组
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, NodeTemplate[]>);

  return (
    <div className="sidebar w-64 p-4 overflow-y-auto bg-white border-r border-gray-200">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">节点库</h2>

      {Object.entries(groupedTemplates).map(([category, items]) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {categoryLabels[category] || category}
          </h3>
          <div className="space-y-2">
            {items.map((template) => (
              <div
                key={template.type}
                className="sidebar-item flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white cursor-grab hover:shadow-md transition-shadow"
                draggable
                onDragStart={(e) => onDragStart(e, template.type)}
              >
                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-600">
                  {iconMap[template.icon] || <Cog size={18} />}
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-800">
                    {template.name}
                  </div>
                  <div className="text-xs text-gray-500">{template.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
