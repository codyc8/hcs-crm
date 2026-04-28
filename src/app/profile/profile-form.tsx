"use client";

import { useRef, useState } from "react";
import { updateMember } from "../team/actions";

export function ProfileForm({
  currentName,
  currentAvatarUrl,
}: {
  currentName: string | null;
  currentAvatarUrl: string | null;
}) {
  const [name, setName] = useState(currentName ?? "");
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPickedFile(file);
      setPreview(URL.createObjectURL(file));
      setStatus("idle");
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    if (name.trim() !== (currentName ?? "")) {
      fd.set("name", name.trim());
    }
    if (pickedFile) {
      fd.set("avatar", pickedFile);
    }
    if (![...fd.keys()].length) {
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
        if (result.avatarUrl) setPreview(result.avatarUrl);
        setStatus("ok");
        setPickedFile(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setError(msg);
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="w-20 h-20 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          {pickedFile ? "Change image" : "Choose image"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handlePick}
          className="hidden"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-zinc-500 dark:text-zinc-400">
          Display name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="e.g. Cody"
          className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={status === "saving"}
        className="px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : "Save"}
      </button>

      {status === "ok" && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">Saved.</p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
