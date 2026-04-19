import { Router, Request, Response } from 'express';
import { coursesRepository } from '../repositories/courses';
import { assignmentsRepository } from '../repositories/assignments';
import { checkinsRepository } from '../repositories/checkins';
import { todosRepository } from '../repositories/todos';
import { notificationsRepository } from '../repositories/notifications';
import { ApiResponse, DashboardStats } from '../../shared/types/api';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todayStr = today.toDateString();

    const [allCourses, allAssignments, allRecords, allTodos, allNotifications] = await Promise.all([
      coursesRepository.getAll(),
      assignmentsRepository.getAll(),
      checkinsRepository.getAllRecords(),
      todosRepository.getAll(),
      notificationsRepository.getAll(),
    ]);

    const todayCourses = allCourses.filter(c => c.dayOfWeek === dayOfWeek);
    const nowTime = today.getHours() * 60 + today.getMinutes();
    const nextCourse = todayCourses
      .filter(c => {
        const [h, m] = c.startTime.split(':').map(Number);
        return h * 60 + m > nowTime;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

    const pendingAssignments = allAssignments.filter(a => a.status === 'pending');
    const nearestDue = pendingAssignments.length > 0
      ? pendingAssignments.reduce((a, b) => new Date(a.dueDate) < new Date(b.dueDate) ? a : b)
      : null;

    const checkinTotal = allRecords.length;
    const checkinPresent = allRecords.filter(r => r.status === 'present').length;
    const checkinRate = checkinTotal > 0 ? Math.round((checkinPresent / checkinTotal) * 100) : 0;

    const pendingTodos = allTodos.filter(t => t.status === 'pending');
    const todayDueTodos = pendingTodos.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === todayStr).length;
    const unreadNotifications = allNotifications.filter(n => !n.isRead).length;

    const stats: DashboardStats = {
      todayCourses: todayCourses.length,
      nextCourseTime: nextCourse ? nextCourse.startTime : null,
      pendingAssignments: pendingAssignments.length,
      nearestDueDate: nearestDue ? (nearestDue.dueDate instanceof Date ? nearestDue.dueDate.toISOString() : nearestDue.dueDate) : null,
      checkinRate,
      checkinTotal,
      checkinPresent,
      pendingTodos: pendingTodos.length,
      todayDueTodos,
      unreadNotifications,
    };

    res.json({ success: true, data: stats } as ApiResponse<DashboardStats>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch stats' });
  }
});

export default router;
