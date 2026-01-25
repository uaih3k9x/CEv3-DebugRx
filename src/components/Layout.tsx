import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, Home, GitBranch } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isWorkflowPage = location.pathname === '/workflow';

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
