import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Settings, CheckCircle, AlertTriangle, XCircle, Shield, Database as DatabaseIcon, Server, FileText, Save, Edit2, X, Zap, RotateCcw } from 'lucide-react';
import api from '../api/client';
import DataSourceBadge from '../components/DataSourceBadge';

// 配置项（从后端获取）
interface ConfigItem {
  key: string;
  value: string;
  type: string;
  category: string;
  description: string;
  is_readonly: boolean;
  hot_reload: boolean;
  updated_at?: number;
}

// 状态图标
function StatusIcon({ status }: { status: 'ok' | 'warning' | 'error' }) {
  switch (status) {
    case 'ok':
      return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
  }
}

// 分类图标
function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case 'system':
      return <Settings className="w-4 h-4" />;
    case 'submission':
      return <FileText className="w-4 h-4" />;
    case 'review':
      return <Shield className="w-4 h-4" />;
    case 'workflow':
      return <Server className="w-4 h-4" />;
    case 'sso':
      return <DatabaseIcon className="w-4 h-4" />;
    default:
      return <Settings className="w-4 h-4" />;
  }
}

// 分类名称映射
const categoryLabels: Record<string, string> = {
  system: '系统配置',
  submission: '申报配置',
  review: '审核配置',
  workflow: '工作流配置',
  sso: 'SSO 配置',
};

// 配置项行组件
function ConfigRow({
  config,
  onSave,
}: {
  config: ConfigItem;
  onSave: (key: string, value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(config.value);
  const [saving, setSaving] = useState(false);

  const displayValue = () => {
    if (!config.value) return <span className="text-gray-400">未设置</span>;
    if (config.type === 'bool') return config.value === 'true' ? '是' : '否';
    return config.value;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config.key, editValue);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(config.value);
    setEditing(false);
  };

  const renderInput = () => {
    if (config.type === 'bool') {
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="true">是</option>
          <option value="false">否</option>
        </select>
      );
    }
    return (
      <input
        type={config.type === 'int' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={config.description || config.key}
      />
    );
  };

  return (
    <div className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      <div className="flex items-start gap-3">
        <StatusIcon status="ok" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm font-medium text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">{config.key}</code>
            {config.is_readonly && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">只读</span>
            )}
            {config.hot_reload ? (
              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded flex items-center gap-1">
                <Zap size={10} />
                热重载
              </span>
            ) : (
              <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">需重载</span>
            )}
          </div>
          {config.description && (
            <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
          )}

          {editing ? (
            <div className="flex items-center gap-2 mt-2">
              {renderInput()}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={12} />
                {saving ? '...' : '保存'}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
              >
                <X size={12} />
                取消
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-mono text-gray-700">{displayValue()}</span>
            </div>
          )}
        </div>

        {!editing && !config.is_readonly && (
          <button
            onClick={() => { setEditValue(config.value || ''); setEditing(true); }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit2 size={12} />
            编辑
          </button>
        )}
      </div>
    </div>
  );
}

// 分类组件
function CategorySection({
  category,
  items,
  onSave,
}: {
  category: string;
  items: ConfigItem[];
  onSave: (key: string, value: string) => Promise<void>;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
      <div className="px-4 py-3 border-b bg-gray-50 border-gray-200 flex items-center gap-2">
        <CategoryIcon category={category} />
        <h3 className="font-semibold text-gray-900">{categoryLabels[category] || category}</h3>
        <span className="text-sm text-gray-500">({items.length} 项)</span>
      </div>
      <div>
        {items.map((item) => (
          <ConfigRow
            key={item.key}
            config={item}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
}

// 总体状态卡片
function OverallStatusCard({ configs, needsReload }: { configs: ConfigItem[]; needsReload: boolean }) {
  const total = configs.length;
  const hotReloadCount = configs.filter(c => c.hot_reload).length;
  const readonlyCount = configs.filter(c => c.is_readonly).length;

  return (
    <div className={`rounded-lg p-6 mb-6 ${needsReload ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-14 h-14 rounded-full ${needsReload ? 'bg-yellow-100' : 'bg-green-100'}`}>
            {needsReload ? (
              <AlertTriangle className="w-7 h-7 text-yellow-600" />
            ) : (
              <CheckCircle className="w-7 h-7 text-green-600" />
            )}
          </div>
          <div>
            <h2 className={`text-xl font-bold ${needsReload ? 'text-yellow-700' : 'text-green-700'}`}>
              {needsReload ? '有配置需要重载生效' : '配置已同步'}
            </h2>
            <p className="text-gray-600 text-sm">
              {needsReload ? '修改了非热重载配置，点击"重载配置"使其生效' : '所有配置已生效'}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{total}</div>
            <div className="text-xs text-gray-500">总配置</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{hotReloadCount}</div>
            <div className="text-xs text-gray-500">热重载</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{readonlyCount}</div>
            <div className="text-xs text-gray-500">只读</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfigCheckPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/config/list');
      setConfigs(response.data.data || []);
      setIsMock(false);
      setNeedsReload(false);
    } catch {
      // 使用 mock 数据
      const mockConfigs: ConfigItem[] = [
        { key: 'current_academic_year', value: '2024-2025', type: 'string', category: 'system', description: '当前学年', is_readonly: false, hot_reload: true },
        { key: 'system_name', value: '综合素质测评系统', type: 'string', category: 'system', description: '系统名称', is_readonly: false, hot_reload: true },
        { key: 'system_version', value: '3.0.0', type: 'string', category: 'system', description: '系统版本', is_readonly: true, hot_reload: false },
        { key: 'max_attachment_size', value: '10485760', type: 'int', category: 'submission', description: '最大附件大小(字节)', is_readonly: false, hot_reload: true },
        { key: 'auto_assign_enabled', value: 'true', type: 'bool', category: 'review', description: '启用自动分配', is_readonly: false, hot_reload: true },
        { key: 'sso.base_url', value: 'http://localhost:8081', type: 'string', category: 'sso', description: 'SSO 服务地址', is_readonly: false, hot_reload: false },
        { key: 'sso.token', value: '', type: 'string', category: 'sso', description: 'SSO 管理员 Token', is_readonly: false, hot_reload: false },
        { key: 'sso.sync_enabled', value: 'true', type: 'bool', category: 'sso', description: '启用用户同步', is_readonly: false, hot_reload: false },
        { key: 'sso.sync_interval', value: '5', type: 'int', category: 'sso', description: '同步间隔(分钟)', is_readonly: false, hot_reload: false },
      ];
      setConfigs(mockConfigs);
      setIsMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleSave = async (key: string, value: string) => {
    setError(null);
    setSuccess(null);
    try {
      const config = configs.find(c => c.key === key);
      await api.post('/config/set', {
        key,
        value,
        type: config?.type || 'string',
        category: config?.category || 'system',
        description: config?.description || '',
      });
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
      setSuccess(`配置 ${key} 保存成功`);

      // 如果不是热重载配置，标记需要重载
      if (config && !config.hot_reload) {
        setNeedsReload(true);
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || '保存失败');
    }
  };

  const handleReload = async () => {
    setReloading(true);
    setError(null);
    try {
      const response = await api.post('/admin/system/reload');
      const reloaded = response.data.data?.reloaded || [];
      setSuccess(`配置重载成功: ${reloaded.join(', ')}`);
      setNeedsReload(false);
      // 重新获取配置
      await fetchConfigs();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || '重载失败，请确保已登录超级管理员账号');
    } finally {
      setReloading(false);
    }
  };

  // 按分类分组
  const categories = configs.reduce((acc, config) => {
    if (!acc[config.category]) acc[config.category] = [];
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, ConfigItem[]>);

  // 分类排序
  const categoryOrder = ['system', 'submission', 'review', 'workflow', 'sso'];
  const sortedCategories = Object.entries(categories).sort(([a], [b]) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Settings className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">配置管理</h1>
            <p className="text-sm text-gray-500">查看和管理系统配置项</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DataSourceBadge isMock={isMock} />
          {needsReload && (
            <button
              onClick={handleReload}
              disabled={reloading}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
            >
              <RotateCcw className={`w-4 h-4 ${reloading ? 'animate-spin' : ''}`} />
              重载配置
            </button>
          )}
          <button
            onClick={fetchConfigs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle size={18} className="text-green-600" />
          <span className="text-sm text-green-700">{success}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <XCircle size={18} className="text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-orange-600 animate-spin" />
          <span className="ml-3 text-gray-600">加载配置...</span>
        </div>
      ) : (
        <>
          {/* Overall Status */}
          <OverallStatusCard configs={configs} needsReload={needsReload} />

          {/* Config by Category */}
          {sortedCategories.map(([category, items]) => (
            <CategorySection
              key={category}
              category={category}
              items={items}
              onSave={handleSave}
            />
          ))}

          {/* Help */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 text-sm mb-2">说明</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>* <span className="inline-flex items-center gap-1 px-1 bg-green-100 text-green-700 rounded"><Zap size={10} />热重载</span> 配置修改后立即生效</li>
              <li>* <span className="inline-flex items-center px-1 bg-yellow-100 text-yellow-700 rounded">需重载</span> 配置修改后需点击"重载配置"按钮生效</li>
              <li>* <span className="inline-flex items-center px-1 bg-gray-200 text-gray-600 rounded">只读</span> 配置需要通过环境变量或配置文件修改</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
