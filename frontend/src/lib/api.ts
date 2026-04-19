import { API_BASE_URL } from '@/config/constants';
import type {
  ApiResponse,
  Course, CreateCourseRequest,
  Assignment, CreateAssignmentRequest,
  CheckinSession, CheckinRecord, CreateCheckinSessionRequest,
  Todo, CreateTodoRequest,
  Notification,
  DashboardStats,
} from '@shared/types/api';

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json() as Promise<ApiResponse<T>>;
}

export const apiService = {
  // Stats
  getStats: () => request<DashboardStats>('/api/stats'),

  // Courses
  getCourses: () => request<Course[]>('/api/courses'),
  createCourse: (data: CreateCourseRequest) =>
    request<Course>('/api/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id: string, data: Partial<CreateCourseRequest>) =>
    request<Course>(`/api/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id: string) =>
    request<null>(`/api/courses/${id}`, { method: 'DELETE' }),

  // Assignments
  getAssignments: () => request<Assignment[]>('/api/assignments'),
  createAssignment: (data: CreateAssignmentRequest) =>
    request<Assignment>('/api/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignmentStatus: (id: string, status: 'pending' | 'completed') =>
    request<Assignment>(`/api/assignments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteAssignment: (id: string) =>
    request<null>(`/api/assignments/${id}`, { method: 'DELETE' }),

  // Checkins
  getCheckinSessions: () => request<CheckinSession[]>('/api/checkins/sessions'),
  getActiveCheckinSessions: () => request<CheckinSession[]>('/api/checkins/sessions/active'),
  createCheckinSession: (data: CreateCheckinSessionRequest) =>
    request<CheckinSession>('/api/checkins/sessions', { method: 'POST', body: JSON.stringify(data) }),
  closeCheckinSession: (id: string) =>
    request<CheckinSession>(`/api/checkins/sessions/${id}/close`, { method: 'PATCH' }),
  getCheckinRecords: () => request<CheckinRecord[]>('/api/checkins/records'),
  createCheckinRecord: (sessionId: string, courseName: string, status?: string) =>
    request<CheckinRecord>('/api/checkins/records', { method: 'POST', body: JSON.stringify({ sessionId, courseName, status }) }),

  // Todos
  getTodos: () => request<Todo[]>('/api/todos'),
  createTodo: (data: CreateTodoRequest) =>
    request<Todo>('/api/todos', { method: 'POST', body: JSON.stringify(data) }),
  updateTodo: (id: string, data: Partial<CreateTodoRequest & { status: string }>) =>
    request<Todo>(`/api/todos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTodo: (id: string) =>
    request<null>(`/api/todos/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => request<Notification[]>('/api/notifications'),
  markNotificationRead: (id: string) =>
    request<Notification>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<null>('/api/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (id: string) =>
    request<null>(`/api/notifications/${id}`, { method: 'DELETE' }),
};
