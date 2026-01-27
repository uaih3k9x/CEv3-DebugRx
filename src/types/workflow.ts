// 节点类型
export type NodeType =
  | 'start'
  | 'end'
  | 'user_task'
  | 'service_task'
  | 'script_task'
  | 'exclusive_gateway'
  | 'parallel_gateway'
  | 'inclusive_gateway'
  | 'sub_process';

// 节点位置
export interface Position {
  x: number;
  y: number;
}

// 端口
export interface Port {
  id: string;
  name: string;
  type?: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

// 端口配置
export interface PortConfig {
  inputs: Port[];
  outputs: Port[];
}

// 设计器节点
export interface DesignerNode {
  id: string;
  type: NodeType;
  name: string;
  position: Position;
  properties: Record<string, unknown>;
  ports?: PortConfig;
}

// 条件表达式
export interface ConditionExpr {
  type: 'simple' | 'expression' | 'script';
  expression: string;
  params?: Record<string, unknown>;
}

// 边样式
export interface EdgeStyle {
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  animated?: boolean;
}

// 设计器边
export interface DesignerEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
  label?: string;
  condition?: ConditionExpr;
  priority?: number;
  style?: EdgeStyle;
}

// 变量定义
export interface Variable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: unknown;
  description?: string;
  required: boolean;
}

// 画布配置
export interface CanvasConfig {
  zoom: number;
  panX: number;
  panY: number;
  gridSize: number;
  snapGrid: boolean;
}

// 设计元数据
export interface DesignMetadata {
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  canvasConfig?: CanvasConfig;
}

// 工作流设计
export interface WorkflowDesign {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'draft' | 'published' | 'deprecated';
  nodes: DesignerNode[];
  edges: DesignerEdge[];
  variables: Record<string, Variable>;
  metadata?: DesignMetadata;
}

// 节点模板
export interface NodeTemplate {
  type: NodeType;
  name: string;
  icon: string;
  category: 'control' | 'task' | 'gateway';
  description: string;
  defaultProps: Record<string, unknown>;
  ports: PortConfig;
  configurable: ConfigField[];
}

// 配置字段
export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'json' | 'code' | 'assignee';
  required: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: unknown }[];
  placeholder?: string;
  description?: string;
}

// 验证错误
export interface ValidationError {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  field?: string;
}

// 验证警告
export interface ValidationWarn {
  code: string;
  message: string;
  nodeId?: string;
}

// 验证结果
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarn[];
}

// ========== 调试相关类型 ==========

// 调试模式
export type DebugMode = 'step' | 'breakpoint' | 'continuous';

// 会话状态
export type SessionStatus = 'paused' | 'running' | 'completed' | 'error';

// 断点
export interface Breakpoint {
  nodeId: string;
  condition?: string;
  enabled: boolean;
}

// Token 快照
export interface TokenSnapshot {
  id: string;
  currentNodeId: string;
  currentNode: string;
  status: string;
  data: Record<string, unknown>;
  path: string[];
}

// 执行步骤
export interface ExecutionStep {
  id: number;
  sessionId: string;
  stepIndex: number;
  timestamp: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  tokenId: string;
  action: 'enter' | 'exit';
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  durationMs?: number;
  error?: Record<string, unknown>;
}

// 调试会话
export interface DebugSession {
  id: string;
  instanceId: string;
  definitionId: string;
  mode: DebugMode;
  status: SessionStatus;
  currentToken?: TokenSnapshot;
  variables: Record<string, unknown>;
  breakpoints: Record<string, Breakpoint>;
  timeline: ExecutionStep[];
  createdBy: string;
  createdAt: string;
}

// 调试事件类型
export type DebugEventType =
  | 'node_entered'
  | 'node_exited'
  | 'breakpoint_hit'
  | 'variable_changed'
  | 'session_paused'
  | 'session_resumed'
  | 'session_completed'
  | 'error';

// 调试事件
export interface DebugEvent {
  type: DebugEventType;
  sessionId: string;
  timestamp: string;
  payload: unknown;
}

// ========== 决策树可视化类型 (Phase 6) ==========

// 决策节点状态
export type DecisionNodeStatus =
  | 'pending'    // 未执行
  | 'executed'   // 已执行
  | 'current'    // 当前节点
  | 'skipped'    // 跳过（分支未选中）
  | 'failed'     // 执行失败
  | 'simulated'; // 模拟执行

// 决策树节点
export interface DecisionNode {
  id: string;
  name: string;
  type: string;
  status: DecisionNodeStatus;
  position?: Position;
  executedAt?: string;
  duration?: number;
  decision?: Record<string, unknown>;
  error?: string;
  // As-User 模拟信息
  isSimulated?: boolean;
  asUserId?: number;
  operatorId?: number;
}

// 决策树边
export interface DecisionEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  label?: string;
  wasTaken: boolean;
  takenAt?: string;
}

// 决策树
export interface DecisionTree {
  instanceId: string;
  definitionId: string;
  status: string;
  currentNodeId?: string;
  nodes: DecisionNode[];
  edges: DecisionEdge[];
  variables?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
}

// 决策树统计
export interface DecisionTreeStats {
  totalNodes: number;
  executedNodes: number;
  pendingNodes: number;
  skippedNodes: number;
  failedNodes: number;
  simulatedNodes: number;
  totalEdges: number;
  takenEdges: number;
  completionRate: number;
  totalDurationMs: number;
}

// 带调试信息的案件详情
export interface CaseWithDebugInfo {
  id: string;
  submitterId: string;
  categoryId: string;
  academicYear: string;
  title: string;
  description: string;
  formData?: Record<string, unknown>;
  attachments?: string[];
  stage: string;
  score?: number;
  finalScore?: number;
  isConfirmed: boolean;
  createdAt: number;
  updatedAt: number;
  // 调试信息
  decisionTree?: DecisionTree;
}
