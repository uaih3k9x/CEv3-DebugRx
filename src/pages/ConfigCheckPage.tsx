import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Settings, CheckCircle, AlertTriangle, XCircle, Shield, Database as DatabaseIcon, Server, FileText } from 'lucide-react';
import { checkConfig, ConfigCheckResult, ConfigItem } from '../api/client';

// 状态图标
function StatusIcon({ status }: { status: ConfigItem['status'] }) {
  switch (status) {
    case 'ok':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-500" />;
  }
}

// 分类图标
function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case '数据库':
      return <DatabaseIcon className="w-4 h-4" />;
    case '缓存':
      return <Server className="w-4 h-4" />;
    case '存储':
      return <FileText className="w-4 h-4" />;
    case '安全':
      return <Shield className="w-4 h-4" />;
    default:
      return <Settings className="w-4 h-4" />;
  }
}

// 总体状态卡片
function OverallStatusCard({ valid, items }: { valid: boolean; items: ConfigItem[] }) {
  const errorCount = items.filter(i => i.status === 'error').length;
  const warningCount = items.filter(i => i.status === 'warning').length;
  const okCount = items.filter(i => i.status === 'ok').length;

  return (
    <div className={`rounded-lg p-6 mb-6 ${valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-16 h-16 rounded-full ${valid ? 'bg-green-100' : 'bg-red-100'}`}>
            {valid ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${valid ? 'text-green-700' : 'text-red-700'}`}>
              {valid ? '配置验证通过' : '配置存在问题'}
            </h2>
            <p className="text-gray-600 text-sm">
              {valid ? '所有配置项验证通过' : `发现 ${errorCount} 个错误，${warningCount} 个警告`}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{okCount}</div>
            <div className="text-xs text-gray-500">通过</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            <div className="text-xs text-gray-500">警告</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-xs text-gray-500">错误</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 配置项行
function ConfigItemRow({ item }: { item: ConfigItem }) {
  const statusBg = {
    ok: 'bg-white hover:bg-gray-50',
    warning: 'bg-yellow-50 hover:bg-yellow-100',
    error: 'bg-red-50 hover:bg-red-100',
  };

  return (
    <div className={`${statusBg[item.status]} border-b border-gray-200 last:border-b-0 transition-colors`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <StatusIcon status={item.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <code className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                  {item.key}
                </code>
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  <CategoryIcon category={item.category} />
                  {item.category}
                </span>
              </div>
              <div className="text-sm text-gray-600 font-mono truncate">
                {item.value}
              </div>
            </div>
          </div>
        </div>
        {item.message && (
          <div className={`mt-2 ml-8 text-sm ${
            item.status === 'error' ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {item.message}
          </div>
        )}
      </div>
    </div>
  );
}

// 分类分组
function CategoryGroup({ category, items }: { category: string; items: ConfigItem[] }) {
  const hasIssues = items.some(i => i.status !== 'ok');

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
      <div className={`px-4 py-3 border-b ${hasIssues ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <CategoryIcon category={category} />
          <h3 className="font-semibold text-gray-900">{category}</h3>
          <span className="text-sm text-gray-500">({items.length} 项)</span>
        </div>
      </div>
      <div>
        {items.map((item) => (
          <ConfigItemRow key={item.key} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function ConfigCheckPage() {
  const [data, setData] = useState<ConfigCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'warning' | 'error'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await checkConfig();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '配置检查失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 过滤和分组
  const filteredItems = data?.items.filter(
    item => filterStatus === 'all' || item.status === filterStatus
  ) || [];

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ConfigItem[]>);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Settings className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">配置检查</h1>
            <p className="text-sm text-gray-500">验证系统配置正确性</p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          重新检查
        </button>
      </div>

      {/* Loading State */}
      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-orange-600 animate-spin" />
          <span className="ml-3 text-gray-600">正在检查配置...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Data Display */}
      {data && (
        <>
          {/* Overall Status */}
          <OverallStatusCard valid={data.valid} items={data.items} />

          {/* Filter */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">筛选:</span>
            {(['all', 'error', 'warning', 'ok'] as const).map((f) => {
              const count = f === 'all' ? data.items.length : data.items.filter(i => i.status === f).length;
              const labels = { all: '全部', ok: '通过', warning: '警告', error: '错误' };
              return (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterStatus === f
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {labels[f]} ({count})
                </button>
              );
            })}
          </div>

          {/* Config Items by Category */}
          {Object.keys(groupedItems).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              没有符合条件的配置项
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <CategoryGroup key={category} category={category} items={items} />
            ))
          )}

          {/* Last Check Time */}
          <div className="mt-6 text-center text-sm text-gray-500">
            检查时间: {new Date(data.checkedAt).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}
