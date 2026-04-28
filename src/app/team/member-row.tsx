"use client";

import { useRef, useState } from "react";
import { updateMember, removeMember } from "./actions";

type Props = {
  email: string;
  targetUserId: string | null;
  name: string | null;
  avatarUrl: string | null;
  isYou: boolean;
  isAdmin: boolean;
  active: boolean;
  currentIsAdmin: boolean;
};

export function MemberRow({
  email,
  targetUserId,
  name,
  avatarUrl,
  isYou,
  isAdmin,
  active,
  currentIsAdmin,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name ?? "");
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const initial = (name ?? email).charAt(0).toUpperCase();
  const canEdit = currentIsAdmin && active && targetUserId !== null;

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPickedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStatus("idle");
      setError(null);
    }
  }

  async function handleSave() {
    if (!targetUserId) return;
    const fd = new FormData();
    fd.set("target_user_id", targetUserId);
    const trimmed = editName.trim();
    if (trimmed !== (name ?? "")) {
      fd.set("name", trimmed);
    }
    if (pickedFile) {
      fd.set("avatar", pickedFile);
    }
    if (![...fd.keys()].filter((k) => k !== "target_user_id").length) {
      setError("Nothing changed");
      return;
    }
    setStatus("saving");
    setError(null);
    try {
      const result = await updateMember(fd);
      if ("error" in result && result.error) {
        setError(result.error);
        setStatus("error");
      } else {
        setStatus("ok");
        setPickedFile(null);
        setEditing(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setError(msg);
      setStatus("error");
    }
  }

  async function handleRemove() {
    if (!confirm(`Remove ${name || email} from the team?`)) return;
    await removeMember(email);
  }

  return (
    <li className="rounded-md border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3 min-w-0">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
              {initial}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            {name ? (
              <>
                <span className="text-sm font-medium truncate">{name}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {email}
                </span>
              </>
            ) : (
              <span className="text-sm truncate">{email}</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isYou && (
              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                you
              </span>
            )}
            {isAdmin && (
              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                admin
              </span>
            )}
            <span
              className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                active
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
              }`}
            >
              {active ? "active" : "invited"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="text-xs text-zinc-600 dark:text-zinc-400 hover:underline"
            >
              {editing ? "Cancel" : "Edit"}
            </button>
          )}
          {currentIsAdmin && !isYou && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {editing && canEdit && (
        <div className="px-3 py-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="space-y-1">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">
              Display name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={80}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              {pickedFile ? "Change image" : "Choose image"}
            </button>
            {pickedFile && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {pickedFile.name}
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePick}
              className="hidden"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={status === "saving"}
              className="px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:opacity-90 disabled:opacity-50"
            >
              {status === "saving" ? "Saving..." : "Save"}
            </button>
            {error && (
              <span className="text-xs text-red-600 dark:text-red-400">
                {error}
              </span>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
