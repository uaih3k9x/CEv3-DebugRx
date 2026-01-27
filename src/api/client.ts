import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { DecisionTree, CaseWithDebugInfo } from '../types/workflow';

// API 响应格式
interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  error?: string;
}

// 创建 axios 实例
const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  withCredentials: true,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      document.cookie = `access_token=${token}; path=/`;
    }

    const asUser = localStorage.getItem('as_user');
    if (asUser) {
      config.headers['X-As-User'] = asUser;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response;
    if (data.code !== 0) {
      return Promise.reject(new Error(data.message || data.error || 'Unknown error'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized');
    }
    return Promise.reject(error);
  }
);

// ========== 设计器 API ==========

export interface NodeTemplate {
  type: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  defaultProps: Record<string, unknown>;
  ports: {
    inputs: Array<{ id: string; name: string; position: string }>;
    outputs: Array<{ id: string; name: string; position: string }>;
  };
  configurable: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
  }>;
}

export interface WorkflowDesign {
  id: string;
  name: string;
  description: string;
  version: string;
  status: string;
  nodes: DesignerNode[];
  edges: DesignerEdge[];
  variables: Record<string, unknown>;
  metadata?: {
    author?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface DesignerNode {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  properties: Record<string, unknown>;
}

export interface DesignerEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
  label?: string;
  condition?: {
    type: string;
    expression: string;
  };
  priority?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ code: string; message: string; nodeId?: string }>;
  warnings: Array<{ code: string; message: string; nodeId?: string }>;
}

// 获取节点模板
export async function getTemplates(): Promise<NodeTemplate[]> {
  const res = await api.get<ApiResponse<{ items: NodeTemplate[] }>>('/designer/templates');
  return res.data.data.items || [];
}

// 创建草稿
export async function createDraft(data: {
  name: string;
  description?: string;
  addDefaultNodes?: boolean;
}): Promise<WorkflowDesign> {
  const res = await api.post<ApiResponse<WorkflowDesign>>('/designer/drafts', {
    name: data.name,
    description: data.description || '',
    add_default_nodes: data.addDefaultNodes ?? true,
  });
  return res.data.data;
}

// 获取草稿列表
export async function listDrafts(): Promise<WorkflowDesign[]> {
  const res = await api.get<ApiResponse<{ items: WorkflowDesign[] }>>('/designer/drafts');
  return res.data.data.items || [];
}

// 获取草稿详情
export async function getDraft(id: string): Promise<WorkflowDesign> {
  const res = await api.get<ApiResponse<WorkflowDesign>>(`/designer/drafts/${id}`);
  return res.data.data;
}

// 更新草稿
export async function updateDraft(
  id: string,
  data: {
    name?: string;
    description?: string;
    nodes?: DesignerNode[];
    edges?: DesignerEdge[];
  }
): Promise<WorkflowDesign> {
  const res = await api.put<ApiResponse<WorkflowDesign>>(`/designer/drafts/${id}`, data);
  return res.data.data;
}

// 删除草稿
export async function deleteDraft(id: string): Promise<void> {
  await api.delete(`/designer/drafts/${id}`);
}

// 添加节点
export async function addNode(
  draftId: string,
  node: {
    type: string;
    name?: string;
    position: { x: number; y: number };
    properties?: Record<string, unknown>;
  }
): Promise<DesignerNode> {
  const res = await api.post<ApiResponse<DesignerNode>>(
    `/designer/drafts/${draftId}/nodes`,
    node
  );
  return res.data.data;
}

// 更新节点
export async function updateNode(
  draftId: string,
  nodeId: string,
  data: {
    name?: string;
    position?: { x: number; y: number };
    properties?: Record<string, unknown>;
  }
): Promise<DesignerNode> {
  const res = await api.put<ApiResponse<DesignerNode>>(
    `/designer/drafts/${draftId}/nodes/${nodeId}`,
    data
  );
  return res.data.data;
}

// 删除节点
export async function deleteNode(draftId: string, nodeId: string): Promise<void> {
  await api.delete(`/designer/drafts/${draftId}/nodes/${nodeId}`);
}

// 添加连线
export async function addEdge(
  draftId: string,
  edge: {
    source: string;
    target: string;
    label?: string;
    condition?: { type: string; expression: string };
  }
): Promise<DesignerEdge> {
  const res = await api.post<ApiResponse<DesignerEdge>>(
    `/designer/drafts/${draftId}/edges`,
    edge
  );
  return res.data.data;
}

// 更新连线
export async function updateEdge(
  draftId: string,
  edgeId: string,
  data: {
    label?: string;
    condition?: { type: string; expression: string };
  }
): Promise<DesignerEdge> {
  const res = await api.put<ApiResponse<DesignerEdge>>(
    `/designer/drafts/${draftId}/edges/${edgeId}`,
    data
  );
  return res.data.data;
}

// 删除连线
export async function deleteEdge(draftId: string, edgeId: string): Promise<void> {
  await api.delete(`/designer/drafts/${draftId}/edges/${edgeId}`);
}

// 验证设计
export async function validateDesign(draftId: string): Promise<ValidationResult> {
  const res = await api.post<ApiResponse<ValidationResult>>(
    `/designer/drafts/${draftId}/validate`
  );
  return res.data.data;
}

// 发布设计
export async function publishDesign(draftId: string): Promise<{ id: string }> {
  const res = await api.post<ApiResponse<{ id: string }>>(
    `/designer/drafts/${draftId}/publish`
  );
  return res.data.data;
}

// 导出设计
export async function exportDesign(draftId: string): Promise<Blob> {
  const res = await api.get(`/designer/drafts/${draftId}/export`, {
    responseType: 'blob',
  });
  return res.data;
}

// 导入设计
export async function importDesign(data: string | object): Promise<WorkflowDesign> {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  const res = await api.post<ApiResponse<WorkflowDesign>>('/designer/import', body, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data.data;
}

// ========== 工作流实例 API ==========

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  status: string;
  startTime: string;
  endTime?: string;
  variables: Record<string, unknown>;
}

// 启动工作流实例
export async function startInstance(
  definitionId: string,
  variables?: Record<string, unknown>
): Promise<WorkflowInstance> {
  const res = await api.post<ApiResponse<WorkflowInstance>>('/instances', {
    definition_id: definitionId,
    variables: variables || {},
  });
  return res.data.data;
}

// 获取实例详情
export async function getInstance(id: string): Promise<WorkflowInstance> {
  const res = await api.get<ApiResponse<WorkflowInstance>>(`/instances/${id}`);
  return res.data.data;
}

// ========== 调试 API ==========

export interface DebugSession {
  id: string;
  instanceId: string;
  definitionId: string;
  mode: 'step' | 'breakpoint' | 'continuous';
  status: 'paused' | 'running' | 'completed' | 'error';
  currentToken?: {
    id: string;
    currentNodeId: string;
    status: string;
    data: Record<string, unknown>;
  };
  variables: Record<string, unknown>;
  breakpoints: Record<string, { nodeId: string; enabled: boolean }>;
  timeline: ExecutionStep[];
}

export interface ExecutionStep {
  id: number;
  stepIndex: number;
  timestamp: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  action: 'enter' | 'exit';
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  durationMs?: number;
  error?: Record<string, unknown>;
}

export interface StepResult {
  session: DebugSession;
  step?: ExecutionStep;
  completed: boolean;
}

// 创建调试会话
export async function createDebugSession(
  instanceId: string,
  mode: 'step' | 'breakpoint' | 'continuous' = 'step'
): Promise<DebugSession> {
  const res = await api.post<ApiResponse<DebugSession>>('/debug/sessions', {
    instance_id: instanceId,
    mode,
  });
  return res.data.data;
}

// 获取调试会话
export async function getDebugSession(sessionId: string): Promise<DebugSession> {
  const res = await api.get<ApiResponse<DebugSession>>(`/debug/sessions/${sessionId}`);
  return res.data.data;
}

// 列出调试会话
export async function listDebugSessions(): Promise<DebugSession[]> {
  const res = await api.get<ApiResponse<{ items: DebugSession[] }>>('/debug/sessions');
  return res.data.data.items || [];
}

// 单步执行
export async function debugStep(sessionId: string): Promise<StepResult> {
  const res = await api.post<ApiResponse<StepResult>>(`/debug/sessions/${sessionId}/step`);
  return res.data.data;
}

// 继续执行
export async function debugContinue(sessionId: string): Promise<void> {
  await api.post(`/debug/sessions/${sessionId}/continue`);
}

// 暂停执行
export async function debugPause(sessionId: string): Promise<void> {
  await api.post(`/debug/sessions/${sessionId}/pause`);
}

// 停止调试
export async function debugStop(sessionId: string): Promise<void> {
  await api.post(`/debug/sessions/${sessionId}/stop`);
}

// 添加断点
export async function addBreakpoint(
  sessionId: string,
  nodeId: string,
  condition?: string
): Promise<void> {
  await api.post(`/debug/sessions/${sessionId}/breakpoints`, {
    node_id: nodeId,
    condition,
  });
}

// 移除断点
export async function removeBreakpoint(sessionId: string, nodeId: string): Promise<void> {
  await api.delete(`/debug/sessions/${sessionId}/breakpoints/${nodeId}`);
}

// 获取变量
export async function getVariables(sessionId: string): Promise<Record<string, unknown>> {
  const res = await api.get<ApiResponse<Record<string, unknown>>>(
    `/debug/sessions/${sessionId}/variables`
  );
  return res.data.data;
}

// 设置变量
export async function setVariable(
  sessionId: string,
  key: string,
  value: unknown
): Promise<void> {
  await api.put(`/debug/sessions/${sessionId}/variables`, { key, value });
}

// 获取时间线
export async function getTimeline(sessionId: string): Promise<ExecutionStep[]> {
  const res = await api.get<ApiResponse<{ items: ExecutionStep[] }>>(
    `/debug/sessions/${sessionId}/timeline`
  );
  return res.data.data.items || [];
}

// ========== 案件 API (CE) ==========

// 案件基本信息
export interface CaseInfo {
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
}

// 获取案件详情
export async function getCaseDetail(caseId: string): Promise<CaseInfo> {
  const res = await api.get<ApiResponse<CaseInfo>>(`/ce/case/${caseId}`);
  return res.data.data;
}

// 获取案件详情（带调试信息）
// 仅管理员可用，返回工作流决策树
export async function getCaseWithDebug(caseId: string): Promise<CaseWithDebugInfo> {
  const res = await api.get<ApiResponse<CaseWithDebugInfo>>(
    `/ce/case/${caseId}`,
    { params: { debug: true } }
  );
  return res.data.data;
}

// 获取案件的决策树（独立接口）
export async function getCaseDecisionTree(caseId: string): Promise<DecisionTree | null> {
  try {
    const caseWithDebug = await getCaseWithDebug(caseId);
    return caseWithDebug.decisionTree || null;
  } catch {
    return null;
  }
}

// ========== 诊断 API ==========

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  checkedAt: string;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number; // ms
  message?: string;
  lastCheck: string;
}

export interface DiagnosticResult {
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  issues: DiagnosticIssue[];
  checkedAt: string;
}

export interface DiagnosticIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  suggestion: string;
  details?: Record<string, unknown>;
}

export interface ServiceStatus {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  uptime: number; // seconds
  metrics: {
    cpu: number; // percentage
    memory: number; // percentage
    requests: number; // total
    errors: number; // total
    errorRate: number; // percentage
  };
  recentErrors: ErrorLog[];
}

export interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn';
  message: string;
  stack?: string;
}

export interface ConfigCheckResult {
  valid: boolean;
  items: ConfigItem[];
  checkedAt: string;
}

export interface ConfigItem {
  key: string;
  value: string;
  status: 'ok' | 'warning' | 'error';
  message?: string;
  category: string;
}

// Mock 数据生成函数（后端 API 未实现时使用）
function generateMockHealthStatus(): HealthStatus {
  const services: ServiceHealth[] = [
    { name: 'API Server', status: 'healthy', responseTime: 45, lastCheck: new Date().toISOString() },
    { name: 'PostgreSQL', status: 'healthy', responseTime: 12, lastCheck: new Date().toISOString() },
    { name: 'Redis', status: 'healthy', responseTime: 3, lastCheck: new Date().toISOString() },
    { name: 'MinIO', status: 'degraded', responseTime: 230, message: '响应时间较慢', lastCheck: new Date().toISOString() },
    { name: 'Kafka', status: 'healthy', responseTime: 28, lastCheck: new Date().toISOString() },
  ];
  const overall = services.some(s => s.status === 'unhealthy') ? 'unhealthy'
    : services.some(s => s.status === 'degraded') ? 'degraded' : 'healthy';
  return { overall, services, checkedAt: new Date().toISOString() };
}

function generateMockDiagnosticResult(): DiagnosticResult {
  const issues: DiagnosticIssue[] = [
    {
      id: '1',
      severity: 'warning',
      category: '数据一致性',
      title: '发现孤立的任务记录',
      description: '有 3 条任务记录没有关联的工作流实例',
      suggestion: '建议运行数据清理脚本或手动关联工作流实例',
      details: { taskIds: ['task-001', 'task-002', 'task-003'] },
    },
    {
      id: '2',
      severity: 'info',
      category: '索引优化',
      title: '建议添加索引',
      description: 'workflow_instances 表的 status 字段缺少索引，可能影响查询性能',
      suggestion: '在 status 字段上创建索引以提升查询效率',
    },
    {
      id: '3',
      severity: 'critical',
      category: '数据完整性',
      title: '外键约束违反',
      description: '2 条评审记录引用了不存在的用户 ID',
      suggestion: '需要修复数据或更新外键关联',
      details: { affectedRecords: ['review-101', 'review-102'] },
    },
  ];
  return {
    summary: { total: issues.length, critical: 1, warning: 1, info: 1 },
    issues,
    checkedAt: new Date().toISOString(),
  };
}

function generateMockServiceStatus(): ServiceStatus[] {
  return [
    {
      id: 'api-1',
      name: 'CE API Server',
      status: 'running',
      uptime: 86400 * 3 + 3600 * 5,
      metrics: { cpu: 23.5, memory: 45.2, requests: 125000, errors: 42, errorRate: 0.034 },
      recentErrors: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), level: 'error', message: 'Connection timeout to database' },
        { timestamp: new Date(Date.now() - 7200000).toISOString(), level: 'warn', message: 'Slow query detected (>1000ms)' },
      ],
    },
    {
      id: 'worker-1',
      name: 'Workflow Worker',
      status: 'running',
      uptime: 86400 * 2 + 3600 * 12,
      metrics: { cpu: 15.8, memory: 32.1, requests: 45000, errors: 5, errorRate: 0.011 },
      recentErrors: [],
    },
    {
      id: 'scheduler-1',
      name: 'Task Scheduler',
      status: 'running',
      uptime: 86400 * 3 + 3600 * 5,
      metrics: { cpu: 8.2, memory: 18.5, requests: 8500, errors: 0, errorRate: 0 },
      recentErrors: [],
    },
  ];
}

function generateMockConfigCheckResult(): ConfigCheckResult {
  const items: ConfigItem[] = [
    { key: 'DATABASE_URL', value: 'postgres://***@localhost:5432/ce', status: 'ok', category: '数据库' },
    { key: 'REDIS_URL', value: 'redis://localhost:6379', status: 'ok', category: '缓存' },
    { key: 'MINIO_ENDPOINT', value: 'localhost:9000', status: 'warning', message: '建议使用 HTTPS', category: '存储' },
    { key: 'JWT_SECRET', value: '********', status: 'ok', category: '安全' },
    { key: 'LOG_LEVEL', value: 'debug', status: 'warning', message: '生产环境建议使用 info 或 warn', category: '日志' },
    { key: 'CORS_ORIGINS', value: '*', status: 'error', message: '生产环境不应使用通配符', category: '安全' },
    { key: 'KAFKA_BROKERS', value: 'localhost:9092', status: 'ok', category: '消息队列' },
  ];
  const valid = !items.some(i => i.status === 'error');
  return { valid, items, checkedAt: new Date().toISOString() };
}

// ========== 带 Mock 标识的响应包装 ==========

export interface WithMockFlag<T> {
  data: T;
  isMock: boolean;
}

// 健康检查
export async function healthCheck(): Promise<WithMockFlag<HealthStatus>> {
  try {
    const res = await api.get<ApiResponse<HealthStatus>>('/health');
    return { data: res.data.data, isMock: false };
  } catch {
    console.warn('[API] healthCheck: using mock data');
    return { data: generateMockHealthStatus(), isMock: true };
  }
}

// 数据诊断
export async function diagnoseData(): Promise<WithMockFlag<DiagnosticResult>> {
  try {
    const res = await api.get<ApiResponse<DiagnosticResult>>('/diagnostic/data');
    return { data: res.data.data, isMock: false };
  } catch {
    console.warn('[API] diagnoseData: using mock data');
    return { data: generateMockDiagnosticResult(), isMock: true };
  }
}

// 服务状态
export async function getServiceStatus(): Promise<WithMockFlag<ServiceStatus[]>> {
  try {
    const res = await api.get<ApiResponse<{ items: ServiceStatus[] }>>('/diagnostic/services');
    return { data: res.data.data.items || [], isMock: false };
  } catch {
    console.warn('[API] getServiceStatus: using mock data');
    return { data: generateMockServiceStatus(), isMock: true };
  }
}

// 配置检查
export async function checkConfig(): Promise<WithMockFlag<ConfigCheckResult>> {
  try {
    const res = await api.get<ApiResponse<ConfigCheckResult>>('/diagnostic/config');
    return { data: res.data.data, isMock: false };
  } catch {
    console.warn('[API] checkConfig: using mock data');
    return { data: generateMockConfigCheckResult(), isMock: true };
  }
}

// ========== 工具函数 ==========

// 设置开发 token
export function setDevToken(token: string): void {
  localStorage.setItem('access_token', token);
  document.cookie = `access_token=${token}; path=/`;
}

// 设置 As-User
export function setAsUser(userId: string | null): void {
  if (userId) {
    localStorage.setItem('as_user', userId);
  } else {
    localStorage.removeItem('as_user');
  }
}

// 清除认证
export function clearAuth(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('as_user');
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

export default api;
