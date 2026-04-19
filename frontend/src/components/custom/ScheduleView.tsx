import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import type { Course, CreateCourseRequest } from '@shared/types/api';

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const COLORS = [
  { label: '蓝色', value: 'blue', bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
  { label: '绿色', value: 'green', bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800' },
  { label: '紫色', value: 'purple', bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800' },
  { label: '橙色', value: 'orange', bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800' },
  { label: '红色', value: 'red', bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800' },
  { label: '青色', value: 'teal', bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-800' },
];

function getColorClasses(color: string) {
  return COLORS.find(c => c.value === color) ?? COLORS[0];
}

const EMPTY_FORM: CreateCourseRequest = {
  name: '',
  teacher: '',
  location: '',
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:40',
  color: 'blue',
};

export default function ScheduleView({ onRefresh }: { onRefresh: () => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<CreateCourseRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getCourses();
      if (res.success) setCourses(res.data);
    } catch {
      toast.error('加载课程失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const openCreate = () => {
    setEditingCourse(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({
      name: course.name,
      teacher: course.teacher,
      location: course.location,
      dayOfWeek: course.dayOfWeek,
      startTime: course.startTime,
      endTime: course.endTime,
      color: course.color,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.teacher.trim() || !form.location.trim()) {
      toast.error('请填写所有必填字段');
      return;
    }
    setSaving(true);
    try {
      if (editingCourse) {
        const res = await apiService.updateCourse(editingCourse.id, form);
        if (res.success) {
          toast.success('课程已更新');
          fetchCourses();
          onRefresh();
          setShowForm(false);
        }
      } else {
        const res = await apiService.createCourse(form);
        if (res.success) {
          toast.success('课程已添加');
          fetchCourses();
          onRefresh();
          setShowForm(false);
        }
      }
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这门课程吗？')) return;
    try {
      const res = await apiService.deleteCourse(id);
      if (res.success) {
        toast.success('课程已删除');
        fetchCourses();
        onRefresh();
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const displayedCourses = viewMode === 'day'
    ? courses.filter(c => c.dayOfWeek === selectedDay)
    : courses;

  const coursesByDay = DAYS.map((_, i) => courses.filter(c => c.dayOfWeek === i));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              viewMode === 'week' ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#5A7A99] border border-[#D1DDE8] hover:bg-[#F0F4F8]'
            }`}
          >
            周视图
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              viewMode === 'day' ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#5A7A99] border border-[#D1DDE8] hover:bg-[#F0F4F8]'
            }`}
          >
            日视图
          </button>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A9F] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加课程
        </button>
      </div>

      {/* Day selector for day view */}
      {viewMode === 'day' && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {DAYS.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedDay === i
                  ? 'bg-[#1E3A5F] text-white'
                  : 'bg-white text-[#5A7A99] border border-[#D1DDE8] hover:bg-[#F0F4F8]'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Week View */}
      {!loading && viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {DAYS.map((day, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#D1DDE8] overflow-hidden">
              <div className={`px-3 py-2 text-center text-xs font-bold ${
                i === new Date().getDay() ? 'bg-[#1E3A5F] text-white' : 'bg-[#F0F4F8] text-[#5A7A99]'
              }`}>
                {day}
              </div>
              <div className="p-2 space-y-2 min-h-[80px]">
                {coursesByDay[i].length === 0 ? (
                  <p className="text-xs text-[#5A7A99] text-center py-3">无课</p>
                ) : (
                  coursesByDay[i].map(course => {
                    const cc = getColorClasses(course.color);
                    return (
                      <div
                        key={course.id}
                        className={`${cc.bg} rounded-lg p-2 cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={() => openEdit(course)}
                      >
                        <p className={`text-xs font-bold ${cc.text} leading-tight`}>{course.name}</p>
                        <p className="text-xs text-[#5A7A99] mt-0.5">{course.startTime}-{course.endTime}</p>
                        <p className="text-xs text-[#5A7A99]">{course.location}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Day View */}
      {!loading && viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-[#D1DDE8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#D1DDE8]">
            <h2 className="text-base font-bold text-[#0F1F33]">{DAYS[selectedDay]} 课程安排</h2>
          </div>
          <div className="p-6 space-y-3">
            {displayedCourses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-[#5A7A99] text-sm">今天没有课程</p>
                <button onClick={openCreate} className="mt-3 text-[#2D6A9F] text-sm font-medium hover:underline">添加课程</button>
              </div>
            ) : (
              displayedCourses.map(course => {
                const cc = getColorClasses(course.color);
                return (
                  <div key={course.id} className="flex gap-4 items-start">
                    <div className="text-right w-16 flex-shrink-0">
                      <p className="text-xs font-bold text-[#5A7A99]">{course.startTime}</p>
                      <p className="text-xs text-[#5A7A99]">{course.endTime}</p>
                    </div>
                    <div className={`flex-1 ${cc.bg} rounded-xl p-4 hover:shadow-md transition-all duration-200`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm font-bold ${cc.text}`}>{course.name}</p>
                          <p className="text-xs text-[#5A7A99] mt-0.5">{course.location} · {course.teacher}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => openEdit(course)}
                            className="text-xs text-[#2D6A9F] hover:underline"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-[#D1DDE8] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F1F33]">{editingCourse ? '编辑课程' : '添加课程'}</h3>
              <button onClick={() => setShowForm(false)} className="text-[#5A7A99] hover:text-[#0F1F33]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">课程名称 *</label>
                <input
                  className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="例：数据结构与算法"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A7A99] mb-1">授课教师 *</label>
                  <input
                    className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                    value={form.teacher}
                    onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))}
                    placeholder="张教授"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A7A99] mb-1">上课地点 *</label>
                  <input
                    className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="A301"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">星期</label>
                <select
                  className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F] bg-white"
                  value={form.dayOfWeek}
                  onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                >
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A7A99] mb-1">开始时间</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                    value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A7A99] mb-1">结束时间</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F]"
                    value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-2">颜色标签</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setForm(f => ({ ...f, color: c.value }))}
                      className={`w-8 h-8 rounded-full ${c.bg} border-2 transition-all ${
                        form.color === c.value ? 'border-[#1E3A5F] scale-110' : 'border-transparent'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#D1DDE8] flex gap-3 justify-end">
              {editingCourse && (
                <button
                  onClick={() => { handleDelete(editingCourse.id); setShowForm(false); }}
                  className="px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  删除
                </button>
              )}
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
