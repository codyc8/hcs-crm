"use client";

import { useState } from "react";
import Link from "next/link";
import { setPassword } from "../team/actions";

export default function SetPasswordPage() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "ok">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setStatus("submitting");
    setError(null);
    const result = await setPassword(pw);
    if ("error" in result && result.error) {
      setStatus("idle");
      setError(result.error);
    } else {
      setStatus("ok");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Set password</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            After this, sign in with email + password instead of a magic link.
          </p>
        </div>

        {status === "ok" ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Password set. You can use it on your next sign-in.
            </p>
            <Link
              href="/"
              className="inline-block px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90"
            >
              Back to dashboard
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              required
              minLength={8}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="New password (8+ chars)"
              autoComplete="new-password"
              disabled={status === "submitting"}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              disabled={status === "submitting"}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={status === "submitting" || !pw || !confirm}
              className="w-full px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {status === "submitting" ? "Saving..." : "Save password"}
            </button>
            <Link
              href="/"
              className="block text-center text-xs text-zinc-500 dark:text-zinc-400 hover:underline"
            >
              ← Back to dashboard
            </Link>
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
