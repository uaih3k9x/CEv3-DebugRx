import { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, ChevronLeft, ChevronRight, User, Shield, AlertCircle, Download, CheckCircle, Tags, X, Plus } from 'lucide-react';
import axios from 'axios';
import { listTagDefinitions, getUserTags, assignUserTag, removeUserTag } from '../api/client';
import type { TagDefinition, AssignTagRequest } from '../types/tag';

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

// ================================================================================
// Tag Edit Modal
// ================================================================================

interface TagEditModalProps {
  user: SSOUser;
  onClose: () => void;
  onUpdated: () => void;
}

function TagEditModal({ user, onClose, onUpdated }: TagEditModalProps) {
  const [tags, setTags] = useState<Record<string, string>>({});
  const [definitions, setDefinitions] = useState<TagDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新标签表单
  const [newTagName, setNewTagName] = useState('');
  const [newTagValue, setNewTagValue] = useState('');

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userTags, defs] = await Promise.all([
        getUserTags(user.id),
        listTagDefinitions(),
      ]);
      setTags(userTags);
      setDefinitions(defs);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!newTagName || !newTagValue) return;
    setSaving(true);
    setError(null);
    try {
      const req: AssignTagRequest = {
        tag_name: newTagName,
        tag_value: newTagValue,
      };
      await assignUserTag(user.id, req);
      setTags((prev) => ({ ...prev, [newTagName]: newTagValue }));
      setNewTagName('');
      setNewTagValue('');
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '分配标签失败');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (tagName: string) => {
    setSaving(true);
    setError(null);
    try {
      await removeUserTag(user.id, tagName);
      setTags((prev) => {
        const next = { ...prev };
        delete next[tagName];
        return next;
      });
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '移除标签失败');
    } finally {
      setSaving(false);
    }
  };

  // 当前标签定义的显示名映射
  const defMap = new Map(definitions.map((d) => [d.name, d]));

  // 获取当前选中标签定义的可选值
  const selectedDef = defMap.get(newTagName);
  const enumValues = selectedDef?.enum_values;

  // 未分配的标签定义
  const unassignedDefs = definitions.filter((d) => !(d.name in tags));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              编辑用户标签
            </h3>
            <p className="text-sm text-gray-500">
              {user.display_name} ({user.username})
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">加载中...</p>
            </div>
          ) : (
            <>
              {/* 当前标签列表 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  当前标签
                </h4>
                {Object.keys(tags).length === 0 ? (
                  <p className="text-sm text-gray-400">暂无标签</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(tags).map(([name, value]) => {
                      const def = defMap.get(name);
                      return (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          <span className="font-medium">
                            {def?.display_name || name}
                          </span>
                          <span className="text-blue-400">:</span>
                          <span>{value}</span>
                          <button
                            onClick={() => handleRemove(name)}
                            disabled={saving}
                            className="ml-1 text-blue-400 hover:text-red-500 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 添加标签 */}
              {unassignedDefs.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    添加标签
                  </h4>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        标签类型
                      </label>
                      <select
                        value={newTagName}
                        onChange={(e) => {
                          setNewTagName(e.target.value);
                          setNewTagValue('');
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">选择标签...</option>
                        {unassignedDefs.map((d) => (
                          <option key={d.name} value={d.name}>
                            {d.display_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        标签值
                      </label>
                      {enumValues && enumValues.length > 0 ? (
                        <select
                          value={newTagValue}
                          onChange={(e) => setNewTagValue(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">选择值...</option>
                          {enumValues.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={newTagValue}
                          onChange={(e) => setNewTagValue(e.target.value)}
                          placeholder="输入标签值"
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>
                    <button
                      onClick={handleAssign}
                      disabled={!newTagName || !newTagValue || saving}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      添加
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

// ================================================================================
// Main Page
// ================================================================================

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
  const [editingUser, setEditingUser] = useState<SSOUser | null>(null);
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                  加载中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
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
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditingUser(item.user)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Tags size={14} />
                        标签
                      </button>
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

      {/* Tag Edit Modal */}
      {editingUser && (
        <TagEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={() => fetchUsers()}
        />
      )}
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
