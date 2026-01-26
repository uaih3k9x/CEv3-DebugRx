import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Server, Play, Square, AlertCircle, Cpu, HardDrive, Activity, Clock, ChevronDown, ChevronRight, XCircle } from 'lucide-react';
import { getServiceStatus, ServiceStatus, ErrorLog } from '../api/client';
import DataSourceBadge from '../components/DataSourceBadge';

// 格式化运行时间
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分钟`);
  return parts.join(' ') || '刚刚启动';
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// 状态图标
function StatusIcon({ status }: { status: ServiceStatus['status'] }) {
  switch (status) {
    case 'running':
      return <Play className="w-4 h-4 text-green-500 fill-green-500" />;
    case 'stopped':
      return <Square className="w-4 h-4 text-gray-500 fill-gray-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
  }
}

// 进度条组件
function ProgressBar({ value, color }: { value: number; color: string }) {
  const bgColor = value > 80 ? 'bg-red-500' : value > 60 ? 'bg-yellow-500' : color;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`${bgColor} h-2 rounded-full transition-all`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

// 指标卡片
function MetricCard({ icon: Icon, label, value, unit, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="text-lg font-semibold text-gray-900">
        {value}{unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

// 错误日志组件
function ErrorLogItem({ log }: { log: ErrorLog }) {
  const isError = log.level === 'error';
  return (
    <div className={`p-3 rounded ${isError ? 'bg-red-50' : 'bg-yellow-50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          isError ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {isError ? 'ERROR' : 'WARN'}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(log.timestamp).toLocaleString()}
        </span>
      </div>
      <p className={`text-sm ${isError ? 'text-red-700' : 'text-yellow-700'}`}>
        {log.message}
      </p>
    </div>
  );
}

// 服务卡片
function ServiceCard({ service }: { service: ServiceStatus }) {
  const [expanded, setExpanded] = useState(false);
  const { metrics, recentErrors } = service;

  const statusLabel = {
    running: '运行中',
    stopped: '已停止',
    error: '错误',
  };

  const statusColor = {
    running: 'text-green-600 bg-green-50',
    stopped: 'text-gray-600 bg-gray-50',
    error: 'text-red-600 bg-red-50',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon status={service.status} />
            <div>
              <h3 className="font-semibold text-gray-900">{service.name}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span className={`px-2 py-0.5 rounded ${statusColor[service.status]}`}>
                  {statusLabel[service.status]}
                </span>
                {service.status === 'running' && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatUptime(service.uptime)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick Metrics */}
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-500 text-xs">CPU</div>
                <div className={`font-medium ${metrics.cpu > 80 ? 'text-red-600' : 'text-gray-900'}`}>
                  {metrics.cpu.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-xs">Memory</div>
                <div className={`font-medium ${metrics.memory > 80 ? 'text-red-600' : 'text-gray-900'}`}>
                  {metrics.memory.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-xs">Errors</div>
                <div className={`font-medium ${metrics.errors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {metrics.errors}
                </div>
              </div>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded">
              {expanded ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <MetricCard icon={Cpu} label="CPU 使用率" value={metrics.cpu.toFixed(1)} unit="%" color="text-blue-500" />
            <MetricCard icon={HardDrive} label="内存使用率" value={metrics.memory.toFixed(1)} unit="%" color="text-purple-500" />
            <MetricCard icon={Activity} label="总请求数" value={formatNumber(metrics.requests)} color="text-green-500" />
            <MetricCard icon={AlertCircle} label="错误率" value={metrics.errorRate.toFixed(3)} unit="%" color="text-red-500" />
          </div>

          {/* Usage Bars */}
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>CPU</span>
                <span>{metrics.cpu.toFixed(1)}%</span>
              </div>
              <ProgressBar value={metrics.cpu} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Memory</span>
                <span>{metrics.memory.toFixed(1)}%</span>
              </div>
              <ProgressBar value={metrics.memory} color="bg-purple-500" />
            </div>
          </div>

          {/* Recent Errors */}
          {recentErrors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">最近错误日志</h4>
              <div className="space-y-2">
                {recentErrors.map((log, index) => (
                  <ErrorLogItem key={index} log={log} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServiceMonitorPage() {
  const [data, setData] = useState<ServiceStatus[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getServiceStatus();
      setData(result.data);
      setIsMock(result.isMock);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取服务状态失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 计算统计
  const stats = {
    total: data.length,
    running: data.filter(s => s.status === 'running').length,
    errors: data.filter(s => s.status === 'error').length,
    totalErrors: data.reduce((sum, s) => sum + s.metrics.errors, 0),
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Server className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">服务监控</h1>
            <p className="text-sm text-gray-500">监控后端服务实时状态</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {data.length > 0 && <DataSourceBadge isMock={isMock} />}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && data.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
          <span className="ml-3 text-gray-600">正在获取服务状态...</span>
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
      {data.length > 0 && (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">总服务数</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.running}</div>
              <div className="text-sm text-gray-500">运行中</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
              <div className="text-sm text-gray-500">异常服务</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.totalErrors}</div>
              <div className="text-sm text-gray-500">总错误数</div>
            </div>
          </div>

          {/* Services List */}
          <div className="space-y-4">
            {data.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
