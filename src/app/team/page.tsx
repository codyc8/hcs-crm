import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserMenu } from "@/components/user-menu";
import { TeamForm } from "./team-form";
import { MemberRow } from "./member-row";

type AllowedEmail = { email: string; added_at: string };
type Profile = {
  user_id: string;
  email: string;
  is_admin: boolean;
  name: string | null;
  avatar_url: string | null;
};

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
    .select("user_id, email, is_admin, name, avatar_url");
  const profiles = (profilesRaw ?? []) as Profile[];
  const profileByEmail = new Map(profiles.map((p) => [p.email, p]));
  const currentProfile = profiles.find((p) => p.user_id === user?.id);
  const currentIsAdmin = !!currentProfile?.is_admin;

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
        {user?.email && (
          <UserMenu
            email={user.email}
            name={currentProfile?.name ?? null}
            avatarUrl={currentProfile?.avatar_url ?? null}
          />
        )}
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
          {currentIsAdmin && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              Tap Edit on any active member to change their name or profile picture.
            </p>
          )}
          <ul className="space-y-2">
            {allowed.length === 0 && (
              <li className="text-sm text-zinc-500 dark:text-zinc-400 py-3">
                No allowlisted emails yet.
              </li>
            )}
            {allowed.map((row) => {
              const profile = profileByEmail.get(row.email);
              return (
                <MemberRow
                  key={row.email}
                  email={row.email}
                  targetUserId={profile?.user_id ?? null}
                  name={profile?.name ?? null}
                  avatarUrl={profile?.avatar_url ?? null}
                  isYou={row.email === user?.email}
                  isAdmin={!!profile?.is_admin}
                  active={!!profile}
                  currentIsAdmin={currentIsAdmin}
                />
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
