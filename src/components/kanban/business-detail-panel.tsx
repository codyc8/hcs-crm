"use client";

import { useEffect, useState } from "react";
import {
  COLUMNS,
  TEMPLATE_CATEGORY_LABELS,
  VERTICAL_LABELS,
  type ActivityEntry,
  type Business,
  type ColumnId,
  type EmailTemplate,
  type Source,
  type TemplateCategory,
  type Vertical,
} from "@/lib/types";
import {
  addActivity,
  deleteBusiness,
  getActivityLog,
  updateBusiness,
} from "@/app/businesses/actions";
import { getTemplates } from "@/app/templates/actions";

const VERTICAL_OPTIONS: Vertical[] = [
  "restaurant",
  "salon",
  "barbershop",
  "contractor",
  "retail",
  "fitness",
  "other",
];

const SOURCE_LABELS: Record<Source, string> = {
  walk_in: "Walk-in",
  email: "Email",
  ig_dm: "Instagram DM",
  warm_intro: "Warm intro",
  scraped: "Scraped",
  other: "Other",
};

const ACTIVITY_LABELS: Record<string, string> = {
  outreach_sent: "Outreach sent",
  response_received: "Response received",
  call_held: "Call held",
  meeting_scheduled: "Meeting scheduled",
  meeting_held: "Meeting held",
  won: "Won",
  lost: "Lost",
  note: "Note",
};

type Member = {
  user_id: string;
  name: string | null;
  email: string;
};

type Props = {
  business: Business;
  members: Member[];
  onClose: () => void;
  onUpdated: (b: Business) => void;
  onDeleted: (id: string) => void;
};

export function BusinessDetailPanel({
  business,
  members,
  onClose,
  onUpdated,
  onDeleted,
}: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityEntry[] | null>(null);
  const [loadingLog, setLoadingLog] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingLog(true);
    getActivityLog(business.id).then((result) => {
      if (cancelled) return;
      if ("entries" in result) {
        setActivities(result.entries as ActivityEntry[]);
      }
      setLoadingLog(false);
    });
    return () => {
      cancelled = true;
    };
  }, [business.id]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("saving");
    setError(null);
    try {
      const result = await updateBusiness(business.id, fd);
      if ("error" in result && result.error) {
        setError(result.error);
        setStatus("error");
        return;
      }
      if (result.business) {
        onUpdated(result.business as Business);
      }
      setStatus("idle");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(msg);
      setStatus("error");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${business.name}"? This cannot be undone.`)) return;
    const result = await deleteBusiness(business.id);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    onDeleted(business.id);
  }

  async function handleAddActivity(eventType: string, notes: string) {
    const result = await addActivity(business.id, eventType, notes || null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if (result.entry) {
      setActivities((prev) =>
        prev ? [result.entry as ActivityEntry, ...prev] : [result.entry as ActivityEntry]
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 bg-black/40 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-950 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl my-8"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-sm font-semibold truncate">{business.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <Field label="Business name *">
            <input
              type="text"
              name="name"
              required
              maxLength={120}
              defaultValue={business.name}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                name="status"
                defaultValue={business.status}
                className={inputCls}
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assigned to">
              <select
                name="assigned_to"
                defaultValue={business.assigned_to ?? "__unassigned__"}
                className={inputCls}
              >
                <option value="__unassigned__">— Unassigned —</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.name || m.email}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Vertical">
              <select
                name="vertical"
                defaultValue={business.vertical}
                className={inputCls}
              >
                {VERTICAL_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {VERTICAL_LABELS[v]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Source">
              <select
                name="source"
                defaultValue={business.source ?? ""}
                className={inputCls}
              >
                <option value="">—</option>
                {(Object.keys(SOURCE_LABELS) as Source[]).map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Address">
            <input
              type="text"
              name="address"
              defaultValue={business.address ?? ""}
              className={inputCls}
            />
          </Field>
          <Field label="Phone">
            <input
              type="text"
              name="phone"
              defaultValue={business.phone ?? ""}
              className={inputCls}
            />
          </Field>
          <Field label="Summary">
            <textarea
              name="summary"
              rows={2}
              defaultValue={business.summary ?? ""}
              className={inputCls}
            />
          </Field>
          <Field label="Custom site URL">
            <input
              type="url"
              name="custom_site_url"
              defaultValue={business.custom_site_url ?? ""}
              placeholder="https://..."
              className={inputCls}
            />
          </Field>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Owner contact
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact name">
                <input
                  type="text"
                  name="contact_name"
                  defaultValue={business.contact_name ?? ""}
                  className={inputCls}
                />
              </Field>
              <Field label="Relationship">
                <input
                  type="text"
                  name="contact_relationship"
                  defaultValue={business.contact_relationship ?? ""}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Contact phone">
              <input
                type="text"
                name="contact_phone"
                defaultValue={business.contact_phone ?? ""}
                className={inputCls}
              />
            </Field>
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Delete business
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === "saving"}
                className="px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {status === "saving" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>

        <EmailSection business={business} />

        <ActivitySection
          loading={loadingLog}
          entries={activities ?? []}
          members={members}
          onAdd={handleAddActivity}
        />
      </div>
    </div>
  );
}

const TEMPLATE_CATEGORY_ORDER: TemplateCategory[] = [
  "cold",
  "warm_followup",
  "followup",
  "recap",
  "confirmation",
  "other",
];

function mergeTemplate(text: string, business: Business): string {
  const vars: Record<string, string> = {
    business_name: business.name,
    contact_name: business.contact_name ?? "(contact name)",
    vertical: VERTICAL_LABELS[business.vertical],
    address: business.address ?? "(address)",
    phone: business.phone ?? "(phone)",
  };
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function EmailSection({ business }: { business: Business }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<EmailTemplate | null>(null);
  const [copied, setCopied] = useState<"subject" | "body" | "both" | null>(null);

  useEffect(() => {
    if (!open || templates !== null) return;
    setLoading(true);
    getTemplates().then((r) => {
      setTemplates(r.templates ?? []);
      setLoading(false);
    });
  }, [open, templates]);

  function copyText(text: string, which: "subject" | "body" | "both") {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  const grouped = templates
    ? TEMPLATE_CATEGORY_ORDER.reduce<Record<string, EmailTemplate[]>>((acc, cat) => {
        acc[cat] = templates.filter((t) => t.category === cat);
        return acc;
      }, {} as Record<string, EmailTemplate[]>)
    : {};

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
      >
        <span>Email templates</span>
        <span className="text-zinc-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-4">
          {loading && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading templates…</p>
          )}

          {!loading && templates?.length === 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No templates yet.{" "}
              <a href="/templates" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">
                Create some in Templates.
              </a>
            </p>
          )}

          {!loading && templates && templates.length > 0 && !preview && (
            <div className="space-y-3">
              {TEMPLATE_CATEGORY_ORDER.map((cat) => {
                const group = grouped[cat] ?? [];
                if (group.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
                      {TEMPLATE_CATEGORY_LABELS[cat]}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPreview(t)}
                          className="text-xs px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {preview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {preview.name}
                </span>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  ← Back
                </button>
              </div>

              <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden text-sm">
                <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Subject</span>
                  <button
                    type="button"
                    onClick={() => copyText(mergeTemplate(preview.subject, business), "subject")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {copied === "subject" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="px-3 py-2 text-xs font-medium">
                  {mergeTemplate(preview.subject, business)}
                </p>
              </div>

              <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden text-sm">
                <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Body</span>
                  <button
                    type="button"
                    onClick={() => copyText(mergeTemplate(preview.body, business), "body")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {copied === "body" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="px-3 py-2 text-xs whitespace-pre-wrap font-sans">
                  {mergeTemplate(preview.body, business)}
                </pre>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyText(
                    `Subject: ${mergeTemplate(preview.subject, business)}\n\n${mergeTemplate(preview.body, business)}`,
                    "both"
                  )
                }
                className="w-full px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:opacity-90"
              >
                {copied === "both" ? "Copied!" : "Copy subject + body"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActivitySection({
  loading,
  entries,
  members,
  onAdd,
}: {
  loading: boolean;
  entries: ActivityEntry[];
  members: Member[];
  onAdd: (eventType: string, notes: string) => Promise<void>;
}) {
  const [eventType, setEventType] = useState("note");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const memberById = new Map(members.map((m) => [m.user_id, m]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onAdd(eventType, notes);
    setNotes("");
    setEventType("note");
    setSubmitting(false);
  }

  return (
    <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-lg">
      <h3 className="text-sm font-semibold">Activity</h3>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center gap-2">
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className={`${inputCls} max-w-[180px]`}
          >
            {Object.entries(ACTIVITY_LABELS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            maxLength={500}
            className={inputCls}
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:opacity-90 disabled:opacity-50 shrink-0"
          >
            {submitting ? "..." : "Log"}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {loading && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
        )}
        {!loading && entries.length === 0 && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            No activity yet. Log an outreach or note to start the timeline.
          </p>
        )}
        {!loading &&
          entries.map((e) => {
            const author = e.author_id ? memberById.get(e.author_id) : null;
            return (
              <div
                key={e.id}
                className="text-xs px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-medium">
                    {ACTIVITY_LABELS[e.event_type] ?? e.event_type}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {formatRelative(e.created_at)}
                  </span>
                </div>
                {e.notes && (
                  <p className="text-zinc-700 dark:text-zinc-300">{e.notes}</p>
                )}
                {author && (
                  <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                    — {author.name || author.email}
                  </p>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
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
