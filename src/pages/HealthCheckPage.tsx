import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Activity, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { healthCheck, HealthStatus, ServiceHealth } from '../api/client';

// 状态指示灯组件
function StatusIndicator({ status }: { status: ServiceHealth['status'] }) {
  const config = {
    healthy: { color: 'bg-green-500', pulse: false },
    degraded: { color: 'bg-yellow-500', pulse: true },
    unhealthy: { color: 'bg-red-500', pulse: true },
  };
  const { color, pulse } = config[status];

  return (
    <span className="relative flex h-3 w-3">
      {pulse && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      )}
      <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`} />
    </span>
  );
}

// 状态图标组件
function StatusIcon({ status }: { status: ServiceHealth['status'] }) {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'unhealthy':
      return <XCircle className="w-5 h-5 text-red-500" />;
  }
}

// 总体状态卡片
function OverallStatusCard({ status }: { status: HealthStatus['overall'] }) {
  const config = {
    healthy: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: '系统健康' },
    degraded: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: '部分降级' },
    unhealthy: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: '系统异常' },
  };
  const { bg, border, text, label } = config[status];

  return (
    <div className={`${bg} ${border} border rounded-lg p-6 mb-6`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm">
          <StatusIndicator status={status} />
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${text}`}>{label}</h2>
          <p className="text-gray-600 text-sm">
            {status === 'healthy' ? '所有服务运行正常' :
             status === 'degraded' ? '部分服务性能降级' : '存在服务故障'}
          </p>
        </div>
      </div>
    </div>
  );
}

// 服务卡片
function ServiceCard({ service }: { service: ServiceHealth }) {
  const statusLabel = {
    healthy: '正常',
    degraded: '降级',
    unhealthy: '异常',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <StatusIndicator status={service.status} />
          <h3 className="font-semibold text-gray-900">{service.name}</h3>
        </div>
        <StatusIcon status={service.status} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">状态</span>
          <span className={`font-medium ${
            service.status === 'healthy' ? 'text-green-600' :
            service.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {statusLabel[service.status]}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            响应时间
          </span>
          <span className={`font-medium ${
            service.responseTime < 100 ? 'text-green-600' :
            service.responseTime < 500 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {service.responseTime} ms
          </span>
        </div>

        {service.message && (
          <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-700">
            {service.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HealthCheckPage() {
  const [data, setData] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await healthCheck();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取健康状态失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">系统健康检查</h1>
            <p className="text-sm text-gray-500">检查系统各组件运行状态</p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* Loading State */}
      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">正在检查...</span>
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
          <OverallStatusCard status={data.overall} />

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.services.map((service) => (
              <ServiceCard key={service.name} service={service} />
            ))}
          </div>

          {/* Last Check Time */}
          <div className="mt-6 text-center text-sm text-gray-500">
            最后检查时间: {new Date(data.checkedAt).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}
