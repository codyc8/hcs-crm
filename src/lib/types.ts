export type ColumnId =
  | "cold"
  | "outreached"
  | "interested"
  | "scheduled"
  | "won"
  | "lost";

export const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: "cold", label: "Cold Outreach" },
  { id: "outreached", label: "Outreached" },
  { id: "interested", label: "Interested" },
  { id: "scheduled", label: "Pitch Meeting Scheduled" },
  { id: "won", label: "Closed Won" },
  { id: "lost", label: "Closed Lost" },
];

export type Vertical =
  | "restaurant"
  | "salon"
  | "barbershop"
  | "contractor"
  | "retail"
  | "fitness"
  | "other";

export const VERTICAL_LABELS: Record<Vertical, string> = {
  restaurant: "Restaurant",
  salon: "Salon",
  barbershop: "Barbershop",
  contractor: "Contractor",
  retail: "Retail",
  fitness: "Fitness",
  other: "Other",
};

export type Source =
  | "walk_in"
  | "email"
  | "ig_dm"
  | "warm_intro"
  | "scraped"
  | "other";

export type Profile = {
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

export type Business = {
  id: string;
  name: string;
  vertical: Vertical;
  address: string | null;
  phone: string | null;
  summary: string | null;
  contact_name: string | null;
  contact_relationship: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  source: Source | null;
  status: ColumnId;
  assigned_to: string | null;
  custom_site_url: string | null;
  last_activity_at: string;
  created_at: string;
  created_by: string;
};

export type ActivityEventType =
  | "outreach_sent"
  | "response_received"
  | "call_held"
  | "meeting_scheduled"
  | "meeting_held"
  | "won"
  | "lost"
  | "note";

export type ActivityEntry = {
  id: string;
  business_id: string;
  author_id: string;
  event_type: ActivityEventType;
  channel: Source | null;
  template_id: string | null;
  notes: string | null;
  created_at: string;
};

export type TemplateCategory =
  | "cold"
  | "warm_followup"
  | "followup"
  | "recap"
  | "confirmation"
  | "other";

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  cold: "Cold Outreach",
  warm_followup: "Warm In-Person",
  followup: "Follow-up",
  recap: "Post-Discovery Recap",
  confirmation: "Meeting Confirmation",
  other: "Other",
};

export const TEMPLATE_VARIABLES = [
  "{{business_name}}",
  "{{contact_name}}",
  "{{vertical}}",
  "{{address}}",
  "{{phone}}",
] as const;

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: TemplateCategory;
  created_at: string;
  updated_at: string;
};

export type CalendarEvent = {
  id: string;
  business_id: string;
  google_event_id: string | null;
  title: string | null;
  scheduled_at: string;
  duration_minutes: number;
  attendees: { email: string; name?: string }[];
  meet_link: string | null;
  created_by: string;
  created_at: string;
};
