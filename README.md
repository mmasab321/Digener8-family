# Degener8 Family

Internal web-based operating system for Degener8. Category-driven, modular, and scalable.

## Features

- **Auth**: Login / Signup, role-based access (Admin, Manager, Contributor, Viewer)
- **Dashboard**: Customizable widgets, task summary, metrics snapshot, recent activity, announcements, quick actions. Filter by category.
- **Metrics (KPI Engine)**: Admin-defined metrics with name, category, value type (Number/Percentage/Currency), frequency (Daily/Weekly/Monthly), optional target. Log entries; trend and target indicators.
- **Tasks**: Kanban (Backlog, To Do, In Progress, Review, Done). Assignee, category, priority, deadline, optional related metric. Filter by user/category/priority.
- **Pipeline**: Generic CRM. Admin creates pipelines with custom stages. Items have title, assignee, value, category, notes. Drag between stages.
- **Communication**: Category-based channels. Send messages; file attachment placeholder for future.
- **SOP Vault**: Documents with title, category, author, tags, rich text (markdown). Search and filter.
- **Settings (Admin)**: Manage users (assign role), create/edit categories. Metrics and pipelines are managed from their own modules.

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS, dark theme
- Prisma + SQLite (default; can switch to PostgreSQL via `DATABASE_URL`)
- NextAuth.js (credentials)

## Setup

```bash
npm install
cp .env.example .env   # or use the provided .env
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up or use the seeded admin:

- **Email:** admin@degener8.com  
- **Password:** admin123  

## Environment

- `DATABASE_URL` – Prisma connection (e.g. `file:./dev.db` or PostgreSQL URL)
- `NEXTAUTH_SECRET` – Random string for session signing
- `NEXTAUTH_URL` – App URL (e.g. `http://localhost:3000`)

## Design Principles

- **Category-driven**: All modules tag by category. Admin creates categories in Settings; no hardcoded niches (e.g. no built-in "YouTube" or "Agency").
- **Configurable**: Metrics, pipelines, and channels are created by admins. The system scales as Degener8 evolves.
