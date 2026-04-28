"use client";

import { useState } from "react";
import { inviteMember } from "./actions";

export function TeamForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const result = await inviteMember(email);
    if ("error" in result && result.error) {
      setStatus("error");
      setError(result.error);
    } else {
      setStatus("ok");
      setEmail("");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="cofounder@example.com"
        disabled={status === "sending"}
        className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={status === "sending" || !email}
        className="px-4 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
      >
        {status === "sending" ? "Inviting..." : status === "ok" ? "Sent ✓" : "Invite"}
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1 absolute">{error}</p>}
    </form>
  );
}
