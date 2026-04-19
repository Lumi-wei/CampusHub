import { eq } from 'drizzle-orm';
import { db } from '../db';
import { assignments, InsertAssignment } from '../db/schema';
import { z } from 'zod';
import { insertAssignmentSchema } from '../db/schema';

export const assignmentsRepository = {
  async getAll() {
    return db.select().from(assignments).orderBy(assignments.dueDate);
  },

  async getById(id: string) {
    const result = await db.select().from(assignments).where(eq(assignments.id, id));
    return result[0] ?? null;
  },

  async create(data: z.infer<typeof insertAssignmentSchema>) {
    const result = await db.insert(assignments).values(data as InsertAssignment).returning();
    return result[0];
  },

  async updateStatus(id: string, status: 'pending' | 'completed') {
    const result = await db.update(assignments).set({ status }).where(eq(assignments.id, id)).returning();
    return result[0] ?? null;
  },

  async delete(id: string) {
    const result = await db.delete(assignments).where(eq(assignments.id, id)).returning();
    return result.length > 0;
  },
};
