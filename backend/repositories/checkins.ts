import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { checkinSessions, checkinRecords, InsertCheckinSession, InsertCheckinRecord } from '../db/schema';

export const checkinsRepository = {
  async getAllSessions() {
    return db.select().from(checkinSessions).orderBy(desc(checkinSessions.createdAt));
  },

  async getActiveSessions() {
    return db.select().from(checkinSessions).where(eq(checkinSessions.isActive, true));
  },

  async createSession(courseId: string, courseName: string, durationMinutes: number) {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    const result = await db.insert(checkinSessions).values({
      courseId,
      courseName,
      startTime,
      endTime,
      isActive: true,
    } as InsertCheckinSession).returning();
    return result[0];
  },

  async closeSession(id: string) {
    const result = await db.update(checkinSessions).set({ isActive: false }).where(eq(checkinSessions.id, id)).returning();
    return result[0] ?? null;
  },

  async getAllRecords() {
    return db.select().from(checkinRecords).orderBy(desc(checkinRecords.checkinTime));
  },

  async createRecord(sessionId: string, courseName: string, status: string = 'present') {
    const result = await db.insert(checkinRecords).values({
      sessionId,
      courseName,
      status,
    } as InsertCheckinRecord).returning();
    return result[0];
  },

  async getRecordsBySession(sessionId: string) {
    return db.select().from(checkinRecords).where(eq(checkinRecords.sessionId, sessionId));
  },
};
