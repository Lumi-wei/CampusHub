import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import type { Assignment, Course, CreateAssignmentRequest } from '@shared/types/api';

const EMPTY_FORM: CreateAssignmentRequest = {
  courseId: '',
  courseName: '',
  title: '',
  description: '',
  dueDate: '',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getDaysLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: '已过期', color: 'text-red-500' };
  if (days === 0) return { label: '今天截止', color: 'text-red-500' };
  if (days === 1) return { label: '明天截止', color: 'text-orange-500' };
  return { label: `还有 ${days} 天`, color: days <= 3 ? 'text-orange-500' : 'text-[#5A7A99]' };
}

export default function AssignmentsView({ onRefresh }: { onRefresh: () => void }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateAssignmentRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([apiService.getAssignments(), apiService.getCourses()]);
      if (aRes.success) setAssignments(aRes.data);
      if (cRes.success) setCourses(cRes.data);
    } catch {
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (a: Assignment) => {
    const newStatus = a.status === 'pending' ? 'completed' : 'pending';
    try {
      const res = await apiService.updateAssignmentStatus(a.id, newStatus);
      if (res.success) {
        setAssignments(prev => prev.map(x => x.id === a.id ? { ...x, status: newStatus } : x));
        toast.success(newStatus === 'completed' ? '作业已标记完成' : '已恢复待提交');
        onRefresh();
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个作业吗？')) return;
    try {
      const res = await apiService.deleteAssignment(id);
      if (res.success) {
        setAssignments(prev => prev.filter(a => a.id !== id));
        toast.success('作业已删除');
        onRefresh();
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.dueDate) {
      toast.error('请填写标题和截止日期');
      return;
    }
    setSaving(true);
    try {
      const res = await apiService.createAssignment(form);
      if (res.success) {
        toast.success('作业已创建');
        fetchData();
        onRefresh();
        setShowForm(false);
        setForm(EMPTY_FORM);
      }
    } catch {
      toast.error('创建失败');
    } finally {
      setSaving(false);
    }
  };

  const filtered = assignments.filter(a => filter === 'all' || a.status === filter);
  const pendingCount = assignments.filter(a => a.status === 'pending').length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['all', 'pending', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filter === f ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#5A7A99] border border-[#D1DDE8] hover:bg-[#F0F4F8]'
              }`}
            >
              {f === 'all' ? `全部 (${assignments.length})` : f === 'pending' ? `待提交 (${pendingCount})` : `已完成 (${completedCount})`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A9F] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          发布作业
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#D1DDE8] p-12 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-[#5A7A99] text-sm">暂无作业</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-[#2D6A9F] text-sm font-medium hover:underline">发布作业</button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(a => {
            const dl = getDaysLeft(a.dueDate);
            return (
              <div
                key={a.id}
                className={`bg-white rounded-2xl border border-[#D1DDE8] p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
                  a.status === 'completed' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggle(a)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      a.status === 'completed'
                        ? 'bg-green-500 border-green-500'
                        : 'border-[#D1DDE8] hover:border-[#2D6A9F]'
                    }`}
                  >
                    {a.status === 'completed' && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-bold text-[#0F1F33] ${a.status === 'completed' ? 'line-through' : ''}`}>
                          {a.title}
                        </p>
                        <p className="text-xs text-[#5A7A99] mt-0.5">{a.courseName}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-[#5A7A99] hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    {a.description && (
                      <p className="text-xs text-[#5A7A99] mt-1 leading-relaxed">{a.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-[#5A7A99]">截止：{formatDate(a.dueDate)}</span>
                      <span className={`text-xs font-semibold ${dl.color}`}>{dl.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-[#D1DDE8] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F1F33]">发布作业</h3>
              <button onClick={() => setShowForm(false)} className="text-[#5A7A99] hover:text-[#0F1F33]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">作业标题 *</label>
                <input
                  className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="例：第三章课后习题"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">关联课程</label>
                <select
                  className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F] bg-white"
                  value={form.courseId}
                  onChange={e => {
                    const c = courses.find(c => c.id === e.target.value);
                    setForm(f => ({ ...f, courseId: e.target.value, courseName: c?.name ?? '' }));
                  }}
                >
                  <option value="">选择课程（可选）</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">作业说明</label>
                <textarea
                  className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F] resize-none"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="作业要求说明..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">截止日期 *</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#D1DDE8] flex gap-3 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-semibold text-[#5A7A99] hover:bg-[#F0F4F8] rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold bg-[#1E3A5F] text-white rounded-xl hover:bg-[#2D6A9F] transition-colors disabled:opacity-50"
              >
                {saving ? '发布中...' : '发布作业'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
