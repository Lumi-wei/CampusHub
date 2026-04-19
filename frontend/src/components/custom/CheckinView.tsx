import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import type { CheckinSession, CheckinRecord, Course } from '@shared/types/api';

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getTimeLeft(endTime: string) {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function CheckinView({ onRefresh }: { onRefresh: () => void }) {
  const [sessions, setSessions] = useState<CheckinSession[]>([]);
  const [records, setRecords] = useState<CheckinRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ courseId: '', courseName: '', durationMinutes: 15 });
  const [saving, setSaving] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, rRes, cRes] = await Promise.all([
        apiService.getCheckinSessions(),
        apiService.getCheckinRecords(),
        apiService.getCourses(),
      ]);
      if (sRes.success) setSessions(sRes.data);
      if (rRes.success) setRecords(rRes.data);
      if (cRes.success) setCourses(cRes.data);
    } catch {
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeSessions = sessions.filter(s => s.isActive && new Date(s.endTime) > new Date());
  const closedSessions = sessions.filter(s => !s.isActive || new Date(s.endTime) <= new Date());

  const handleCheckin = async (session: CheckinSession) => {
    setCheckinLoading(session.id);
    try {
      const res = await apiService.createCheckinRecord(session.id, session.courseName, 'present');
      if (res.success) {
        toast.success('签到成功！');
        fetchData();
        onRefresh();
      }
    } catch {
      toast.error('签到失败');
    } finally {
      setCheckinLoading(null);
    }
  };

  const handleCloseSession = async (id: string) => {
    try {
      const res = await apiService.closeCheckinSession(id);
      if (res.success) {
        toast.success('签到任务已关闭');
        fetchData();
      }
    } catch {
      toast.error('关闭失败');
    }
  };

  const handleCreateSession = async () => {
    if (!createForm.courseId || !createForm.durationMinutes) {
      toast.error('请选择课程并设置时长');
      return;
    }
    setSaving(true);
    try {
      const res = await apiService.createCheckinSession({
        courseId: createForm.courseId,
        courseName: createForm.courseName,
        durationMinutes: createForm.durationMinutes,
      });
      if (res.success) {
        toast.success('签到任务已发起');
        fetchData();
        onRefresh();
        setShowCreateForm(false);
        setCreateForm({ courseId: '', courseName: '', durationMinutes: 15 });
      }
    } catch {
      toast.error('发起失败');
    } finally {
      setSaving(false);
    }
  };

  const totalRecords = records.length;
  const presentRecords = records.filter(r => r.status === 'present').length;
  const rate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#D1DDE8] text-center">
          <p className="text-2xl font-bold text-[#1E3A5F]">{totalRecords}</p>
          <p className="text-xs text-[#5A7A99] mt-1">总签到次数</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#D1DDE8] text-center">
          <p className="text-2xl font-bold text-green-600">{presentRecords}</p>
          <p className="text-xs text-[#5A7A99] mt-1">出勤次数</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#D1DDE8] text-center">
          <p className="text-2xl font-bold text-[#F59E0B]">{rate}%</p>
          <p className="text-xs text-[#5A7A99] mt-1">出勤率</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('active')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'active' ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#5A7A99] border border-[#D1DDE8] hover:bg-[#F0F4F8]'
            }`}
          >
            进行中 {activeSessions.length > 0 && `(${activeSessions.length})`}
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'history' ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#5A7A99] border border-[#D1DDE8] hover:bg-[#F0F4F8]'
            }`}
          >
            历史记录
          </button>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A9F] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          发起签到
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Active Sessions */}
      {!loading && tab === 'active' && (
        <div className="space-y-3">
          {activeSessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#D1DDE8] p-12 text-center">
              <p className="text-4xl mb-3">✔️</p>
              <p className="text-[#5A7A99] text-sm">暂无进行中的签到任务</p>
              <button onClick={() => setShowCreateForm(true)} className="mt-3 text-[#2D6A9F] text-sm font-medium hover:underline">发起签到</button>
            </div>
          ) : (
            activeSessions.map(session => {
              const timeLeft = getTimeLeft(session.endTime);
              const sessionRecords = records.filter(r => r.sessionId === session.id);
              return (
                <div key={session.id} className="bg-[#1E3A5F] rounded-2xl p-5 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-[#F59E0B] rounded-full animate-pulse" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">签到进行中</p>
                    </div>
                    <p className="text-lg font-bold mb-1">{session.courseName}</p>
                    <p className="text-sm text-white/70 mb-1">开始：{formatTime(session.startTime)}</p>
                    {timeLeft && (
                      <p className="text-sm text-white/70 mb-4">剩余时间：<span className="text-[#F59E0B] font-bold text-lg">{timeLeft}</span></p>
                    )}
                    <p className="text-xs text-white/60 mb-4">已签到 {sessionRecords.length} 人</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleCheckin(session)}
                        disabled={checkinLoading === session.id}
                        className="flex-1 py-2.5 bg-[#F59E0B] hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        {checkinLoading === session.id ? '签到中...' : '立即签到'}
                      </button>
                      <button
                        onClick={() => handleCloseSession(session.id)}
                        className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        关闭任务
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* History */}
      {!loading && tab === 'history' && (
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#D1DDE8] p-12 text-center">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-[#5A7A99] text-sm">暂无签到记录</p>
            </div>
          ) : (
            records.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-[#D1DDE8] p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  r.status === 'present' ? 'bg-green-100' : r.status === 'late' ? 'bg-orange-100' : 'bg-red-100'
                }`}>
                  <svg className={`w-5 h-5 ${
                    r.status === 'present' ? 'text-green-600' : r.status === 'late' ? 'text-orange-500' : 'text-red-500'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0F1F33]">{r.courseName}</p>
                  <p className="text-xs text-[#5A7A99]">{formatTime(r.checkinTime)}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  r.status === 'present' ? 'bg-green-100 text-green-700' :
                  r.status === 'late' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {r.status === 'present' ? '出勤' : r.status === 'late' ? '迟到' : '缺勤'}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-[#D1DDE8] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F1F33]">发起签到任务</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-[#5A7A99] hover:text-[#0F1F33]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">选择课程 *</label>
                <select
                  className="w-full px-3 py-2 border border-[#D1DDE8] rounded-xl text-sm focus:outline-none focus:border-[#2D6A9F] bg-white"
                  value={createForm.courseId}
                  onChange={e => {
                    const c = courses.find(c => c.id === e.target.value);
                    setCreateForm(f => ({ ...f, courseId: e.target.value, courseName: c?.name ?? '' }));
                  }}
                >
                  <option value="">选择课程</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A7A99] mb-1">签到时长（分钟）</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 30].map(m => (
                    <button
                      key={m}
                      onClick={() => setCreateForm(f => ({ ...f, durationMinutes: m }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        createForm.durationMinutes === m
                          ? 'bg-[#1E3A5F] text-white'
                          : 'bg-[#F0F4F8] text-[#5A7A99] hover:bg-[#D1DDE8]'
                      }`}
                    >
                      {m}分钟
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#D1DDE8] flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm font-semibold text-[#5A7A99] hover:bg-[#F0F4F8] rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateSession}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold bg-[#1E3A5F] text-white rounded-xl hover:bg-[#2D6A9F] transition-colors disabled:opacity-50"
              >
                {saving ? '发起中...' : '发起签到'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
