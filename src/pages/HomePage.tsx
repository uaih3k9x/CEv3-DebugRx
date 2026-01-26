import { Link } from 'react-router-dom';
import { Activity, Database, Server, Settings, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Activity,
      title: '系统健康检查',
      description: '检查系统各组件运行状态',
      path: '/health',
      color: 'blue',
    },
    {
      icon: Database,
      title: '数据诊断',
      description: '诊断数据一致性问题',
      path: '/diagnostic',
      color: 'purple',
    },
    {
      icon: Server,
      title: '服务监控',
      description: '监控后端服务状态',
      path: '/monitor',
      color: 'green',
    },
    {
      icon: Settings,
      title: '配置检查',
      description: '验证系统配置正确性',
      path: '/config',
      color: 'orange',
    },
  ];

  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:border-blue-300' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:border-purple-300' },
    green: { bg: 'bg-green-100', text: 'text-green-600', hover: 'hover:border-green-300' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', hover: 'hover:border-orange-300' },
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          DebugRx - CE诊断工具
        </h2>
        <p className="text-lg text-gray-600">
          CE综合测评系统的诊断与调试工具
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => {
          const colors = colorClasses[feature.color as keyof typeof colorClasses];
          return (
            <Link
              key={feature.title}
              to={feature.path}
              className={`block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all ${colors.hover} group`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 ${colors.bg} rounded-lg`}>
                  <feature.icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <ArrowRight className={`w-5 h-5 ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Status Section */}
      <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">系统状态</h3>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          <span className="text-gray-600">API 服务正常</span>
        </div>
      </div>
    </div>
  );
}
