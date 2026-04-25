import { 
  Course, 
  Assignment, 
  Todo, 
  Notification, 
  ApiResponse,
  DashboardStats,
  CheckinSession,
  CheckinRecord,
  User,
  LoginRequest,
  LoginResponse
} from '../../../shared/types/api';

interface ApiService {
  // Auth
  login: (data: LoginRequest) => Promise<LoginResponse>;
  register: (data: { email: string; password: string; name: string }) => Promise<LoginResponse>;
  forgotPassword: (email: string) => Promise<ApiResponse<null>>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<ApiResponse<null>>;
  validateToken: () => Promise<ApiResponse<User | null>>;
  logout: () => Promise<ApiResponse<null>>;
  updateProfile: (data: { name: string }) => Promise<ApiResponse<User>>;

  // Courses
  getCourses: () => Promise<ApiResponse<Course[]>>;
  getCourse: (id: string) => Promise<ApiResponse<Course>>;
  createCourse: (course: any) => Promise<ApiResponse<Course>>;
  updateCourse: (id: string, course: any) => Promise<ApiResponse<Course>>;
  deleteCourse: (id: string) => Promise<ApiResponse<void>>;

  // Assignments
  getAssignments: () => Promise<ApiResponse<Assignment[]>>;
  getAssignment: (id: string) => Promise<ApiResponse<Assignment>>;
  createAssignment: (assignment: any) => Promise<ApiResponse<Assignment>>;
  updateAssignment: (id: string, assignment: any) => Promise<ApiResponse<Assignment>>;
  updateAssignmentStatus: (id: string, status: string) => Promise<ApiResponse<Assignment>>;
  deleteAssignment: (id: string) => Promise<ApiResponse<void>>;

  // Checkins
  getCheckinSessions: () => Promise<ApiResponse<CheckinSession[]>>;
  getCheckinRecords: () => Promise<ApiResponse<CheckinRecord[]>>;
  createCheckinSession: (session: any) => Promise<ApiResponse<CheckinSession>>;
  createCheckinRecord: (record: any) => Promise<ApiResponse<CheckinRecord>>;
  closeCheckinSession: (id: string) => Promise<ApiResponse<CheckinSession>>;

  // Todos
  getTodos: () => Promise<ApiResponse<Todo[]>>;
  getTodo: (id: string) => Promise<ApiResponse<Todo>>;
  createTodo: (todo: any) => Promise<ApiResponse<Todo>>;
  updateTodo: (id: string, todo: any) => Promise<ApiResponse<Todo>>;
  deleteTodo: (id: string) => Promise<ApiResponse<void>>;

  // Notifications
  getNotifications: () => Promise<ApiResponse<Notification[]>>;
  markAsRead: (id: string) => Promise<ApiResponse<Notification>>;
  markNotificationRead: (id: string) => Promise<ApiResponse<Notification>>;
  markAllNotificationsRead: () => Promise<ApiResponse<null>>;
  deleteNotification: (id: string) => Promise<ApiResponse<null>>;

  // Stats
  getStats: () => Promise<ApiResponse<DashboardStats>>;
}

// Request retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function requestWithRetry<T>(
  url: string, 
  options: RequestInit = {}, 
  retries = MAX_RETRIES
): Promise<T> {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.hash = '#/login';
      throw new Error('登录已过期，请重新登录');
    }

    // Handle 5xx Server Errors - retry
    if (response.status >= 500 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return requestWithRetry<T>(url, options, retries - 1);
    }

    const data = await response.json();
    
    // Ensure return format matches frontend expectations
    if (Array.isArray(data)) {
      return {
        success: true,
        data: data,
        message: ''
      } as unknown as T;
    }
    return data as T;
  } catch (error) {
    // Network error - retry
    if (retries > 0 && !(error instanceof Error && error.message.includes('登录已过期'))) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return requestWithRetry<T>(url, options, retries - 1);
    }
    throw error;
  }
}

function request<T>(url: string, options: RequestInit = {}) {
  return requestWithRetry<T>(url, options);
}

export const apiService: ApiService = {
  // Auth
  login: (data) => request<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request<LoginResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email) => request<ApiResponse<null>>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (resetToken, newPassword) => request<ApiResponse<null>>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ resetToken, newPassword }) }),
  validateToken: () => request<ApiResponse<User | null>>('/api/auth/validate', { method: 'POST' }),
  logout: () => request<ApiResponse<null>>('/api/auth/logout', { method: 'POST' }),
  updateProfile: (data) => request<ApiResponse<User>>('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Courses
  getCourses: () => request<ApiResponse<Course[]>>('/api/courses'),
  getCourse: (id) => request<ApiResponse<Course>>(`/api/courses/${id}`),
  createCourse: (course) => request<ApiResponse<Course>>('/api/courses', { method: 'POST', body: JSON.stringify(course) }),
  updateCourse: (id, course) => request<ApiResponse<Course>>(`/api/courses/${id}`, { method: 'PUT', body: JSON.stringify(course) }),
  deleteCourse: (id) => request<ApiResponse<void>>(`/api/courses/${id}`, { method: 'DELETE' }),

  // Assignments
  getAssignments: () => request<ApiResponse<Assignment[]>>('/api/assignments'),
  getAssignment: (id) => request<ApiResponse<Assignment>>(`/api/assignments/${id}`),
  createAssignment: (assignment) => request<ApiResponse<Assignment>>('/api/assignments', { method: 'POST', body: JSON.stringify(assignment) }),
  updateAssignment: (id, assignment) => request<ApiResponse<Assignment>>(`/api/assignments/${id}`, { method: 'PUT', body: JSON.stringify(assignment) }),
  updateAssignmentStatus: (id, status) => request<ApiResponse<Assignment>>(`/api/assignments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteAssignment: (id) => request<ApiResponse<void>>(`/api/assignments/${id}`, { method: 'DELETE' }),

  // Checkins
  getCheckinSessions: () => request<ApiResponse<CheckinSession[]>>('/api/checkins/sessions'),
  getCheckinRecords: () => request<ApiResponse<CheckinRecord[]>>('/api/checkins/records'),
  createCheckinSession: (session) => request<ApiResponse<CheckinSession>>('/api/checkins/sessions', { method: 'POST', body: JSON.stringify(session) }),
  createCheckinRecord: (record) => request<ApiResponse<CheckinRecord>>('/api/checkins/records', { method: 'POST', body: JSON.stringify(record) }),
  closeCheckinSession: (id) => request<ApiResponse<CheckinSession>>(`/api/checkins/sessions/${id}/close`, { method: 'PUT' }),

  // Todos
  getTodos: () => request<ApiResponse<Todo[]>>('/api/todos'),
  getTodo: (id) => request<ApiResponse<Todo>>(`/api/todos/${id}`),
  createTodo: (todo) => request<ApiResponse<Todo>>('/api/todos', { method: 'POST', body: JSON.stringify(todo) }),
  updateTodo: (id, todo) => request<ApiResponse<Todo>>(`/api/todos/${id}`, { method: 'PUT', body: JSON.stringify(todo) }),
  deleteTodo: (id) => request<ApiResponse<void>>(`/api/todos/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => request<ApiResponse<Notification[]>>('/api/notifications'),
  markAsRead: (id) => request<ApiResponse<Notification>>(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markNotificationRead: (id) => request<ApiResponse<Notification>>(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<ApiResponse<null>>('/api/notifications/read-all', { method: 'PUT' }),
  deleteNotification: (id) => request<ApiResponse<null>>(`/api/notifications/${id}`, { method: 'DELETE' }),

  // Stats
  getStats: () => request<ApiResponse<DashboardStats>>('/api/stats'),
};