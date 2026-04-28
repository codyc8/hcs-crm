# HCS Dashboard

Internal CRM for Davis Web Agency. Drag-and-drop kanban pipeline for cold outreach to clients.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth) · dnd-kit · Vercel

## Local setup

```bash
npm install
cp .env.example .env.local
# fill in Supabase URL + anon key + service_role key
npm run dev
```

Open http://localhost:3000.

## Supabase setup

1. Create project at supabase.com (region us-west-1).
2. In SQL editor, run migrations in order: `supabase/migrations/0001_init.sql`, then `0002_rls.sql`.
3. Insert allowlisted emails:
   ```sql
   insert into public.allowed_emails (email) values
     ('cody@example.com'),
     ('cofounder1@example.com'),
     ('cofounder2@example.com');
   ```
4. Auth → Providers → Email → enable magic link, set Site URL to your Vercel URL.

## Pipeline columns

Cold Outreach → Outreached → Interested → Pitch Meeting Scheduled → Closed Won → Closed Lost.

## Roadmap

- **v1** (current): kanban, cards, activity log, manual assignment, visual aging, CSV import, quick-add.
- **v2**: email template system, Google Calendar integration for pitch meetings.
- **v3**: realtime sync, per-founder analytics, file attachments, AI scraping.
