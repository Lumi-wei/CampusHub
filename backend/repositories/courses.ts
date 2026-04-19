import { eq } from 'drizzle-orm';
import { db } from '../db';
import { courses, InsertCourse } from '../db/schema';
import { z } from 'zod';
import { insertCourseSchema } from '../db/schema';

export const coursesRepository = {
  async getAll() {
    return db.select().from(courses).orderBy(courses.dayOfWeek, courses.startTime);
  },

  async getById(id: string) {
    const result = await db.select().from(courses).where(eq(courses.id, id));
    return result[0] ?? null;
  },

  async create(data: z.infer<typeof insertCourseSchema>) {
    const result = await db.insert(courses).values(data as InsertCourse).returning();
    return result[0];
  },

  async update(id: string, data: Partial<z.infer<typeof insertCourseSchema>>) {
    const result = await db.update(courses).set(data as Partial<InsertCourse>).where(eq(courses.id, id)).returning();
    return result[0] ?? null;
  },

  async delete(id: string) {
    const result = await db.delete(courses).where(eq(courses.id, id)).returning();
    return result.length > 0;
  },
};
