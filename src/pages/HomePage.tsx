import { Activity, Database, Server, Settings } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Activity,
      title: '系统健康检查',
      description: '检查系统各组件运行状态',
    },
    {
      icon: Database,
      title: '数据诊断',
      description: '诊断数据一致性问题',
    },
    {
      icon: Server,
      title: '服务监控',
      description: '监控后端服务状态',
    },
    {
      icon: Settings,
      title: '配置检查',
      description: '验证系统配置正确性',
    },
  ];

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
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
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
