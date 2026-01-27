import { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, ChevronLeft, ChevronRight, User, Shield, AlertCircle, Download, CheckCircle } from 'lucide-react';
import axios from 'axios';

// 后端返回的用户结构
interface SSOUser {
  id: number;
  sso_id: string;
  username: string;
  email: string;
  display_name: string;
  department: string;
  grade: string;
  class_name: string;
  student_id: string;
  role: string;
  is_active: boolean;
}

interface UserTag {
  tag_name: string;
  tag_value: string;
  academic_year?: string;
}

interface UserWithTags {
  user: SSOUser;
  tags: UserTag[];
}

const roleLabels: Record<string, { label: string; color: string }> = {
  super_admin: { label: '超级管理员', color: 'bg-red-100 text-red-700' },
  grade_admin: { label: '年级管理员', color: 'bg-purple-100 text-purple-700' },
  admin: { label: '管理员', color: 'bg-blue-100 text-blue-700' },
  student: { label: '学生', color: 'bg-green-100 text-green-700' },
  teacher: { label: '教师', color: 'bg-orange-100 text-orange-700' },
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithTags[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number } | null>(null);
  const limit = 20;

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (keyword) params.set('keyword', keyword);
      if (roleFilter) params.set('role', roleFilter);

      const response = await axios.get(`/api/v1/users?${params.toString()}`);
      if (response.data.code === 0 && response.data.data) {
        const usersData: SSOUser[] = response.data.data.items || [];
        setUsers(usersData.map((user) => ({ user, tags: [] })));
        setTotal(response.data.data.total || usersData.length);
      } else {
        setUsers(getMockUsers());
        setTotal(8);
        setError('API 返回异常，显示模拟数据');
      }
    } catch (err) {
      setUsers(getMockUsers());
      setTotal(8);
      setError('API 暂不可用，显示模拟数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleSyncSSO = async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const response = await axios.post('/api/v1/users/sync-sso');
      if (response.data.code === 0 && response.data.data) {
        setSyncResult({
          synced: response.data.data.synced || 0,
          failed: response.data.data.failed || 0,
        });
        // 同步成功后刷新用户列表
        fetchUsers();
      } else {
        setError(response.data.message || '同步失败');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '同步请求失败';
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || errorMsg);
    } finally {
      setSyncing(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">用户管理</h2>
            <p className="text-sm text-gray-500">查看和管理系统用户</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncSSO}
            disabled={syncing || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download size={16} className={syncing ? 'animate-bounce' : ''} />
            {syncing ? '同步中...' : '从SSO拉取用户'}
          </button>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-sm text-green-700">
            同步完成：成功 {syncResult.synced} 个用户
            {syncResult.failed > 0 && `，失败 ${syncResult.failed} 个`}
          </span>
          <button
            onClick={() => setSyncResult(null)}
            className="ml-auto text-green-600 hover:text-green-800 text-sm"
          >
            关闭
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索用户姓名、学号..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部角色</option>
            <option value="super_admin">超级管理员</option>
            <option value="grade_admin">年级管理员</option>
            <option value="admin">管理员</option>
            <option value="teacher">教师</option>
            <option value="student">学生</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            搜索
          </button>
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} className="text-yellow-600" />
          <span className="text-sm text-yellow-700">{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">角色</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">年级/班级</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">学号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                  加载中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  暂无用户数据
                </td>
              </tr>
            ) : (
              users.map((item) => {
                const roleInfo = roleLabels[item.user.role] || { label: item.user.role, color: 'bg-gray-100 text-gray-700' };
                return (
                  <tr key={item.user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User size={16} className="text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.user.display_name}</div>
                          <div className="text-xs text-gray-500">{item.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                        <Shield size={12} />
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.user.class_name ? (
                        item.user.class_name
                      ) : item.user.department ? (
                        item.user.department
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.user.student_id ? (
                        <span className="font-mono">{item.user.student_id}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          活跃
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          停用
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              共 {total} 条记录，第 {page}/{totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 模拟数据（用于 API 不可用时）
function getMockUsers(): UserWithTags[] {
  return [
    {
      user: { id: 1, sso_id: 'mock-1', username: 'superadmin', email: 'admin@test.edu.cn', display_name: '超级管理员', department: '信息中心', grade: '', class_name: '', student_id: '', role: 'super_admin', is_active: true },
      tags: [],
    },
    {
      user: { id: 2, sso_id: 'mock-2', username: 'gradeadmin', email: 'grade@test.edu.cn', display_name: '2024级辅导员', department: '计算机学院', grade: '', class_name: '', student_id: '', role: 'grade_admin', is_active: true },
      tags: [],
    },
    {
      user: { id: 3, sso_id: 'mock-3', username: 'admin1', email: 'admin1@test.edu.cn', display_name: '2024级1班班主任', department: '计算机学院', grade: '2024', class_name: '2024级1班', student_id: '', role: 'admin', is_active: true },
      tags: [],
    },
    {
      user: { id: 4, sso_id: 'mock-4', username: 'student1', email: 'student1@test.edu.cn', display_name: '张三', department: '计算机学院', grade: '2024', class_name: '2024级1班', student_id: '2024010101', role: 'student', is_active: true },
      tags: [],
    },
  ];
}
