"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EmailTemplate, TemplateCategory } from "@/lib/types";

const VALID_CATEGORIES: TemplateCategory[] = [
  "cold",
  "warm_followup",
  "followup",
  "recap",
  "confirmation",
  "other",
];

function strOrNull(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function getTemplates(): Promise<{ templates?: EmailTemplate[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("category")
    .order("name");
  if (error) return { error: error.message };
  return { templates: (data ?? []) as EmailTemplate[] };
}

export async function createTemplate(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = strOrNull(formData, "name");
  if (!name) return { error: "Name is required" };

  const subject = strOrNull(formData, "subject") ?? "";
  const body = strOrNull(formData, "body") ?? "";
  const categoryRaw = strOrNull(formData, "category") ?? "other";
  const category = (VALID_CATEGORIES.includes(categoryRaw as TemplateCategory)
    ? categoryRaw
    : "other") as TemplateCategory;

  const { data, error } = await supabase
    .from("email_templates")
    .insert({ name, subject, body, category })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/templates");
  return { ok: true, template: data as EmailTemplate };
}

export async function updateTemplate(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = strOrNull(formData, "name");
  if (!name) return { error: "Name is required" };

  const subject = strOrNull(formData, "subject") ?? "";
  const body = strOrNull(formData, "body") ?? "";
  const categoryRaw = strOrNull(formData, "category") ?? "other";
  const category = (VALID_CATEGORIES.includes(categoryRaw as TemplateCategory)
    ? categoryRaw
    : "other") as TemplateCategory;

  const { data, error } = await supabase
    .from("email_templates")
    .update({ name, subject, body, category, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/templates");
  return { ok: true, template: data as EmailTemplate };
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("email_templates").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/templates");
  return { ok: true };
}

const DEFAULT_TEMPLATES: Omit<EmailTemplate, "id" | "created_at" | "updated_at">[] = [
  {
    name: "Cold Outreach",
    category: "cold",
    subject: "Quick question about {{business_name}}'s website",
    body: `Hi {{contact_name}},

I was passing by {{business_name}} recently and noticed you might benefit from a stronger online presence.

My team builds clean, professional websites for local Davis businesses starting at $500. We handle everything from design to launch, typically in about a week.

Would you be open to a quick 15-minute call to see if it's a fit?

Best,
[Your name]`,
  },
  {
    name: "Warm In-Person Follow-up",
    category: "warm_followup",
    subject: "Great meeting you at {{business_name}}!",
    body: `Hi {{contact_name}},

It was great stopping by {{business_name}} today and chatting with you.

As I mentioned, we build websites for local businesses here in Davis — clean, fast, and affordable. I'd love to put together a quick mockup to show you what we're thinking.

Would you be up for a 15-minute call this week?

Looking forward to it,
[Your name]`,
  },
  {
    name: "Follow-up",
    category: "followup",
    subject: "Following up — {{business_name}} website",
    body: `Hi {{contact_name}},

Just circling back on my previous message. I know things get busy!

We're still building sites for a few local Davis businesses this month and would love to include {{business_name}} if the timing works.

Even a 10-minute call would help. What does your schedule look like?

Best,
[Your name]`,
  },
  {
    name: "Post-Discovery Recap",
    category: "recap",
    subject: "Recap from our call — {{business_name}}",
    body: `Hi {{contact_name}},

Thanks for taking the time to chat today! Here's a quick recap of what we discussed:

- [Main goals for the website]
- [Key pages / features]
- [Timeline and budget]

Next step: I'll put together a proposal and mockup for you to review. Expect it within [X days].

Feel free to reply with any questions!

Best,
[Your name]`,
  },
  {
    name: "Pitch Meeting Confirmation",
    category: "confirmation",
    subject: "Confirmed: {{business_name}} × Davis Web Agency",
    body: `Hi {{contact_name}},

Just confirming our meeting:

Date: [Date]
Time: [Time]
Location: [Location or Zoom link]

We'll walk you through our proposal and mockup for {{business_name}}. Looking forward to it!

Best,
[Your name]`,
  },
];

export async function seedDefaultTemplates() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { count } = await supabase
    .from("email_templates")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) > 0) return { ok: true, skipped: true };

  const { error } = await supabase.from("email_templates").insert(DEFAULT_TEMPLATES);
  if (error) return { error: error.message };

  revalidatePath("/templates");
  return { ok: true };
}
