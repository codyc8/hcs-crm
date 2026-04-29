import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase/admin";

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
}

export async function exchangeCodeForTokens(
  code: string
): Promise<{ refresh_token: string }> {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      "No refresh token returned. Revoke app access in Google account settings and try again."
    );
  }
  return { refresh_token: tokens.refresh_token };
}

async function getCalendarClient() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "google_refresh_token")
    .single();

  if (error || !data) {
    throw new Error("Google Calendar not connected. Go to Settings to connect.");
  }

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: data.value });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function isGoogleConnected(): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key")
    .eq("key", "google_refresh_token")
    .single();
  return !!data;
}

export async function storeRefreshToken(refreshToken: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("app_settings").upsert({
    key: "google_refresh_token",
    value: refreshToken,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

type CreateEventInput = {
  title: string;
  startTime: Date;
  durationMinutes: number;
  attendees: { email: string; name?: string }[];
  description?: string;
};

type CreatedEvent = {
  googleEventId: string;
  meetLink: string | null;
};

export async function createCalendarEvent(
  input: CreateEventInput
): Promise<CreatedEvent> {
  const calendar = await getCalendarClient();

  const endTime = new Date(
    input.startTime.getTime() + input.durationMinutes * 60 * 1000
  );

  const { data: event } = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: input.title,
      description: input.description,
      start: { dateTime: input.startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      attendees: input.attendees.map((a) => ({
        email: a.email,
        displayName: a.name,
      })),
      conferenceData: {
        createRequest: {
          requestId: `hcs-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 },
        ],
      },
    },
  });

  const meetLink =
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")
      ?.uri ?? null;

  return {
    googleEventId: event.id!,
    meetLink,
  };
}
