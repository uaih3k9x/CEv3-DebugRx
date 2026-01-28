import { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, Home, GitBranch, Activity, Database, Server, Settings, ChevronDown, Tag, LogIn, LogOut, User, Menu, Users } from 'lucide-react';

// 测试用户数据
const TEST_USERS = [
  { id: 2, name: '系统管理员', role: 'super_admin', permissions: 15 },
  { id: 3, name: '2024级辅导员', role: 'grade_admin', permissions: 7 },
  { id: 5, name: '2024级1班班主任', role: 'admin', permissions: 3 },
  { id: 7, name: '张三 (学生)', role: 'student', permissions: 1 },
];

// 预生成的开发测试 Token (通过 go run ./cmd/gentoken 生成，有效期24小时)
// permissions=15 表示拥有所有权限 (user=1 + admin=2 + grade_admin=4 + super_admin=8)
const DEV_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWdlIjoxLCJleHAiOjE3Njk2NjUwMTgsImlhdCI6MTc2OTU3ODYxOCwicGVybWlzc2lvbnMiOjE1LCJyb2xlIjoxLCJ0b2tlbl90eXBlIjoiYWNjZXNzIiwidXNlcl9pZCI6MX0.iJ2b2ZNG6V9NMbtmOiGVCzXIMkwvzujCm02Ww4YcXug';

// 解析 JWT 获取过期时间
function getTokenExpiry(token: string): Date | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? new Date(decoded.exp * 1000) : null;
  } catch {
    return null;
  }
}

// 格式化剩余时间
function formatTimeRemaining(expiry: Date): { text: string; isExpired: boolean; isWarning: boolean } {
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) {
    return { text: '已过期', isExpired: true, isWarning: false };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const isWarning = hours < 2; // 少于2小时警告

  if (hours > 0) {
    return { text: `${hours}小时${minutes}分钟`, isExpired: false, isWarning };
  }
  return { text: `${minutes}分钟`, isExpired: false, isWarning };
}

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

// 主菜单项（除快速登录外的所有功能）
const mainMenuItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/workflow', label: '工作流设计器', icon: GitBranch },
  { path: '/tags', label: '标签管理', icon: Tag },
  { path: '/users', label: '用户管理', icon: Users },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isWorkflowPage = location.pathname === '/workflow';
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<typeof TEST_USERS[0] | null>(null);
  const [tokenStatus, setTokenStatus] = useState<{ text: string; isExpired: boolean; isWarning: boolean } | null>(null);
  const mainMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 检查当前路径是否在诊断菜单中
  const isDiagnosticPage = diagnosticMenuItems.some(item => item.path === location.pathname);
  // 检查当前路径是否在主菜单中
  const isMainMenuPage = mainMenuItems.some(item => item.path === location.pathname) || isDiagnosticPage;

  // 初始化时检查是否已登录
  useEffect(() => {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('current_user');
      }
    }
  }, []);

  // 检查 token 过期状态
  useEffect(() => {
    const updateTokenStatus = () => {
      const expiry = getTokenExpiry(DEV_TOKEN);
      if (expiry) {
        setTokenStatus(formatTimeRemaining(expiry));
      }
    };

    updateTokenStatus();
    const interval = setInterval(updateTokenStatus, 60000); // 每分钟更新
    return () => clearInterval(interval);
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mainMenuRef.current && !mainMenuRef.current.contains(event.target as Node)) {
        setShowMainMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 模拟登录
  const handleLogin = (user: typeof TEST_USERS[0]) => {
    localStorage.setItem('access_token', DEV_TOKEN);
    localStorage.setItem('current_user', JSON.stringify(user));
    document.cookie = `access_token=${DEV_TOKEN}; path=/`;
    setCurrentUser(user);
    setShowUserMenu(false);
    window.location.reload(); // 刷新以应用新的认证状态
  };

  // 登出
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setCurrentUser(null);
    setShowUserMenu(false);
    window.location.reload();
  };

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
          <nav className="flex items-center gap-2">
            {/* 主菜单下拉 */}
            <div className="relative" ref={mainMenuRef}>
              <button
                onClick={() => setShowMainMenu(!showMainMenu)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isMainMenuPage
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Menu size={18} />
                菜单
                <ChevronDown size={16} className={`transition-transform ${showMainMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMainMenu && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  {/* 主菜单项 */}
                  {mainMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMainMenu(false)}
                      className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        location.pathname === item.path
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </Link>
                  ))}

                  {/* 诊断工具子菜单 */}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <div className="px-4 py-2 flex items-center gap-2 text-xs text-gray-500">
                      <Stethoscope size={14} />
                      诊断工具
                    </div>
                    {diagnosticMenuItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setShowMainMenu(false)}
                        className={`flex items-center gap-3 px-4 py-2 pl-8 text-sm transition-colors ${
                          location.pathname === item.path
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon size={14} className={item.color} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 分隔线 */}
            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* 用户登录/信息 */}
            <div className="relative" ref={userMenuRef}>
              {currentUser ? (
                <>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                  >
                    <User size={16} />
                    {currentUser.name}
                    <span className="text-xs px-1.5 py-0.5 bg-green-200 rounded">
                      {currentUser.role}
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                      {/* Token 过期提醒 */}
                      {tokenStatus && (
                        <div className={`mx-2 mb-1 px-3 py-2 rounded text-xs ${
                          tokenStatus.isExpired
                            ? 'bg-red-50 text-red-600'
                            : tokenStatus.isWarning
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-green-50 text-green-600'
                        }`}>
                          {tokenStatus.isExpired
                            ? 'DevToken 已过期，请重新生成'
                            : `DevToken 剩余 ${tokenStatus.text}`}
                        </div>
                      )}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500">切换用户</p>
                      </div>
                      {TEST_USERS.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleLogin(user)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors hover:bg-gray-50 ${
                            currentUser.id === user.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <User size={14} />
                          <span className="flex-1">{user.name}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{user.role}</span>
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={14} />
                          退出登录
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <LogIn size={16} />
                    快速登录
                  </button>
                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                      {/* Token 过期提醒 */}
                      {tokenStatus && tokenStatus.isExpired && (
                        <div className="mx-2 mb-1 px-3 py-2 rounded text-xs bg-red-50 text-red-600">
                          DevToken 已过期，请重新生成
                        </div>
                      )}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500">选择测试用户</p>
                      </div>
                      {TEST_USERS.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleLogin(user)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User size={14} />
                          <span className="flex-1">{user.name}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{user.role}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
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
            DebugRx v0.1.0 · 雾雨电气通讯
          </p>
        </footer>
      )}
    </div>
  );
}
