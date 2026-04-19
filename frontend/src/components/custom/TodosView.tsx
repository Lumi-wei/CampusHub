import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import type { Todo, Course, CreateTodoRequest, TodoPriority } from '@shared/types/api';

const PRIORITY_CONFIG: Record<TodoPriority, { label: string; color: string; bg: string }> = {
  high: { label: '高优先级', color: 'text-red-600', bg: 'bg-red-100' },
  medium: { label: '中优先级', color: 'text-orange-600', bg: 'bg-orange-100' },
  low: { label: '低优先级', color: 'text-green-600', bg: 'bg-green-100' },
};

const EMPTY_FORM: CreateTodoRequest = {
  title: '',
  description: '',
  priority: 'medium',
  dueDate: null,
  courseId: null,
  courseName: null,
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function isOverdue(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

export default function TodosView({ onRefresh }: { onRefresh: () => void }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TodoPriority>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [form, setForm] = useState<CreateTodoRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([apiService.getTodos(), apiService.getCourses()]);
      if (tRes.success) setTodos(tRes.data);
      if (cRes.success) setCourses(cRes.data);
    } catch {
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingTodo(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setForm({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      dueDate: todo.dueDate ? todo.dueDate.slice(0, 16) : null,
      courseId: todo.courseId,
      courseName: todo.courseName,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('请输入事项标题');
      return;
    }
    setSaving(true);
    try {
      if (editingTodo) {
        const res = await apiService.updateTodo(editingTodo.id, form);
        if (res.success) {
          toast.success('待办已更新');
          fetchData();
          onRefresh();
          setShowForm(false);
        }
      } else {
        const res = await apiService.createTodo(form);
        if (res.success) {
          toast.success('待办已创建');
          fetchData();
          onRefresh();
          setShowForm(false);
        }
      }
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    const newStatus = todo.status === 'pending' ? 'completed' : 'pending';
    try {
      const res = await apiService.updateTodo(todo.id, { status: newStatus });
      if (res.success) {
        setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, status: newStatus } : t));
        toast.success(newStatus === 'completed' ? '已完成' : '已恢复待办');
        onRefresh();
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个待办吗？')) return;
    try {
      const res = await apiService.deleteTodo(id);
      if (res.success) {
        setTodos(prev => prev.filter(t => t.id !== id));
        toast.success('待办已删除');
        onRefresh();
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const filtered = todos.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const pendingCount = todos.filter(t => t.status === 'pending').length;
  const completedCount = todos.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                filter === f ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#5A7A99] border border-[#D1DDE8] hover:bg-[#F0F4F8]'
              }`}
            >
              {f === 'all' ? `全部 (${todos.length})` : f === 'pending' ? `待办 (${pendingCount})` : `已完成 (${completedCount})`}
            </button>
          ))}
          <select
            className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-white text-[#5A7A99] border border-[#D1DDE8] focus:outline-none focus:border-[#2D6A9F]"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as 'all' | TodoPriority)}
          >
            <option value="all">所有优先级</option>
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A9F] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建待办
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#D1DDE8] p-12 text-center">
          <p className="text-4xl mb-3">🗂️</p>
          <p className="text-[#5A7A99] text-sm">暂无待办事项</p>
          <button onClick={openCreate} className="mt-3 text-[#2D6A9F] text-sm font-medium hover:underline">创建待办</button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(todo => {
            const pc = PRIORITY_CONFIG[todo.priority];
            const overdue = isOverdue(todo.dueDate) && todo.status === 'pending';
            return (
              <div
                key={todo.id}
                className={`bg-white rounded-2xl border border-[#D1DDE8] p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
                  todo.status === 'completed' ? 'opacity-60' : ''
                } ${overdue ? 'border-red-200' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggle(todo)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      todo.status === 'completed'
                        ? 'bg-green-500 border-green-500'
                        : 'border-[#D1DDE8] hover:border-[#2D6A9F]'
                    }`}
                  >
                    {todo.status === 'completed' && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-bold text-[#0F1F33] ${todo.status === 'completed' ? 'line-through' : ''}`}>
                          {todo.title}
                        </p>
                        {todo.courseName && (
                          <p className="text-xs text-[#5A7A99] mt-0.5">{todo.courseName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pc.bg} ${pc.color}`}>
                          {pc.label}
                        </span>
                        <button onClick={() => openEdit(todo)} className="text-[#5A7A99] hover:text-[#2D6A9F] transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(todo.id)} className="text-[#5A7A99] hover:text-red-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {todo.description && (
                      <p className="text-xs text-[#5A7A99] mt-1 leading-relaxed">{todo.description}</p>
                    )}
                    {todo.dueDate && (
                      <p className={`text-xs mt-2 font-medium ${overdue ? 'text-red-500' : 'text-[#5A7A99]'}`}>
                        {overdue ? '已过期：' : '截止：'}{formatDate(todo.dueDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-[#D1DDE8] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F1F33]">{editingTodo ? '编辑待办' : '新建待办'}</h3>
              <button onClick={() => setShowForm(false)} className="text-[#5A7A99] hover:text-[#0F1F33]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">事项标题 *</label>
                <input
                  className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="例：复习第三章内容"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">优先级</label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as TodoPriority[]).map(p => {
                    const pc = PRIORITY_CONFIG[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setForm(f => ({ ...f, priority: p }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          form.priority === p ? `${pc.bg} ${pc.color}` : 'bg-[#F0F4F8] text-[#5A7A99] hover:bg-[#D1DDE8]'
                        }`}
                      >
                        {pc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">备注说明</label>
                <textarea
                  className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F] resize-none"
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="可选备注..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">截止日期（可选）</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                  value={form.dueDate ?? ''}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value || null }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">关联课程（可选）</label>
                <select
                  className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F] bg-white"
                  value={form.courseId ?? ''}
                  onChange={e => {
                    const c = courses.find(c => c.id === e.target.value);
                    setForm(f => ({ ...f, courseId: e.target.value || null, courseName: c?.name ?? null }));
                  }}
                >
                  <option value="">无关联课程</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
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
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold bg-[#1E3A5F] text-white rounded-xl hover:bg-[#2D6A9F] transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
