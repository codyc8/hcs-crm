import Link from "next/link";
import { Board } from "@/components/kanban/board";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserMenu } from "@/components/user-menu";
import type { Business } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let name: string | null = null;
  let businesses: Business[] = [];
  let members: {
    user_id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
  }[] = [];

  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("name, avatar_url")
      .eq("user_id", user.id)
      .single();
    avatarUrl = profile?.avatar_url ?? null;
    name = profile?.name ?? null;

    const { data: rows } = await supabase
      .from("businesses")
      .select("*")
      .order("last_activity_at", { ascending: false });
    businesses = (rows ?? []) as Business[];

    const { data: memberRows } = await admin
      .from("profiles")
      .select("user_id, name, email, avatar_url");
    members = memberRows ?? [];
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold tracking-tight">
            HCS Dashboard
          </h1>
          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-zinc-900 dark:text-zinc-100 font-medium"
            >
              Board
            </Link>
            <Link
              href="/templates"
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Templates
            </Link>
            <Link
              href="/team"
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Team
            </Link>
          </nav>
        </div>
        {user?.email && (
          <UserMenu email={user.email} name={name} avatarUrl={avatarUrl} />
        )}
      </header>
      <main className="flex-1 overflow-hidden">
        <Board initialBusinesses={businesses} members={members} />
      </main>
    </div>
  );
}
