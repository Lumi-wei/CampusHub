// Shared API types — single source of truth for frontend ↔ backend contracts.

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Course / Schedule
export interface Course {
  id: string;
  name: string;
  teacher: string;
  location: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  color: string;
  createdAt: string;
}
export interface CreateCourseRequest {
  name: string;
  teacher: string;
  location: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  color: string;
}

// Assignment
export type AssignmentStatus = 'pending' | 'completed';
export interface Assignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  dueDate: string;
  status: AssignmentStatus;
  createdAt: string;
}
export interface CreateAssignmentRequest {
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  dueDate: string;
}

// Check-in
export type CheckinStatus = 'present' | 'absent' | 'late';
export interface CheckinSession {
  id: string;
  courseId: string;
  courseName: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
}
export interface CheckinRecord {
  id: string;
  sessionId: string;
  courseName: string;
  checkinTime: string;
  status: CheckinStatus;
}
export interface CreateCheckinSessionRequest {
  courseId: string;
  courseName: string;
  durationMinutes: number;
}

// Todo
export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoStatus = 'pending' | 'completed';
export interface Todo {
  id: string;
  title: string;
  description: string;
  priority: TodoPriority;
  status: TodoStatus;
  dueDate: string | null;
  courseId: string | null;
  courseName: string | null;
  createdAt: string;
}
export interface CreateTodoRequest {
  title: string;
  description: string;
  priority: TodoPriority;
  dueDate: string | null;
  courseId: string | null;
  courseName: string | null;
}

// Notification
export type NotificationType = 'assignment' | 'checkin' | 'todo' | 'course';
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}

// Stats
export interface DashboardStats {
  todayCourses: number;
  nextCourseTime: string | null;
  pendingAssignments: number;
  nearestDueDate: string | null;
  checkinRate: number;
  checkinTotal: number;
  checkinPresent: number;
  pendingTodos: number;
  todayDueTodos: number;
  unreadNotifications: number;
}
