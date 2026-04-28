"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
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

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={status === "sending" || status === "sent"}
            className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={status === "sending" || status === "sent"}
            className="w-full px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {status === "sending"
              ? "Sending..."
              : status === "sent"
              ? "Check your email"
              : "Send magic link"}
          </button>
        </form>

        {status === "sent" && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Magic link sent. Open it on this device.
          </p>
        )}
        {status === "error" && errorMsg && (
          <p className="text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
        )}
        <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
          Access is restricted to allowlisted team emails.
        </p>
      </div>
    </div>
  );
}
