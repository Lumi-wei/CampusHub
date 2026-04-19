-- CampusHub initial migration

CREATE TABLE IF NOT EXISTS "courses" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "teacher" text NOT NULL,
  "location" text NOT NULL,
  "day_of_week" integer NOT NULL,
  "start_time" text NOT NULL,
  "end_time" text NOT NULL,
  "color" text NOT NULL DEFAULT 'blue',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "assignments" (
  "id" text PRIMARY KEY,
  "course_id" text NOT NULL,
  "course_name" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "due_date" timestamp NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "checkin_sessions" (
  "id" text PRIMARY KEY,
  "course_id" text NOT NULL,
  "course_name" text NOT NULL,
  "start_time" timestamp NOT NULL DEFAULT now(),
  "end_time" timestamp NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "checkin_records" (
  "id" text PRIMARY KEY,
  "session_id" text NOT NULL,
  "course_name" text NOT NULL,
  "checkin_time" timestamp NOT NULL DEFAULT now(),
  "status" text NOT NULL DEFAULT 'present'
);

CREATE TABLE IF NOT EXISTS "todos" (
  "id" text PRIMARY KEY,
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "priority" text NOT NULL DEFAULT 'medium',
  "status" text NOT NULL DEFAULT 'pending',
  "due_date" timestamp,
  "course_id" text,
  "course_name" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" text PRIMARY KEY,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL DEFAULT '',
  "is_read" boolean NOT NULL DEFAULT false,
  "related_id" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
