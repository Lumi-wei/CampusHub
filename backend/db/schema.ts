import { pgTable, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Courses
export const courses = pgTable('courses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  teacher: text('teacher').notNull(),
  location: text('location').notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  color: text('color').notNull().default('blue'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;
export const insertCourseSchema = createInsertSchema(courses, {
  name: z.string().min(1),
  teacher: z.string().min(1),
  location: z.string().min(1),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  color: z.string().min(1),
  id: z.string().optional(),
  createdAt: z.date().optional(),
}).omit({ id: true, createdAt: true } as const);

// Assignments
export const assignments = pgTable('assignments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text('course_id').notNull(),
  courseName: text('course_name').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  dueDate: timestamp('due_date').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;
export const insertAssignmentSchema = createInsertSchema(assignments, {
  courseId: z.string().min(1),
  courseName: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  dueDate: z.coerce.date(),
  status: z.enum(['pending', 'completed']).default('pending'),
  id: z.string().optional(),
  createdAt: z.date().optional(),
}).omit({ id: true, createdAt: true } as const);

// Checkin Sessions
export const checkinSessions = pgTable('checkin_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text('course_id').notNull(),
  courseName: text('course_name').notNull(),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export type CheckinSession = typeof checkinSessions.$inferSelect;
export type InsertCheckinSession = typeof checkinSessions.$inferInsert;

// Checkin Records
export const checkinRecords = pgTable('checkin_records', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull(),
  courseName: text('course_name').notNull(),
  checkinTime: timestamp('checkin_time').defaultNow().notNull(),
  status: text('status').notNull().default('present'),
});
export type CheckinRecord = typeof checkinRecords.$inferSelect;
export type InsertCheckinRecord = typeof checkinRecords.$inferInsert;

// Todos
export const todos = pgTable('todos', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  priority: text('priority').notNull().default('medium'),
  status: text('status').notNull().default('pending'),
  dueDate: timestamp('due_date'),
  courseId: text('course_id'),
  courseName: text('course_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export type Todo = typeof todos.$inferSelect;
export type InsertTodo = typeof todos.$inferInsert;
export const insertTodoSchema = createInsertSchema(todos, {
  title: z.string().min(1),
  description: z.string().default(''),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['pending', 'completed']).default('pending'),
  dueDate: z.coerce.date().nullable().optional(),
  courseId: z.string().nullable().optional(),
  courseName: z.string().nullable().optional(),
  id: z.string().optional(),
  createdAt: z.date().optional(),
}).omit({ id: true, createdAt: true } as const);

// Notifications
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  isRead: boolean('is_read').notNull().default(false),
  relatedId: text('related_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export type DbNotification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export const insertNotificationSchema = createInsertSchema(notifications, {
  type: z.enum(['assignment', 'checkin', 'todo', 'course']),
  title: z.string().min(1),
  body: z.string().default(''),
  relatedId: z.string().nullable().optional(),
  id: z.string().optional(),
  createdAt: z.date().optional(),
  isRead: z.boolean().optional(),
}).omit({ id: true, createdAt: true, isRead: true } as const);
