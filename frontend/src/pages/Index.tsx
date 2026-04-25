import { useState, useEffect, useCallback } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import OmniflowBadge from '@/components/custom/OmniflowBadge';
import ScheduleView from '@/components/custom/ScheduleView';
import AssignmentsView from '@/components/custom/AssignmentsView';
import CheckinView from '@/components/custom/CheckinView';
import TodosView from '@/components/custom/TodosView';
import NotificationsView from '@/components/custom/NotificationsView';
import { Skeleton, SkeletonBanner, SkeletonCard, SkeletonFeatureCard } from '@/components/ui/skeleton';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { DashboardStats, Notification } from '@shared/types/api';

type View = 'dashboard' | 'schedule' | 'assignments' | 'checkin' | 'todos' | 'notifications';

const NAV_ITEMS: { id: View; label: string; icon: JSX.Element; badge?: number }[] = [
  {
    id: 'dashboard',
    label: '总览',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'schedule',
    label: '课程表',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'assignments',
    label: '作业通知',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'checkin',
    label: '签到提醒',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'todos',
    label: '待办事项',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: '消息中心',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

const TODAY = new Date();
const DATE_STR = TODAY.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

export default function Index() {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [userName, setUserName] = useState('用户');
  const [userEmail, setUserEmail] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const fetchUserInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setUserName(data.data.name || '用户');
        setUserEmail(data.data.email || '');
      }
    } catch {
      // ignore
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiService.getStats();
      if (res.success) setStats(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiService.getNotifications();
      if (res.success) setNotifications(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    fetchUserInfo();
  }, [fetchStats, fetchNotifications, fetchUserInfo]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItemsWithBadge = NAV_ITEMS.map(item => {
    if (item.id === 'assignments' && stats) return { ...item, badge: stats.pendingAssignments };
    if (item.id === 'notifications') return { ...item, badge: unreadCount };
    return item;
  });

  const navigate = (v: View) => {
    setView(v);
    setMobileOpen(false);
  };

  const handleEditName = () => {
    setNewName(userName);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (newName.trim()) {
      try {
        const response = await apiService.updateProfile({ name: newName.trim() });
        if (response.success) {
          setUserName(newName.trim());
          toast.success('昵称已更新');
        } else {
          toast.error(response.message || '更新失败');
        }
      } catch (error) {
        toast.error('更新失败，请稍后重试');
      }
    }
    setEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setNewName('');
  };

  return (
    <div className="flex min-h-screen bg-[#F0F4F8]">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#1E3A5F] min-h-screen fixed left-0 top-0 z-30">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">CampusHub</p>
              <p className="text-white/50 text-xs">校园信息整合</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItemsWithBadge.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                view === item.id
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-[#F59E0B] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          {editingName ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-white/10 text-white border border-white/20 focus:outline-none focus:border-white/40"
                placeholder="输入昵称"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  className="flex-1 py-1.5 bg-[#F59E0B] text-white rounded-lg text-xs font-medium hover:bg-amber-500"
                >
                  保存
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 py-1.5 bg-white/10 text-white rounded-lg text-xs font-medium hover:bg-white/20"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors" onClick={handleEditName}>
              <div className="w-9 h-9 rounded-full bg-[#2D6A9F] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{userName}</p>
                <p className="text-white/50 text-xs truncate">{userEmail || '点击编辑昵称'}</p>
              </div>
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-[#1E3A5F] z-50 transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm">CampusHub</p>
              <p className="text-white/50 text-xs">校园信息整合</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-white/70 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItemsWithBadge.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                view === item.id
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-[#F59E0B] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          {editingName ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-white/10 text-white border border-white/20 focus:outline-none focus:border-white/40"
                placeholder="输入昵称"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  className="flex-1 py-1.5 bg-[#F59E0B] text-white rounded-lg text-xs font-medium hover:bg-amber-500"
                >
                  保存
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 py-1.5 bg-white/10 text-white rounded-lg text-xs font-medium hover:bg-white/20"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors" onClick={handleEditName}>
              <div className="w-9 h-9 rounded-full bg-[#2D6A9F] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{userName}</p>
                <p className="text-white/50 text-xs truncate">{userEmail || '点击编辑昵称'}</p>
              </div>
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-[#D1DDE8] sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-[#F0F4F8] transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="打开菜单"
              >
                <svg className="w-5 h-5 text-[#0F1F33]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-bold text-[#0F1F33]">
                  {navItemsWithBadge.find(n => n.id === view)?.label ?? '总览'}
                </h1>
                <p className="text-xs text-[#5A7A99]">{DATE_STR}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('notifications')}
                className="relative p-2 rounded-xl hover:bg-[#F0F4F8] transition-colors"
                aria-label="通知"
              >
                <svg className="w-5 h-5 text-[#5A7A99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          {view === 'dashboard' && (
            <DashboardView
              stats={stats}
              loading={loadingStats}
              onNavigate={navigate}
              onRefresh={() => { fetchStats(); fetchNotifications(); }}
              userName={userName}
            />
          )}
          {view === 'schedule' && <ScheduleView onRefresh={fetchStats} />}
          {view === 'assignments' && <AssignmentsView onRefresh={fetchStats} />}
          {view === 'checkin' && <CheckinView onRefresh={fetchStats} />}
          {view === 'todos' && <TodosView onRefresh={fetchStats} />}
          {view === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onRefresh={() => { fetchNotifications(); fetchStats(); }}
            />
          )}
        </main>
      </div>

      <OmniflowBadge />
      <Toaster richColors position="top-right" />
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────
function DashboardView({
  stats,
  loading,
  onNavigate,
  onRefresh,
  userName,
}: {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigate: (v: View) => void;
  onRefresh: () => void;
  userName: string;
}) {
  const statCards = [
    {
      label: '今日课程',
      value: loading ? '-' : String(stats?.todayCourses ?? 0),
      sub: stats?.nextCourseTime ? `下一节 ${stats.nextCourseTime}` : '今日无课',
      color: 'text-[#1E3A5F]',
      bg: 'bg-blue-50',
      iconColor: 'text-[#2D6A9F]',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      onClick: () => onNavigate('schedule'),
    },
    {
      label: '待提交作业',
      value: loading ? '-' : String(stats?.pendingAssignments ?? 0),
      sub: stats?.nearestDueDate ? `最近截止 ${new Date(stats.nearestDueDate).toLocaleDateString('zh-CN')}` : '暂无待提交',
      color: 'text-red-600',
      bg: 'bg-red-50',
      iconColor: 'text-red-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      onClick: () => onNavigate('assignments'),
    },
    {
      label: '本周签到率',
      value: loading ? '-' : `${stats?.checkinRate ?? 0}%`,
      sub: stats ? `${stats.checkinPresent}/${stats.checkinTotal} 次` : '暂无记录',
      color: 'text-green-600',
      bg: 'bg-green-50',
      iconColor: 'text-green-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => onNavigate('checkin'),
    },
    {
      label: '待办事项',
      value: loading ? '-' : String(stats?.pendingTodos ?? 0),
      sub: stats?.todayDueTodos ? `${stats.todayDueTodos} 项今日到期` : '暂无待办',
      color: 'text-[#F59E0B]',
      bg: 'bg-amber-50',
      iconColor: 'text-[#F59E0B]',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      onClick: () => onNavigate('todos'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-[#D1DDE8] shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <Skeleton width="80px" height="10px" className="mb-3" />
                    <Skeleton width="60px" height="32px" className="mb-2" />
                    <Skeleton width="120px" height="12px" />
                  </div>
                  <Skeleton width="40px" height="40px" rounded />
                </div>
              </div>
            ))}
          </>
        ) : (
          statCards.map(card => (
            <button
              key={card.label}
              onClick={card.onClick}
              className="bg-white rounded-2xl p-5 border border-[#D1DDE8] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 text-left w-full"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5A7A99] mb-1 truncate">{card.label}</p>
                  <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-[#5A7A99] mt-1 leading-tight">{card.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0 ml-2`}>
                  <span className={card.iconColor}>{card.icon}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Welcome Banner */}
        {loading ? (
          <SkeletonBanner />
        ) : (
        <div className="lg:col-span-2 bg-[#1E3A5F] rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
          <div className="relative">
            <h2 className="text-xl font-bold mb-1">你好，{userName} 👋</h2>
            <p className="text-white/70 text-sm mb-4">今天是 {DATE_STR}，祝你学习顺利！</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('schedule')}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-medium transition-colors"
              >
                查看课程表
              </button>
              <button
                onClick={() => onNavigate('assignments')}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-amber-500 rounded-xl text-sm font-medium text-white transition-colors"
              >
                查看作业
              </button>
              <button
                onClick={() => onNavigate('checkin')}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-medium transition-colors"
              >
                签到管理
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Quick Nav Cards */}
        <div className="space-y-3">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              {[
                { label: '课程表管理', sub: '查看和编辑课程安排', view: 'schedule' as View, color: 'bg-blue-50', icon: '📅' },
                { label: '待办事项', sub: '管理个人任务清单', view: 'todos' as View, color: 'bg-amber-50', icon: '✅' },
                { label: '消息中心', sub: '查看所有通知消息', view: 'notifications' as View, color: 'bg-purple-50', icon: '🔔' },
              ].map(item => (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className={`w-full ${item.color} rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-all duration-200 text-left border border-[#D1DDE8]`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#0F1F33]">{item.label}</p>
                    <p className="text-xs text-[#5A7A99]">{item.sub}</p>
                  </div>
                  <svg className="w-4 h-4 text-[#5A7A99] ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonFeatureCard />
            <SkeletonFeatureCard />
            <SkeletonFeatureCard />
            <SkeletonFeatureCard />
          </>
        ) : (
          <>
            {[
              {
                title: '课程表管理',
                desc: '导入或手动录入课程，支持日视图和周视图切换',
                icon: '📚',
                view: 'schedule' as View,
                accent: '#2D6A9F',
              },
              {
                title: '作业通知',
                desc: '追踪作业截止日期，标记完成状态，不遗漏任何提交',
                icon: '📝',
                view: 'assignments' as View,
                accent: '#DC2626',
              },
              {
                title: '签到提醒',
                desc: '发起签到任务，记录出勤状态，查看历史签到记录',
                icon: '✔️',
            view: 'checkin' as View,
            accent: '#16A34A',
          },
          {
            title: '待办事项',
            desc: '创建个人任务，设置优先级和截止日期，联动课程',
            icon: '🗂️',
            view: 'todos' as View,
            accent: '#D97706',
          },
        ].map(item => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className="bg-white rounded-2xl p-5 border border-[#D1DDE8] shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-left"
          >
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="text-sm font-bold text-[#0F1F33] mb-1">{item.title}</h3>
            <p className="text-xs text-[#5A7A99] leading-relaxed">{item.desc}</p>
            <div className="mt-3 flex items-center gap-1" style={{ color: item.accent }}>
              <span className="text-xs font-semibold">进入功能</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
          </>
        )}
      </div>
    </div>
  );
}
