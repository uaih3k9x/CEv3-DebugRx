import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Database, AlertCircle, AlertTriangle, Info, ChevronDown, ChevronRight, XCircle } from 'lucide-react';
import { diagnoseData, DiagnosticResult, DiagnosticIssue } from '../api/client';

// 严重程度配置
const severityConfig = {
  critical: {
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    label: '严重',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-700',
    label: '警告',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    label: '提示',
  },
};

// 摘要卡片
function SummaryCard({ summary }: { summary: DiagnosticResult['summary'] }) {
  const items = [
    { label: '严重', count: summary.critical, color: 'text-red-600', bg: 'bg-red-100' },
    { label: '警告', count: summary.warning, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: '提示', count: summary.info, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">诊断摘要</h2>
      <div className="flex items-center justify-between">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">{summary.total}</div>
          <div className="text-sm text-gray-500">总计问题</div>
        </div>
        <div className="flex gap-6">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${item.bg} mb-1`}>
                <span className={`text-lg font-bold ${item.color}`}>{item.count}</span>
              </div>
              <div className="text-xs text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 问题卡片
function IssueCard({ issue }: { issue: DiagnosticIssue }) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg overflow-hidden`}>
      <div
        className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${config.text} mt-0.5 flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
                {config.label}
              </span>
              <span className="text-xs text-gray-500">{issue.category}</span>
            </div>
            <h3 className={`font-semibold ${config.text}`}>{issue.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
          </div>
          <button className="p-1 hover:bg-white hover:bg-opacity-50 rounded">
            {expanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-200 border-opacity-50">
          <div className="pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">建议操作</h4>
            <p className="text-sm text-gray-600 bg-white bg-opacity-50 rounded p-3">
              {issue.suggestion}
            </p>

            {issue.details && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">详细信息</h4>
                <pre className="text-xs text-gray-600 bg-white bg-opacity-50 rounded p-3 overflow-x-auto">
                  {JSON.stringify(issue.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DataDiagnosticPage() {
  const [data, setData] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await diagnoseData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据诊断失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredIssues = data?.issues.filter(
    (issue) => filter === 'all' || issue.severity === filter
  ) || [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Database className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据诊断</h1>
            <p className="text-sm text-gray-500">诊断数据一致性问题</p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          重新诊断
        </button>
      </div>

      {/* Loading State */}
      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="ml-3 text-gray-600">正在诊断...</span>
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
          {/* Summary */}
          <SummaryCard summary={data.summary} />

          {/* Filter */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">筛选:</span>
            {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? '全部' : severityConfig[f].label}
                {f !== 'all' && (
                  <span className="ml-1">
                    ({f === 'critical' ? data.summary.critical :
                      f === 'warning' ? data.summary.warning : data.summary.info})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Issues List */}
          <div className="space-y-4">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {filter === 'all' ? '未发现任何问题' : `没有${severityConfig[filter].label}级别的问题`}
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))
            )}
          </div>

          {/* Last Check Time */}
          <div className="mt-6 text-center text-sm text-gray-500">
            诊断时间: {new Date(data.checkedAt).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}
