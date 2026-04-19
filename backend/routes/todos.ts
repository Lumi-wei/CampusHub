import { Router, Request, Response } from 'express';
import { todosRepository } from '../repositories/todos';
import { notificationsRepository } from '../repositories/notifications';
import { insertTodoSchema } from '../db/schema';
import { ApiResponse, Todo } from '../../shared/types/api';

const router = Router();

const mapTodo = (t: any): Todo => ({
  id: t.id,
  title: t.title,
  description: t.description,
  priority: t.priority as 'low' | 'medium' | 'high',
  status: t.status as 'pending' | 'completed',
  dueDate: t.dueDate instanceof Date ? t.dueDate.toISOString() : t.dueDate ?? null,
  courseId: t.courseId ?? null,
  courseName: t.courseName ?? null,
  createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await todosRepository.getAll();
    res.json({ success: true, data: data.map(mapTodo) } as ApiResponse<Todo[]>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch todos' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = insertTodoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, data: null, message: parsed.error.message });
    }
    const t = await todosRepository.create(parsed.data);
    if (t.dueDate) {
      await notificationsRepository.create({
        type: 'todo',
        title: '待办事项提醒',
        body: `${t.title} 截止日期：${new Date(t.dueDate).toLocaleDateString('zh-CN')}`,
        relatedId: t.id,
      });
    }
    res.status(201).json({ success: true, data: mapTodo(t) } as ApiResponse<Todo>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to create todo' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = insertTodoSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, data: null, message: parsed.error.message });
    }
    const t = await todosRepository.update(id, parsed.data);
    if (!t) return res.status(404).json({ success: false, data: null, message: 'Todo not found' });
    res.json({ success: true, data: mapTodo(t) } as ApiResponse<Todo>);
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to update todo' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const ok = await todosRepository.delete(id);
    if (!ok) return res.status(404).json({ success: false, data: null, message: 'Todo not found' });
    res.json({ success: true, data: null });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to delete todo' });
  }
});

export default router;
