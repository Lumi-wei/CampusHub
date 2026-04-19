import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { notifications, InsertNotification } from '../db/schema';

export const notificationsRepository = {
  async getAll() {
    return db.select().from(notifications).orderBy(desc(notifications.createdAt));
  },

  async markRead(id: string) {
    const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return result[0] ?? null;
  },

  async markAllRead() {
    await db.update(notifications).set({ isRead: true });
  },

  async create(data: Omit<InsertNotification, 'id' | 'createdAt' | 'isRead'>) {
    const result = await db.insert(notifications).values(data as InsertNotification).returning();
    return result[0];
  },

  async delete(id: string) {
    const result = await db.delete(notifications).where(eq(notifications.id, id)).returning();
    return result.length > 0;
  },
};
