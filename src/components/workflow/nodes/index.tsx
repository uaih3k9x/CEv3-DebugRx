import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
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
import classNames from 'classnames';

// 基础节点组件
interface BaseNodeProps extends NodeProps {
  icon: React.ReactNode;
  className?: string;
  showInputHandle?: boolean;
  showOutputHandle?: boolean;
}

const BaseNode = memo(
  ({
    data,
    selected,
    icon,
    className,
    showInputHandle = true,
    showOutputHandle = true,
  }: BaseNodeProps) => {
    return (
      <div
        className={classNames(
          'px-4 py-2 rounded-lg shadow-md min-w-[120px] text-center',
          className,
          { 'ring-2 ring-blue-500': selected }
        )}
      >
        {showInputHandle && (
          <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 bg-gray-400 border-2 border-white"
          />
        )}
        <div className="flex items-center justify-center gap-2">
          {icon}
          <span className="font-medium">{String(data.label || '')}</span>
        </div>
        {showOutputHandle && (
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 bg-gray-400 border-2 border-white"
          />
        )}
      </div>
    );
  }
);

// 开始节点
export const StartNode = memo((props: NodeProps) => (
  <BaseNode
    {...props}
    icon={<Play size={16} />}
    className="bg-gradient-to-br from-green-500 to-green-600 text-white"
    showInputHandle={false}
  />
));

// 结束节点
export const EndNode = memo((props: NodeProps) => (
  <BaseNode
    {...props}
    icon={<Square size={16} />}
    className="bg-gradient-to-br from-red-500 to-red-600 text-white"
    showOutputHandle={false}
  />
));

// 用户任务节点
export const UserTaskNode = memo((props: NodeProps) => (
  <BaseNode
    {...props}
    icon={<User size={16} />}
    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white"
  />
));

// 服务任务节点
export const ServiceTaskNode = memo((props: NodeProps) => (
  <BaseNode
    {...props}
    icon={<Cog size={16} />}
    className="bg-gradient-to-br from-purple-500 to-purple-600 text-white"
  />
));

// 脚本任务节点
export const ScriptTaskNode = memo((props: NodeProps) => (
  <BaseNode
    {...props}
    icon={<Code size={16} />}
    className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
  />
));

// 网关基础组件
const GatewayNode = memo(
  ({ selected, icon, className }: NodeProps & { icon: React.ReactNode; className?: string }) => {
    return (
      <div
        className={classNames(
          'w-12 h-12 flex items-center justify-center shadow-md',
          className,
          { 'ring-2 ring-blue-500': selected }
        )}
        style={{ transform: 'rotate(45deg)' }}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
          style={{ transform: 'rotate(-45deg)' }}
        />
        <div style={{ transform: 'rotate(-45deg)' }}>{icon}</div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
          style={{ transform: 'rotate(-45deg)' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="w-3 h-3 bg-gray-400 border-2 border-white"
          style={{ transform: 'rotate(-45deg)' }}
        />
      </div>
    );
  }
);

// 排他网关
export const ExclusiveGatewayNode = memo((props: NodeProps) => (
  <GatewayNode
    {...props}
    icon={<GitBranch size={16} className="text-white" />}
    className="bg-gradient-to-br from-amber-500 to-amber-600"
  />
));

// 并行网关
export const ParallelGatewayNode = memo((props: NodeProps) => (
  <GatewayNode
    {...props}
    icon={<GitMerge size={16} className="text-white" />}
    className="bg-gradient-to-br from-cyan-500 to-cyan-600"
  />
));

// 包含网关
export const InclusiveGatewayNode = memo((props: NodeProps) => (
  <GatewayNode
    {...props}
    icon={<GitBranch size={16} className="text-white" />}
    className="bg-gradient-to-br from-teal-500 to-teal-600"
  />
));

// 子流程节点
export const SubProcessNode = memo((props: NodeProps) => (
  <BaseNode
    {...props}
    icon={<Layers size={16} />}
    className="bg-gradient-to-br from-slate-500 to-slate-600 text-white min-w-[150px]"
  />
));

// 导出节点类型映射
export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  user_task: UserTaskNode,
  service_task: ServiceTaskNode,
  script_task: ScriptTaskNode,
  exclusive_gateway: ExclusiveGatewayNode,
  parallel_gateway: ParallelGatewayNode,
  inclusive_gateway: InclusiveGatewayNode,
  sub_process: SubProcessNode,
};
