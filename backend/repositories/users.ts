import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, InsertUser } from '../db/schema';
import { z } from 'zod';
import { insertUserSchema } from '../db/schema';

export const usersRepository = {
  async getAll() {
    return db.select().from(users);
  },

  async getById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] ?? null;
  },

  async getByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] ?? null;
  },

  async create(data: z.infer<typeof insertUserSchema>) {
    const result = await db.insert(users).values(data as InsertUser).returning();
    return result[0];
  },

  async update(id: string, data: Partial<z.infer<typeof insertUserSchema>>) {
    const result = await db.update(users).set(data as Partial<InsertUser>).where(eq(users.id, id)).returning();
    return result[0] ?? null;
  },

  async delete(id: string) {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  },
};
