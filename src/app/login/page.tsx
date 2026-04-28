"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "password" | "magic";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "magic_sent">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setStatus("idle");
      setError(error.message);
    } else {
      window.location.href = "/";
    }
  }

  async function handleMagic(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });
    if (error) {
      setStatus("idle");
      setError(error.message);
    } else {
      setStatus("magic_sent");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">HCS Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Davis Web Agency CRM. Sign in with your team email.
          </p>
        </div>

        {mode === "password" ? (
          <form onSubmit={handlePassword} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={status === "submitting"}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              disabled={status === "submitting"}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {status === "submitting" ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("magic");
                setError(null);
              }}
              className="w-full text-xs text-zinc-500 dark:text-zinc-400 hover:underline"
            >
              No password yet? Email me a magic link instead.
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagic} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={status === "submitting" || status === "magic_sent"}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={status === "submitting" || status === "magic_sent"}
              className="w-full px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {status === "submitting"
                ? "Sending..."
                : status === "magic_sent"
                ? "Check your email"
                : "Send magic link"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setError(null);
              }}
              className="w-full text-xs text-zinc-500 dark:text-zinc-400 hover:underline"
            >
              ← Sign in with password
            </button>
          </form>
        )}

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        {status === "magic_sent" && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Magic link sent. Open it on this device.
          </p>
        )}
        <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
          Access is restricted to allowlisted team emails.
        </p>
      </div>
    </div>
  );
}
