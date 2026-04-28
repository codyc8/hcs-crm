import { Board } from "@/components/kanban/board";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserMenu } from "@/components/user-menu";
import type { Business } from "@/lib/types";

const SEED: Business[] = [
  {
    id: "demo-1",
    name: "Mishka's Cafe",
    vertical: "restaurant",
    address: "514 2nd St, Davis CA",
    phone: "(530) 759-0811",
    summary: "Local indie coffeehouse, Davis classic.",
    contact_name: null,
    contact_relationship: null,
    contact_phone: null,
    source: "walk_in",
    status: "cold",
    assigned_to: null,
    custom_site_url: null,
    last_activity_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    created_by: "seed",
  },
  {
    id: "demo-2",
    name: "Davis Barbershop",
    vertical: "barbershop",
    address: "Davis CA",
    phone: null,
    summary: "Neighborhood cuts.",
    contact_name: "Mike",
    contact_relationship: "owner",
    contact_phone: null,
    source: "walk_in",
    status: "outreached",
    assigned_to: "CC",
    custom_site_url: null,
    last_activity_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    created_at: new Date().toISOString(),
    created_by: "seed",
  },
  {
    id: "demo-3",
    name: "Common Grounds",
    vertical: "restaurant",
    address: "Davis CA",
    phone: null,
    summary: "Coffee + study spot near campus.",
    contact_name: null,
    contact_relationship: null,
    contact_phone: null,
    source: "warm_intro",
    status: "interested",
    assigned_to: "CC",
    custom_site_url: null,
    last_activity_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    created_at: new Date().toISOString(),
    created_by: "seed",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let name: string | null = null;
  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("name, avatar_url")
      .eq("user_id", user.id)
      .single();
    avatarUrl = profile?.avatar_url ?? null;
    name = profile?.name ?? null;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold tracking-tight">
            HCS Dashboard
          </h1>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Davis Web Agency
          </span>
        </div>
        {user?.email && (
          <UserMenu email={user.email} name={name} avatarUrl={avatarUrl} />
        )}
      </header>
      <main className="flex-1 overflow-hidden">
        <Board initialBusinesses={SEED} />
      </main>
    </div>
  );
}
