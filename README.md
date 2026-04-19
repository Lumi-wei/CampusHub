# CampusHub - 校园信息整合系统

A full-stack campus information management system that consolidates course schedules, assignments, check-ins, todos, and notifications into a single platform.

## Project Structure

```
.
├── backend/
│   ├── config/
│   │   └── constants.ts          # Server config
│   ├── db/
│   │   ├── index.ts              # Drizzle DB connection (postgres.js)
│   │   ├── schema.ts             # All table definitions + Zod schemas
│   │   └── migrations/
│   │       └── 1774143070052_init_campus_hub.sql
│   ├── middleware/
│   │   └── errorHandler.ts
│   ├── repositories/
│   │   ├── courses.ts
│   │   ├── assignments.ts
│   │   ├── checkins.ts
│   │   ├── todos.ts
│   │   └── notifications.ts
│   ├── routes/
│   │   ├── courses.ts            # GET/POST/PUT/DELETE /api/courses
│   │   ├── assignments.ts        # GET/POST/PATCH/DELETE /api/assignments
│   │   ├── checkins.ts           # Sessions + Records /api/checkins
│   │   ├── todos.ts              # GET/POST/PUT/DELETE /api/todos
│   │   ├── notifications.ts      # GET/PATCH/DELETE /api/notifications
│   │   └── stats.ts              # GET /api/stats (dashboard aggregation)
│   └── server.ts                 # Express entry point
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── custom/
│       │   │   ├── ScheduleView.tsx      # Course schedule (day/week view)
│       │   │   ├── AssignmentsView.tsx   # Assignment management
│       │   │   ├── CheckinView.tsx       # Check-in sessions + history
│       │   │   ├── TodosView.tsx         # Todo management
│       │   │   └── NotificationsView.tsx # Notification center
│       │   └── ui/               # shadcn/ui components
│       ├── lib/
│       │   └── api.ts            # All API service methods
│       ├── config/
│       │   └── constants.ts      # API_BASE_URL
│       └── pages/
│           └── Index.tsx         # Main app shell + dashboard + navigation
└── shared/
    └── types/
        └── api.ts                # Shared TypeScript types (frontend + backend)
```

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, shadcn/ui, React Router (HashRouter)
- **Backend**: Express.js, TypeScript, Drizzle ORM, postgres.js
- **Database**: PostgreSQL
- **Styling**: Campus Clarity design system (navy #1E3A5F, amber #F59E0B)

## Key Features

1. **Dashboard** - Stats overview with today's courses, pending assignments, check-in rate, todos
2. **Course Schedule** - Day/week view, add/edit/delete courses with color labels
3. **Assignments** - Create, filter, mark complete, delete assignments with due date tracking
4. **Check-in** - Launch timed check-in sessions, record attendance, view history
5. **Todos** - Priority-based todo management with course linking and due dates
6. **Notifications** - Unified notification center with read/unread management

## API Endpoints

- `GET/POST /api/courses` - Course management
- `GET/POST/PATCH/DELETE /api/assignments` - Assignment management
- `GET/POST /api/checkins/sessions` - Check-in session management
- `GET/POST /api/checkins/records` - Check-in record management
- `GET/POST/PUT/DELETE /api/todos` - Todo management
- `GET/PATCH/DELETE /api/notifications` - Notification management
- `GET /api/stats` - Dashboard statistics aggregation

## Code Generation Guidelines

- All shared types in `shared/types/api.ts` - import with `@shared/types/api` in frontend
- Repository methods accept `z.infer<typeof insertXSchema>` types
- Type assertions (`as InsertX`) only in repository `.values()` calls
- No authentication - all routes are public
- Navigation state managed in `Index.tsx` via `useState<View>`
- All modals are inline in view components (no separate modal files)
