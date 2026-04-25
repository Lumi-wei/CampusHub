import { Router, Request, Response } from 'express';
import { checkinsRepository } from '../repositories/checkins';
import { notificationsRepository } from '../repositories/notifications';
import { ApiResponse, CheckinSession, CheckinRecord } from '../../shared/types/api';

const router = Router();

const mapSession = (s: any): CheckinSession => ({
  id: s.id,
  courseId: s.courseId,
  courseName: s.courseName,
  startTime: s.startTime instanceof Date ? s.startTime.toISOString() : s.startTime,
  endTime: s.endTime instanceof Date ? s.endTime.toISOString() : s.endTime,
  isActive: s.isActive,
  createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
});

const mapRecord = (r: any): CheckinRecord => ({
  id: r.id,
  sessionId: r.sessionId,
  courseName: r.courseName,
  checkinTime: r.checkinTime instanceof Date ? r.checkinTime.toISOString() : r.checkinTime,
  status: r.status as 'present' | 'absent' | 'late',
});

router.get('/sessions', async (_req: Request, res: Response) => {
  try {
    const data = await checkinsRepository.getAllSessions();
    res.json({ success: true, data: data.map(mapSession) } as ApiResponse<CheckinSession[]>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch sessions' });
  }
});

router.get('/sessions/active', async (_req: Request, res: Response) => {
  try {
    const data = await checkinsRepository.getActiveSessions();
    res.json({ success: true, data: data.map(mapSession) } as ApiResponse<CheckinSession[]>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch active sessions' });
  }
});

router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { courseId, courseName, durationMinutes } = req.body as { courseId: string; courseName: string; durationMinutes: number };
    if (!courseId || !courseName || !durationMinutes) {
      return res.status(400).json({ success: false, data: null, message: 'Missing required fields' });
    }
    const s = await checkinsRepository.createSession(courseId, courseName, durationMinutes);
    await notificationsRepository.create({
      type: 'checkin',
      title: '签到提醒',
      body: `${courseName} 签到已开始，请在 ${durationMinutes} 分钟内完成签到`,
      relatedId: s.id,
    });
    res.status(201).json({ success: true, data: mapSession(s) } as ApiResponse<CheckinSession>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to create session' });
  }
});

router.patch('/sessions/:id/close', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const s = await checkinsRepository.closeSession(id);
    if (!s) return res.status(404).json({ success: false, data: null, message: 'Session not found' });
    res.json({ success: true, data: mapSession(s) } as ApiResponse<CheckinSession>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to close session' });
  }
});

router.get('/records', async (_req: Request, res: Response) => {
  try {
    const data = await checkinsRepository.getAllRecords();
    res.json({ success: true, data: data.map(mapRecord) } as ApiResponse<CheckinRecord[]>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch records' });
  }
});

router.post('/records', async (req: Request, res: Response) => {
  try {
    const { sessionId, courseName, status } = req.body as { sessionId: string; courseName: string; status?: string };
    if (!sessionId || !courseName) {
      return res.status(400).json({ success: false, data: null, message: 'Missing required fields' });
    }
    const validStatuses = ['present', 'absent', 'late'];
    const recordStatus = (status && validStatuses.includes(status)) ? status : 'present';
    const r = await checkinsRepository.createRecord(sessionId, courseName, recordStatus);
    res.status(201).json({ success: true, data: mapRecord(r) } as ApiResponse<CheckinRecord>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to create record' });
  }
});

export default router;
