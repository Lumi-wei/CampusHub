import { eq } from 'drizzle-orm';
import { db } from '../db';
import { todos, InsertTodo } from '../db/schema';
import { z } from 'zod';
import { insertTodoSchema } from '../db/schema';

export const todosRepository = {
  async getAll() {
    return db.select().from(todos).orderBy(todos.createdAt);
  },

  async getById(id: string) {
    const result = await db.select().from(todos).where(eq(todos.id, id));
    return result[0] ?? null;
  },

  async create(data: z.infer<typeof insertTodoSchema>) {
    const result = await db.insert(todos).values(data as InsertTodo).returning();
    return result[0];
  },

  async update(id: string, data: Partial<z.infer<typeof insertTodoSchema>>) {
    const result = await db.update(todos).set(data as Partial<InsertTodo>).where(eq(todos.id, id)).returning();
    return result[0] ?? null;
  },

  async delete(id: string) {
    const result = await db.delete(todos).where(eq(todos.id, id)).returning();
    return result.length > 0;
  },
};
