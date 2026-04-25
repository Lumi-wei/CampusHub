export interface Course {
  id: string;
  title: string;
  code: string;
  instructor: string;
  schedule: string;
  location: string;
  credits: number;
  createdAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'late';
  createdAt: string;
}

export interface Checkin {
  id: string;
  courseId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  createdAt: string;
}

export interface Todo {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  courseId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'assignment' | 'checkin' | 'course' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Stats {
  totalCourses: number;
  totalAssignments: number;
  completedAssignments: number;
  totalCheckins: number;
  attendanceRate: number;
  upcomingDeadlines: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  } | null;
  message?: string;
}
