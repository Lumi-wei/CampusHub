import { Router, Request, Response } from 'express';
import { coursesRepository } from '../repositories/courses';
import { insertCourseSchema } from '../db/schema';
import { ApiResponse, Course } from '../../shared/types/api';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await coursesRepository.getAll();
    const courses: Course[] = data.map(c => ({
      id: c.id,
      name: c.name,
      teacher: c.teacher,
      location: c.location,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      color: c.color,
      createdAt: c.createdAt.toISOString(),
    }));
    res.json({ success: true, data: courses } as ApiResponse<Course[]>);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch courses' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = insertCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, data: null, message: parsed.error.message });
    }
    const c = await coursesRepository.create(parsed.data);
    const course: Course = {
      id: c.id,
      name: c.name,
      teacher: c.teacher,
      location: c.location,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      color: c.color,
      createdAt: c.createdAt.toISOString(),
    };
    // Create notification
    res.status(201).json({ success: true, data: course } as ApiResponse<Course>);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to create course' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = insertCourseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, data: null, message: parsed.error.message });
    }
    const c = await coursesRepository.update(id, parsed.data);
    if (!c) return res.status(404).json({ success: false, data: null, message: 'Course not found' });
    const course: Course = {
      id: c.id,
      name: c.name,
      teacher: c.teacher,
      location: c.location,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      color: c.color,
      createdAt: c.createdAt.toISOString(),
    };
    res.json({ success: true, data: course } as ApiResponse<Course>);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to update course' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const ok = await coursesRepository.delete(id);
    if (!ok) return res.status(404).json({ success: false, data: null, message: 'Course not found' });
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to delete course' });
  }
});

export default router;
