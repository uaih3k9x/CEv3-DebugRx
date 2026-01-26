import { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, Home, GitBranch, Activity, Database, Server, Settings, ChevronDown } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

// 诊断功能菜单项
const diagnosticMenuItems = [
  { path: '/health', label: '系统健康检查', icon: Activity, color: 'text-blue-600' },
  { path: '/diagnostic', label: '数据诊断', icon: Database, color: 'text-purple-600' },
  { path: '/monitor', label: '服务监控', icon: Server, color: 'text-green-600' },
  { path: '/config', label: '配置检查', icon: Settings, color: 'text-orange-600' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isWorkflowPage = location.pathname === '/workflow';
  const [showDiagnosticMenu, setShowDiagnosticMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 检查当前路径是否在诊断菜单中
  const isDiagnosticPage = diagnosticMenuItems.some(item => item.path === location.pathname);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDiagnosticMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-7 h-7 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">DebugRx</h1>
              <p className="text-xs text-gray-500">CE综合测评系统诊断工具</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home size={18} />
              首页
            </Link>

            {/* Diagnostic Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowDiagnosticMenu(!showDiagnosticMenu)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDiagnosticPage
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Stethoscope size={18} />
                诊断工具
                <ChevronDown size={16} className={`transition-transform ${showDiagnosticMenu ? 'rotate-180' : ''}`} />
              </button>

              {showDiagnosticMenu && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  {diagnosticMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowDiagnosticMenu(false)}
                      className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        location.pathname === item.path
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon size={16} className={item.color} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/workflow"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/workflow'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <GitBranch size={18} />
              工作流设计器
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className={isWorkflowPage ? 'flex-1' : 'flex-1 p-6'}>
        {children}
      </main>

      {/* Footer - 工作流页面不显示 */}
      {!isWorkflowPage && (
        <footer className="bg-white border-t border-gray-200 px-6 py-3">
          <p className="text-sm text-gray-500 text-center">
            DebugRx v0.1.0
          </p>
        </footer>
      )}
    </div>
  );
}
