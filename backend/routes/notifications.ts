import { Router, Request, Response } from 'express';
import { notificationsRepository } from '../repositories/notifications';
import { ApiResponse, Notification } from '../../shared/types/api';

const router = Router();

const mapNotification = (n: any): Notification => ({
  id: n.id,
  type: n.type as 'assignment' | 'checkin' | 'todo' | 'course',
  title: n.title,
  body: n.body,
  isRead: n.isRead,
  relatedId: n.relatedId ?? null,
  createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await notificationsRepository.getAll();
    res.json({ success: true, data: data.map(mapNotification) } as ApiResponse<Notification[]>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch notifications' });
  }
});

router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const n = await notificationsRepository.markRead(id);
    if (!n) return res.status(404).json({ success: false, data: null, message: 'Notification not found' });
    res.json({ success: true, data: mapNotification(n) } as ApiResponse<Notification>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to mark notification as read' });
  }
});

router.patch('/read-all', async (_req: Request, res: Response) => {
  try {
    await notificationsRepository.markAllRead();
    res.json({ success: true, data: null });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to mark all as read' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const ok = await notificationsRepository.delete(id);
    if (!ok) return res.status(404).json({ success: false, data: null, message: 'Notification not found' });
    res.json({ success: true, data: null });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to delete notification' });
  }
});

export default router;
