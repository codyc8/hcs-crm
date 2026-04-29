"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCalendarEvent } from "@/lib/google-calendar";
import type { CalendarEvent } from "@/lib/types";

export async function scheduleMeeting(businessId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = (formData.get("title") as string | null)?.trim();
  if (!title) return { error: "Meeting title is required" };

  const scheduledAt = formData.get("scheduled_at") as string | null;
  if (!scheduledAt) return { error: "Date and time are required" };

  const startTime = new Date(scheduledAt);
  if (isNaN(startTime.getTime())) return { error: "Invalid date or time" };

  const durationMinutes = parseInt(
    (formData.get("duration_minutes") as string) || "30",
    10
  );

  // Selected team emails from the checklist
  const selectedTeamEmails = formData.getAll("team_email") as string[];

  // Fetch the business for client info
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("name, contact_name, contact_email")
    .eq("id", businessId)
    .single();

  if (bizError || !business) return { error: "Business not found" };
  if (!business.contact_email) {
    return { error: "Add a contact email to this business before scheduling" };
  }

  // Fetch profiles to resolve names for selected team emails
  const adminSupabase = createAdminClient();
  const { data: profiles } = await adminSupabase
    .from("profiles")
    .select("email, name");

  const profileByEmail = new Map(
    (profiles ?? []).map((p) => [p.email, p.name])
  );

  const teamAttendees = selectedTeamEmails
    .filter((email) => profileByEmail.has(email))
    .map((email) => ({ email, name: profileByEmail.get(email) ?? undefined }));

  // Always include the person who scheduled the meeting
  const { data: schedulerProfile } = await adminSupabase
    .from("profiles")
    .select("email, name")
    .eq("user_id", user.id)
    .single();

  const schedulerEmail = schedulerProfile?.email;
  const alreadyIncluded = teamAttendees.some((a) => a.email === schedulerEmail);
  if (schedulerEmail && !alreadyIncluded) {
    teamAttendees.push({
      email: schedulerEmail,
      name: schedulerProfile?.name ?? undefined,
    });
  }

  const clientAttendee = {
    email: business.contact_email,
    name: business.contact_name ?? undefined,
  };

  const allAttendees = [clientAttendee, ...teamAttendees];

  let googleEventId: string | null = null;
  let meetLink: string | null = null;

  try {
    const result = await createCalendarEvent({
      title,
      startTime,
      durationMinutes,
      attendees: allAttendees,
      description: `Pitch meeting for ${business.name}`,
    });
    googleEventId = result.googleEventId;
    meetLink = result.meetLink;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Google Calendar error";
    return { error: msg };
  }

  const { data: event, error: insertError } = await supabase
    .from("calendar_events")
    .insert({
      business_id: businessId,
      google_event_id: googleEventId,
      title,
      scheduled_at: startTime.toISOString(),
      duration_minutes: durationMinutes,
      attendees: allAttendees,
      meet_link: meetLink,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) return { error: insertError.message };

  await supabase.from("activity_log").insert({
    business_id: businessId,
    author_id: user.id,
    event_type: "meeting_scheduled",
    notes: `${title} on ${startTime.toLocaleDateString()}`,
  });

  revalidatePath("/");
  return { ok: true, event: event as CalendarEvent };
}

export async function getCalendarEvents(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("business_id", businessId)
    .order("scheduled_at", { ascending: false });

  if (error) return { error: error.message };
  return { ok: true, events: (data ?? []) as CalendarEvent[] };
}
