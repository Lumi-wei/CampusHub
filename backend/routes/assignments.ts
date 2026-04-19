import { Router, Request, Response } from 'express';
import { assignmentsRepository } from '../repositories/assignments';
import { notificationsRepository } from '../repositories/notifications';
import { insertAssignmentSchema } from '../db/schema';
import { ApiResponse, Assignment } from '../../shared/types/api';

const router = Router();

const mapAssignment = (a: any): Assignment => ({
  id: a.id,
  courseId: a.courseId,
  courseName: a.courseName,
  title: a.title,
  description: a.description,
  dueDate: a.dueDate instanceof Date ? a.dueDate.toISOString() : a.dueDate,
  status: a.status as 'pending' | 'completed',
  createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await assignmentsRepository.getAll();
    res.json({ success: true, data: data.map(mapAssignment) } as ApiResponse<Assignment[]>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch assignments' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = insertAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, data: null, message: parsed.error.message });
    }
    const a = await assignmentsRepository.create(parsed.data);
    await notificationsRepository.create({
      type: 'assignment',
      title: '新作业通知',
      body: `${a.courseName} - ${a.title} 已发布，截止日期：${new Date(a.dueDate).toLocaleDateString('zh-CN')}`,
      relatedId: a.id,
    });
    res.status(201).json({ success: true, data: mapAssignment(a) } as ApiResponse<Assignment>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to create assignment' });
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body as { status: 'pending' | 'completed' };
    const a = await assignmentsRepository.updateStatus(id, status);
    if (!a) return res.status(404).json({ success: false, data: null, message: 'Assignment not found' });
    res.json({ success: true, data: mapAssignment(a) } as ApiResponse<Assignment>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to update assignment' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const ok = await assignmentsRepository.delete(id);
    if (!ok) return res.status(404).json({ success: false, data: null, message: 'Assignment not found' });
    res.json({ success: true, data: null });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to delete assignment' });
  }
});

export default router;
