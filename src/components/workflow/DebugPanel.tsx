import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  StepForward,
  Square,
  X,
  Circle,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useDebugStore, createDebugSession, getTimeline } from '../../stores/debugStore';
import type { ExecutionStep } from '../../types/workflow';

interface DebugPanelProps {
  onClose: () => void;
}

export default function DebugPanel({ onClose }: DebugPanelProps) {
  const {
    session,
    setSession,
    connect,
    step,
    continue: continueExec,
    pause,
    stop,
    highlightedNodeId,
  } = useDebugStore();

  const [instanceId, setInstanceId] = useState('');
  const [timeline, setTimeline] = useState<ExecutionStep[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'variables' | 'breakpoints'>('timeline');

  // 加载时间线
  useEffect(() => {
    if (session) {
      getTimeline(session.id).then(steps => setTimeline(steps as ExecutionStep[])).catch(console.error);
    }
  }, [session]);

  // 创建调试会话
  const handleCreateSession = async () => {
    if (!instanceId) {
      alert('请输入工作流实例ID');
      return;
    }
    try {
      const newSession = await createDebugSession(instanceId, 'step');
      // Cast to DebugSession type from workflow types
      setSession(newSession as unknown as import('../../types/workflow').DebugSession);
      connect(newSession.id);
    } catch (error) {
      alert('创建调试会话失败');
    }
  };

  // 停止调试
  const handleStop = async () => {
    await stop();
    setTimeline([]);
  };

  // 状态图标
  const StatusIcon = () => {
    if (!session) return null;
    switch (session.status) {
      case 'running':
        return <Circle size={12} className="text-green-500 animate-pulse" />;
      case 'paused':
        return <Pause size={12} className="text-yellow-500" />;
      case 'completed':
        return <CheckCircle size={12} className="text-blue-500" />;
      case 'error':
        return <AlertCircle size={12} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="debug-panel h-full flex flex-col bg-slate-800 text-white">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-600">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">调试面板</h3>
          {session && (
            <div className="flex items-center gap-2 text-sm">
              <StatusIcon />
              <span className="text-slate-400">
                {session.status === 'running' && '运行中'}
                {session.status === 'paused' && '已暂停'}
                {session.status === 'completed' && '已完成'}
                {session.status === 'error' && '错误'}
              </span>
            </div>
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
          <X size={18} />
        </button>
      </div>

      {/* 控制栏 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-600">
        {!session ? (
          <>
            <input
              type="text"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="输入工作流实例ID"
              className="flex-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm"
            />
            <button
              onClick={handleCreateSession}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 rounded text-sm hover:bg-green-700"
            >
              <Play size={14} />
              开始调试
            </button>
          </>
        ) : (
          <>
            <button
              onClick={step}
              disabled={session.status !== 'paused'}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <StepForward size={14} />
              单步
            </button>
            <button
              onClick={continueExec}
              disabled={session.status !== 'paused'}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              <Play size={14} />
              继续
            </button>
            <button
              onClick={pause}
              disabled={session.status !== 'running'}
              className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
            >
              <Pause size={14} />
              暂停
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 rounded text-sm hover:bg-red-700"
            >
              <Square size={14} />
              停止
            </button>

            <div className="flex-1" />

            <span className="text-sm text-slate-400">
              当前节点: {highlightedNodeId || '-'}
            </span>
          </>
        )}
      </div>

      {/* 标签页 */}
      {session && (
        <>
          <div className="flex border-b border-slate-600">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 text-sm ${
                activeTab === 'timeline'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              执行时间线
            </button>
            <button
              onClick={() => setActiveTab('variables')}
              className={`px-4 py-2 text-sm ${
                activeTab === 'variables'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              变量
            </button>
            <button
              onClick={() => setActiveTab('breakpoints')}
              className={`px-4 py-2 text-sm ${
                activeTab === 'breakpoints'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              断点
            </button>
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'timeline' && (
              <div className="space-y-2">
                {timeline.length === 0 ? (
                  <p className="text-slate-400 text-sm">暂无执行记录</p>
                ) : (
                  timeline.map((step, index) => (
                    <div
                      key={step.id}
                      className={`debug-timeline-item py-2 px-3 rounded ${
                        step.nodeId === highlightedNodeId ? 'bg-blue-900/50' : 'bg-slate-700/50'
                      } ${step.error ? 'border-l-2 border-red-500' : 'border-l-2 border-green-500'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">#{index + 1}</span>
                        <span className="font-medium">{step.nodeName}</span>
                        <span className="text-xs text-slate-400">({step.nodeType})</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            step.action === 'enter'
                              ? 'bg-blue-900 text-blue-300'
                              : 'bg-green-900 text-green-300'
                          }`}
                        >
                          {step.action === 'enter' ? '进入' : '退出'}
                        </span>
                        {step.durationMs !== undefined && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock size={10} />
                            {step.durationMs}ms
                          </span>
                        )}
                      </div>
                      {step.error && (
                        <div className="mt-1 text-xs text-red-400">
                          错误: {JSON.stringify(step.error)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'variables' && (
              <div className="space-y-2">
                {Object.entries(session.variables || {}).length === 0 ? (
                  <p className="text-slate-400 text-sm">暂无变量</p>
                ) : (
                  Object.entries(session.variables || {}).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2 border-b border-slate-700"
                    >
                      <span className="font-mono text-sm">{key}</span>
                      <span className="text-sm text-slate-400 font-mono">
                        {JSON.stringify(value)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'breakpoints' && (
              <div className="space-y-2">
                {Object.entries(session.breakpoints || {}).length === 0 ? (
                  <p className="text-slate-400 text-sm">暂无断点</p>
                ) : (
                  Object.entries(session.breakpoints || {}).map(([nodeId, bp]) => (
                    <div
                      key={nodeId}
                      className="flex items-center justify-between py-2 border-b border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <Circle
                          size={12}
                          className={bp.enabled ? 'text-red-500' : 'text-slate-500'}
                          fill={bp.enabled ? 'currentColor' : 'none'}
                        />
                        <span className="font-mono text-sm">{nodeId}</span>
                      </div>
                      {bp.condition && (
                        <span className="text-xs text-slate-400">{bp.condition}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
