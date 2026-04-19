import { useState } from 'react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import type { Notification, NotificationType } from '@shared/types/api';

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: string; color: string; bg: string }> = {
  assignment: { label: '作业', icon: '📝', color: 'text-red-600', bg: 'bg-red-50' },
  checkin: { label: '签到', icon: '✔️', color: 'text-green-600', bg: 'bg-green-50' },
  todo: { label: '待办', icon: '🗂️', color: 'text-amber-600', bg: 'bg-amber-50' },
  course: { label: '课程', icon: '📚', color: 'text-blue-600', bg: 'bg-blue-50' },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export default function NotificationsView({
  notifications,
  onRefresh,
}: {
  notifications: Notification[];
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [loading, setLoading] = useState<string | null>(null);

  const handleMarkRead = async (id: string) => {
    setLoading(id);
    try {
      const res = await apiService.markNotificationRead(id);
      if (res.success) {
        onRefresh();
      }
    } catch {
      toast.error('操作失败');
    } finally {
      setLoading(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      toast.success('已全部标记为已读');
      onRefresh();
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiService.deleteNotification(id);
      if (res.success) {
        toast.success('通知已删除');
        onRefresh();
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
              filter === 'all' ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#5A7A99] border border-[#D1DDE8] hover:bg-[#F0F4F8]'
            }`}
          >
            全部 ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
              filter === 'unread' ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#5A7A99] border border-[#D1DDE8] hover:bg-[#F0F4F8]'
            }`}
          >
            未读 ({unreadCount})
          </button>
          {(['assignment', 'checkin', 'todo', 'course'] as NotificationType[]).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                filter === t ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#5A7A99] border border-[#D1DDE8] hover:bg-[#F0F4F8]'
              }`}
            >
              {TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm font-semibold text-[#2D6A9F] hover:underline whitespace-nowrap"
          >
            全部标记已读
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#D1DDE8] p-12 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-[#5A7A99] text-sm">暂无通知消息</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(n => {
            const tc = TYPE_CONFIG[n.type];
            return (
              <div
                key={n.id}
                className={`bg-white rounded-2xl border border-[#D1DDE8] p-4 shadow-sm transition-all duration-200 ${
                  !n.isRead ? 'border-[#2D6A9F]/30 bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${tc.bg} flex items-center justify-center flex-shrink-0 text-lg`}>
                    {tc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#0F1F33]">{n.title}</p>
                          {!n.isRead && (
                            <span className="w-2 h-2 bg-[#2D6A9F] rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[#5A7A99] mt-0.5 leading-relaxed">{n.body}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            disabled={loading === n.id}
                            className="text-xs text-[#2D6A9F] font-semibold hover:underline disabled:opacity-50"
                          >
                            标记已读
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="text-[#5A7A99] hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tc.bg} ${tc.color}`}>
                        {tc.label}
                      </span>
                      <span className="text-xs text-[#5A7A99]">{formatTime(n.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notification Preferences Info */}
      <div className="bg-white rounded-2xl border border-[#D1DDE8] p-5">
        <h3 className="text-sm font-bold text-[#0F1F33] mb-3">🔔 通知偏好设置</h3>
        <p className="text-xs text-[#5A7A99] mb-4">系统会在以下情况自动发送通知：</p>
        <div className="space-y-2">
          {[
            { icon: '📝', label: '作业发布时', desc: '收到新作业通知' },
            { icon: '✔️', label: '签到开始时', desc: '课程签到任务发起' },
            { icon: '⏰', label: '待办即将到期', desc: '待办事项截止日期提醒' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 py-2">
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#0F1F33]">{item.label}</p>
                <p className="text-xs text-[#5A7A99]">{item.desc}</p>
              </div>
              <div className="w-8 h-4 bg-[#1E3A5F] rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
