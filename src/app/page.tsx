import Link from "next/link";
import { Board } from "@/components/kanban/board";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
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
        <div className="flex items-center gap-4 text-xs">
          <Link
            href="/team"
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Team
          </Link>
          <Link
            href="/set-password"
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Password
          </Link>
          {user?.email && (
            <span className="text-zinc-500 dark:text-zinc-500">
              {user.email}
            </span>
          )}
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Board initialBusinesses={SEED} />
      </main>
    </div>
  );
}
