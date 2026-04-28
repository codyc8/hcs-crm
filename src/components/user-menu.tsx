"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function UserMenu({
  email,
  avatarUrl,
}: {
  email: string;
  avatarUrl: string | null;
}) {
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Account menu"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {initial}
          </div>
        )}
      </button>

      <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-20">
        <div className="w-52 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg overflow-hidden">
          <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 truncate">
            {email}
          </div>
          <Link
            href="/team"
            className="block px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Team
          </Link>
          <Link
            href="/profile"
            className="block px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Change profile pic
          </Link>
          <Link
            href="/set-password"
            className="block px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Change password
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-red-600 dark:text-red-400"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
