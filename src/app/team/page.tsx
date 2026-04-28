import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TeamForm } from "./team-form";

type AllowedEmail = { email: string; added_at: string };
type Profile = { user_id: string; email: string; is_admin: boolean };

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: allowedRaw } = await admin
    .from("allowed_emails")
    .select("email, added_at")
    .order("added_at", { ascending: true });
  const allowed = (allowedRaw ?? []) as AllowedEmail[];

  const { data: profilesRaw } = await admin
    .from("profiles")
    .select("user_id, email, is_admin");
  const profiles = (profilesRaw ?? []) as Profile[];
  const activeEmails = new Set(profiles.map((p) => p.email));
  const adminEmails = new Set(profiles.filter((p) => p.is_admin).map((p) => p.email));
  const currentIsAdmin = profiles.some(
    (p) => p.user_id === user?.id && p.is_admin
  );

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← Board
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <h1 className="text-base font-semibold tracking-tight">Team</h1>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {user?.email}
        </span>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-8">
        {currentIsAdmin ? (
          <section>
            <h2 className="text-sm font-semibold mb-2">Invite a teammate</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              They&apos;ll get an email to set a password and join the dashboard.
            </p>
            <TeamForm />
          </section>
        ) : (
          <section>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              You&apos;re a team member. Only admins can invite or remove
              members.
            </p>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold mb-3">Members</h2>
          <ul className="space-y-1">
            {allowed.length === 0 && (
              <li className="text-sm text-zinc-500 dark:text-zinc-400 py-3">
                No allowlisted emails yet.
              </li>
            )}
            {allowed.map((row) => {
              const active = activeEmails.has(row.email);
              const isYou = row.email === user?.email;
              const isAdmin = adminEmails.has(row.email);
              return (
                <li
                  key={row.email}
                  className="flex items-center justify-between px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{row.email}</span>
                    {isYou && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        you
                      </span>
                    )}
                    {isAdmin && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        admin
                      </span>
                    )}
                    <span
                      className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        active
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {active ? "active" : "invited"}
                    </span>
                  </div>
                  {currentIsAdmin && !isYou && <RemoveButton email={row.email} />}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}

function RemoveButton({ email }: { email: string }) {
  return (
    <form action={async () => {
      "use server";
      const { removeMember } = await import("./actions");
      await removeMember(email);
    }}>
      <button
        type="submit"
        className="text-xs text-red-600 dark:text-red-400 hover:underline"
      >
        Remove
      </button>
    </form>
  );
}
