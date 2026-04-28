"use client";

import { useState } from "react";
import { createBusiness } from "@/app/businesses/actions";
import { VERTICAL_LABELS, type Business, type Vertical } from "@/lib/types";

const VERTICAL_OPTIONS: Vertical[] = [
  "restaurant",
  "salon",
  "barbershop",
  "contractor",
  "retail",
  "fitness",
  "other",
];

const SOURCE_LABELS: Record<string, string> = {
  walk_in: "Walk-in",
  email: "Email",
  ig_dm: "Instagram DM",
  warm_intro: "Warm intro",
  scraped: "Scraped",
  other: "Other",
};

export function AddBusinessButton({
  onCreated,
}: {
  onCreated: (b: Business) => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setStatus("saving");
    setError(null);
    try {
      const result = await createBusiness(fd);
      if ("error" in result && result.error) {
        setError(result.error);
        setStatus("error");
        return;
      }
      if (result.business) {
        onCreated(result.business as Business);
      }
      setStatus("idle");
      form.reset();
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create";
      setError(msg);
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:opacity-90"
      >
        + Add Business
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-950 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg my-8"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-sm font-semibold">Add a business</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-lg leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <Field label="Business name *">
                <input
                  type="text"
                  name="name"
                  required
                  maxLength={120}
                  className={inputCls}
                  autoFocus
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Vertical">
                  <select name="vertical" className={inputCls} defaultValue="other">
                    {VERTICAL_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {VERTICAL_LABELS[v]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Source">
                  <select name="source" className={inputCls} defaultValue="">
                    <option value="">—</option>
                    {Object.entries(SOURCE_LABELS).map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Address">
                <input type="text" name="address" className={inputCls} />
              </Field>
              <Field label="Phone">
                <input type="text" name="phone" className={inputCls} />
              </Field>
              <Field label="Summary">
                <textarea
                  name="summary"
                  rows={2}
                  className={inputCls}
                  placeholder="One-line about the business."
                />
              </Field>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Owner contact (optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact name">
                    <input type="text" name="contact_name" className={inputCls} />
                  </Field>
                  <Field label="Relationship">
                    <input
                      type="text"
                      name="contact_relationship"
                      className={inputCls}
                      placeholder="owner, manager, etc."
                    />
                  </Field>
                </div>
                <Field label="Contact phone">
                  <input type="text" name="contact_phone" className={inputCls} />
                </Field>
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === "saving"}
                  className="px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {status === "saving" ? "Adding..." : "Add to Cold"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      {children}
    </label>
  );
}
