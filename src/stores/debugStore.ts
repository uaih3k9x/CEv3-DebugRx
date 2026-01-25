import { create } from 'zustand';
import * as api from '../api/client';
import type { DebugSession, ExecutionStep } from '../types/workflow';

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

interface DebugState {
  // 当前调试会话
  session: DebugSession | null;

  // WebSocket 连接
  ws: WebSocket | null;

  // 事件历史
  events: DebugEvent[];

  // 高亮的节点（当前执行位置）
  highlightedNodeId: string | null;

  // 加载状态
  loading: boolean;
  error: string | null;

  // 操作
  createSession: (instanceId: string, mode?: 'step' | 'breakpoint' | 'continuous') => Promise<DebugSession>;
  loadSession: (sessionId: string) => Promise<void>;
  setSession: (session: DebugSession | null) => void;
  updateSession: (updates: Partial<DebugSession>) => void;

  // WebSocket
  connect: (sessionId: string) => void;
  disconnect: () => void;

  // 调试控制
  step: () => Promise<api.StepResult | null>;
  continue: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;

  // 断点
  addBreakpoint: (nodeId: string, condition?: string) => Promise<void>;
  removeBreakpoint: (nodeId: string) => Promise<void>;
  toggleBreakpoint: (nodeId: string) => void;

  // 变量
  getVariables: () => Promise<Record<string, unknown>>;
  setVariable: (key: string, value: unknown) => Promise<void>;

  // 时间线
  loadTimeline: () => Promise<ExecutionStep[]>;

  // 事件处理
  handleEvent: (event: DebugEvent) => void;
  clearEvents: () => void;

  // 高亮
  setHighlightedNode: (nodeId: string | null) => void;

  // 重置
  reset: () => void;
}

export const useDebugStore = create<DebugState>((set, get) => ({
  session: null,
  ws: null,
  events: [],
  highlightedNodeId: null,
  loading: false,
  error: null,

  createSession: async (instanceId, mode = 'step') => {
    set({ loading: true, error: null });
    try {
      const session = await api.createDebugSession(instanceId, mode);
      set({ session: session as DebugSession, loading: false });
      return session as DebugSession;
    } catch (err: unknown) {
      const error = err as Error;
      set({ loading: false, error: error.message });
      throw err;
    }
  },

  loadSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const session = await api.getDebugSession(sessionId);
      set({ session: session as DebugSession, loading: false });
      if ((session as DebugSession).currentToken) {
        set({ highlightedNodeId: (session as DebugSession).currentToken!.currentNodeId });
      }
    } catch (err: unknown) {
      const error = err as Error;
      set({ loading: false, error: error.message });
      throw err;
    }
  },

  setSession: (session) => set({ session }),

  updateSession: (updates) => {
    const current = get().session;
    if (current) {
      set({ session: { ...current, ...updates } });
    }
  },

  connect: (sessionId) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/v1/debug/sessions/${sessionId}/events`);

    ws.onmessage = (event) => {
      try {
        const debugEvent: DebugEvent = JSON.parse(event.data);
        get().handleEvent(debugEvent);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      set({ ws: null });
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    set({ ws });
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
      set({ ws: null });
    }
  },

  step: async () => {
    const { session } = get();
    if (!session) return null;

    try {
      const result = await api.debugStep(session.id);
      set({ session: result.session as DebugSession });
      if ((result.session as DebugSession).currentToken) {
        set({ highlightedNodeId: (result.session as DebugSession).currentToken!.currentNodeId });
      }
      return result;
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message });
      throw err;
    }
  },

  continue: async () => {
    const { session } = get();
    if (!session) return;

    try {
      await api.debugContinue(session.id);
      get().updateSession({ status: 'running' });
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message });
      throw err;
    }
  },

  pause: async () => {
    const { session } = get();
    if (!session) return;

    try {
      await api.debugPause(session.id);
      get().updateSession({ status: 'paused' });
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message });
      throw err;
    }
  },

  stop: async () => {
    const { session } = get();
    if (!session) return;

    try {
      await api.debugStop(session.id);
      get().disconnect();
      set({ session: null, highlightedNodeId: null });
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message });
      throw err;
    }
  },

  addBreakpoint: async (nodeId, condition) => {
    const { session } = get();
    if (!session) return;

    try {
      await api.addBreakpoint(session.id, nodeId, condition);
      const breakpoints = { ...session.breakpoints };
      breakpoints[nodeId] = { nodeId, condition, enabled: true };
      get().updateSession({ breakpoints });
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message });
      throw err;
    }
  },

  removeBreakpoint: async (nodeId) => {
    const { session } = get();
    if (!session) return;

    try {
      await api.removeBreakpoint(session.id, nodeId);
      const breakpoints = { ...session.breakpoints };
      delete breakpoints[nodeId];
      get().updateSession({ breakpoints });
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message });
      throw err;
    }
  },

  toggleBreakpoint: (nodeId) => {
    const { session } = get();
    if (!session) return;

    const breakpoints = { ...session.breakpoints };
    if (breakpoints[nodeId]) {
      breakpoints[nodeId] = {
        ...breakpoints[nodeId],
        enabled: !breakpoints[nodeId].enabled,
      };
    }
    get().updateSession({ breakpoints });
  },

  getVariables: async () => {
    const { session } = get();
    if (!session) return {};

    try {
      const variables = await api.getVariables(session.id);
      get().updateSession({ variables });
      return variables;
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message });
      throw err;
    }
  },

  setVariable: async (key, value) => {
    const { session } = get();
    if (!session) return;

    try {
      await api.setVariable(session.id, key, value);
      const variables = { ...session.variables, [key]: value };
      get().updateSession({ variables });
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message });
      throw err;
    }
  },

  loadTimeline: async () => {
    const { session } = get();
    if (!session) return [];

    try {
      const timeline = await api.getTimeline(session.id);
      get().updateSession({ timeline: timeline as ExecutionStep[] });
      return timeline as ExecutionStep[];
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message });
      throw err;
    }
  },

  handleEvent: (event) => {
    set({ events: [...get().events, event] });

    switch (event.type) {
      case 'node_entered': {
        const payload = event.payload as { node_id: string };
        set({ highlightedNodeId: payload.node_id });
        break;
      }
      case 'node_exited': {
        // 可以选择保持高亮或清除
        break;
      }
      case 'session_paused': {
        get().updateSession({ status: 'paused' });
        break;
      }
      case 'session_resumed': {
        get().updateSession({ status: 'running' });
        break;
      }
      case 'session_completed': {
        get().updateSession({ status: 'completed' });
        set({ highlightedNodeId: null });
        break;
      }
      case 'breakpoint_hit': {
        const payload = event.payload as { node_id: string };
        set({ highlightedNodeId: payload.node_id });
        get().updateSession({ status: 'paused' });
        break;
      }
      case 'variable_changed': {
        const payload = event.payload as { key: string; value: unknown };
        const variables = { ...get().session?.variables, [payload.key]: payload.value };
        get().updateSession({ variables });
        break;
      }
      case 'error': {
        get().updateSession({ status: 'error' });
        break;
      }
    }
  },

  clearEvents: () => set({ events: [] }),

  setHighlightedNode: (nodeId) => set({ highlightedNodeId: nodeId }),

  reset: () => {
    get().disconnect();
    set({
      session: null,
      ws: null,
      events: [],
      highlightedNodeId: null,
      loading: false,
      error: null,
    });
  },
}));

// 导出辅助函数供组件使用
export async function createDebugSession(instanceId: string, mode: 'step' | 'breakpoint' | 'continuous' = 'step') {
  return api.createDebugSession(instanceId, mode);
}

export async function getTimeline(sessionId: string) {
  return api.getTimeline(sessionId);
}
