-- Google Calendar integration

-- Client email on businesses (needed to invite client to calendar events)
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS contact_email text;

-- Key-value settings table (stores Google OAuth refresh token)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enrich calendar_events for display and email content
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS meet_link text;
-- google_event_id already exists — will be populated after Google Calendar API call
