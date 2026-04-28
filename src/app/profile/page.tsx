import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserMenu } from "@/components/user-menu";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("name, avatar_url")
    .eq("user_id", user.id)
    .single();

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
          <h1 className="text-base font-semibold tracking-tight">Profile</h1>
        </div>
        {user.email && (
          <UserMenu
            email={user.email}
            name={profile?.name ?? null}
            avatarUrl={profile?.avatar_url ?? null}
          />
        )}
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Your display name and profile picture. Square images look best, 5MB max.
        </p>
        <ProfileForm
          currentName={profile?.name ?? null}
          currentAvatarUrl={profile?.avatar_url ?? null}
        />
      </main>
    </div>
  );
}
