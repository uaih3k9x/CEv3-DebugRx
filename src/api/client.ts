import axios, { AxiosInstance, AxiosResponse } from 'axios';

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
