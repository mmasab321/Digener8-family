# Degener8 Family

Internal web-based operating system for Degener8. Category-driven, modular, and scalable.

## Features

- **Auth**: Login / Signup, role-based access (Admin, Manager, Contributor, Viewer)
- **Dashboard**: Customizable widgets, task summary, metrics snapshot, recent activity, announcements, quick actions. Filter by category.
- **Metrics (KPI Engine)**: Admin-defined metrics with name, category, value type (Number/Percentage/Currency), frequency (Daily/Weekly/Monthly), optional target. Log entries; trend and target indicators.
- **Tasks**: Kanban (Backlog, To Do, In Progress, Review, Done). Assignee, category, priority, deadline, optional related metric. Filter by user/category/priority. You can delete tasks from the edit page. Opening a task that was assigned to you in the last 2 minutes plays a notification sound (if `public/notification.mp3` is present).
- **Pipeline**: Generic CRM. Admin creates pipelines with custom stages. Items have title, assignee, value, category, notes. Drag between stages.
- **Communication**: Category-based channels. Send messages; file attachment placeholder for future. When someone @mentions you in a channel, a notification sound plays (if `public/notification.mp3` is present).
- **SOP Vault**: Documents with title, category, author, tags, rich text (markdown). Search and filter.
- **Settings (Admin)**: Manage users (assign role), create/edit categories. Metrics and pipelines are managed from their own modules.

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS, dark theme
- Prisma + PostgreSQL (production); use `DATABASE_URL` for connection
- NextAuth.js (credentials)

## Setup (local)

```bash
npm install
cp .env.example .env   # set DATABASE_URL to your PostgreSQL URL (e.g. Render Postgres or local)
npx prisma generate
npx prisma migrate deploy   # or npx prisma db push for a fresh local DB
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up or use the seeded admin:

- **Email:** admin@degener8.com  
- **Password:** admin123  

## Environment

- `DATABASE_URL` – PostgreSQL connection string (required). Use your Render Postgres URL in production; for local dev use the same or a local Postgres instance.
- `NEXTAUTH_SECRET` – Random string for session signing
- `NEXTAUTH_URL` – App URL (e.g. `http://localhost:3000` or `https://your-app.onrender.com`)

**Optional:** Place a sound file at `public/notification.mp3` to hear a sound when you are @mentioned in a channel message or when you open a task that was recently assigned to you.

## Deploying on Render (PostgreSQL)

1. **Environment**: Set `DATABASE_URL` to your Render Postgres **internal** URL, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` (e.g. `https://your-app.onrender.com`).
2. **Build command**: `npm install && npx prisma migrate deploy && npm run build`  
   Migrations run during build; no data is wiped. The first deploy applies `prisma/migrations/20260216000000_init_postgres`.
3. **Start command**: `npm start`  
   The app does not run migrations or seed on startup.
4. **Seed (one-time, no Shell needed)**: On a fresh database with **no users**, open **https://your-app.onrender.com/seed** (or **/api/seed**) in the browser. It will create the default admin and categories. Then log in as **admin@degener8.com** / **admin123**. (If you already have users, use Sign up or log in.)
5. **If you get 500 when sending messages**: (a) Ensure the build command above ran so `prisma migrate deploy` created the `Message` table. (b) Use the **internal** Postgres URL from Render (not the external one). (c) If you see connection errors in logs, append `?sslmode=require` to `DATABASE_URL`.

## Design Principles

- **Category-driven**: All modules tag by category. Admin creates categories in Settings; no hardcoded niches (e.g. no built-in "YouTube" or "Agency").
- **Configurable**: Metrics, pipelines, and channels are created by admins. The system scales as Degener8 evolves.
