import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUrl, isGoogleConnected } from "@/lib/google-calendar";

export default async function GoogleCalendarSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const connected = await isGoogleConnected();
  const authUrl = getAuthUrl();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <a
            href="/"
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:underline"
          >
            ← Back to board
          </a>
        </div>

        <h1 className="text-lg font-semibold mb-1">Google Calendar</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Connect an agency Google account to create calendar events and send
          invites when you schedule pitch meetings.
        </p>

        {params.connected === "true" && (
          <div className="mb-4 px-4 py-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-300">
            Google Calendar connected successfully.
          </div>
        )}

        {params.error && (
          <div className="mb-4 px-4 py-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-300">
            {decodeURIComponent(params.error)}
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                connected ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            />
            <span className="text-sm font-medium">
              {connected ? "Connected" : "Not connected"}
            </span>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {connected
              ? "Pitch meetings will be created in the connected Google Calendar. All team members and the client will receive calendar invites with a Google Meet link."
              : "Connect a Google account to enable automatic calendar invites when scheduling pitch meetings."}
          </p>

          <a
            href={authUrl}
            className="inline-block px-4 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90"
          >
            {connected ? "Reconnect Google Account" : "Connect Google Account"}
          </a>
        </div>

        <div className="mt-4 px-4 py-3 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            <strong className="text-zinc-700 dark:text-zinc-300">Tip:</strong>{" "}
            Use your agency Google account (not a personal one) so meeting
            invites come from a professional address. After connecting, all team
            members will be automatically included as attendees on every meeting.
          </p>
        </div>
      </div>
    </div>
  );
}
