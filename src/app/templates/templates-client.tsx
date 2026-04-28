"use client";

import { useState } from "react";
import {
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_VARIABLES,
  type EmailTemplate,
  type TemplateCategory,
} from "@/lib/types";
import {
  createTemplate,
  deleteTemplate,
  seedDefaultTemplates,
  updateTemplate,
} from "./actions";

const CATEGORY_OPTIONS: TemplateCategory[] = [
  "cold",
  "warm_followup",
  "followup",
  "recap",
  "confirmation",
  "other",
];

const inputCls =
  "w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

type Props = { initialTemplates: EmailTemplate[] };

export function TemplatesClient({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [seeding, setSeeding] = useState(false);

  const grouped = CATEGORY_OPTIONS.reduce<Record<string, EmailTemplate[]>>(
    (acc, cat) => {
      acc[cat] = templates.filter((t) => t.category === cat);
      return acc;
    },
    {} as Record<string, EmailTemplate[]>
  );

  async function handleSeed() {
    setSeeding(true);
    const result = await seedDefaultTemplates();
    if ("ok" in result) {
      const fresh = await import("./actions").then((m) => m.getTemplates());
      if (fresh.templates) setTemplates(fresh.templates);
    }
    setSeeding(false);
  }

  function handleCreated(t: EmailTemplate) {
    setTemplates((prev) => [...prev, t].sort((a, b) => a.name.localeCompare(b.name)));
    setEditingId(null);
  }

  function handleUpdated(t: EmailTemplate) {
    setTemplates((prev) => prev.map((x) => (x.id === t.id ? t : x)));
    setEditingId(null);
  }

  function handleDeleted(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setEditingId("new")}
          className="px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90"
        >
          + New template
        </button>
        {templates.length === 0 && (
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50"
          >
            {seeding ? "Seeding..." : "Seed default templates"}
          </button>
        )}
      </div>

      {editingId === "new" && (
        <TemplateForm
          onSave={handleCreated}
          onCancel={() => setEditingId(null)}
        />
      )}

      {CATEGORY_OPTIONS.map((cat) => {
        const group = grouped[cat];
        if (group.length === 0 && editingId !== "new") return null;
        return (
          <div key={cat}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
              {TEMPLATE_CATEGORY_LABELS[cat]}
            </h2>
            <div className="space-y-2">
              {group.map((t) =>
                editingId === t.id ? (
                  <TemplateForm
                    key={t.id}
                    template={t}
                    onSave={handleUpdated}
                    onCancel={() => setEditingId(null)}
                    onDelete={handleDeleted}
                  />
                ) : (
                  <TemplateRow
                    key={t.id}
                    template={t}
                    onEdit={() => setEditingId(t.id)}
                  />
                )
              )}
            </div>
          </div>
        );
      })}

      {templates.length === 0 && editingId !== "new" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No templates yet. Click &quot;Seed default templates&quot; to add 5 starter templates.
        </p>
      )}
    </div>
  );
}

function TemplateRow({
  template,
  onEdit,
}: {
  template: EmailTemplate;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{template.name}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
          {template.subject}
        </p>
      </div>
      <button
        onClick={onEdit}
        className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 shrink-0"
      >
        Edit
      </button>
    </div>
  );
}

function TemplateForm({
  template,
  onSave,
  onCancel,
  onDelete,
}: {
  template?: EmailTemplate;
  onSave: (t: EmailTemplate) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bodyRef, setBodyRef] = useState<HTMLTextAreaElement | null>(null);
  const [subjectRef, setSubjectRef] = useState<HTMLInputElement | null>(null);
  const [activeField, setActiveField] = useState<"subject" | "body">("body");

  function insertVariable(variable: string) {
    if (activeField === "body" && bodyRef) {
      const start = bodyRef.selectionStart ?? bodyRef.value.length;
      const end = bodyRef.selectionEnd ?? bodyRef.value.length;
      const current = bodyRef.value;
      bodyRef.value = current.slice(0, start) + variable + current.slice(end);
      bodyRef.setSelectionRange(start + variable.length, start + variable.length);
      bodyRef.focus();
    } else if (activeField === "subject" && subjectRef) {
      const start = subjectRef.selectionStart ?? subjectRef.value.length;
      const end = subjectRef.selectionEnd ?? subjectRef.value.length;
      const current = subjectRef.value;
      subjectRef.value = current.slice(0, start) + variable + current.slice(end);
      subjectRef.setSelectionRange(start + variable.length, start + variable.length);
      subjectRef.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = template
      ? await updateTemplate(template.id, fd)
      : await createTemplate(fd);
    if ("error" in result && result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    if (result.template) onSave(result.template as EmailTemplate);
    setSaving(false);
  }

  async function handleDelete() {
    if (!template || !onDelete) return;
    if (!confirm(`Delete "${template.name}"?`)) return;
    const result = await deleteTemplate(template.id);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    onDelete(template.id);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 p-4 rounded-md border border-blue-300 dark:border-blue-800 bg-white dark:bg-zinc-950"
    >
      <div className="flex flex-wrap gap-1.5 mb-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 self-center">
          Click to insert:
        </span>
        {TEMPLATE_VARIABLES.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => insertVariable(v)}
            className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-mono"
          >
            {v}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Template name *</span>
          <input
            type="text"
            name="name"
            required
            defaultValue={template?.name ?? ""}
            className={inputCls}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Category</span>
          <select
            name="category"
            defaultValue={template?.category ?? "other"}
            className={inputCls}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {TEMPLATE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Subject line</span>
        <input
          type="text"
          name="subject"
          defaultValue={template?.subject ?? ""}
          ref={setSubjectRef}
          onFocus={() => setActiveField("subject")}
          className={inputCls}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Body</span>
        <textarea
          name="body"
          rows={8}
          defaultValue={template?.body ?? ""}
          ref={setBodyRef}
          onFocus={() => setActiveField("body")}
          className={`${inputCls} font-mono text-xs resize-y`}
        />
      </label>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex items-center justify-between pt-1">
        {template && onDelete ? (
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : template ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </form>
  );
}
