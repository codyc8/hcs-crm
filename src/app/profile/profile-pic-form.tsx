"use client";

import { useRef, useState } from "react";
import { uploadAvatar } from "../team/actions";

export function ProfilePicForm({ currentUrl }: { currentUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setStatus("idle");
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("avatar");
    if (!(file instanceof File) || file.size === 0) {
      setError("Pick an image first");
      return;
    }
    setStatus("saving");
    setError(null);
    try {
      const result = await uploadAvatar(fd);
      if ("error" in result && result.error) {
        setError(result.error);
        setStatus("error");
      } else {
        setPreview(result.url ?? null);
        setStatus("ok");
        form.reset();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
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
          Choose image
        </button>
        <input
          ref={fileRef}
          type="file"
          name="avatar"
          accept="image/*"
          onChange={handlePick}
          className="hidden"
        />
      </div>

      <button
        type="submit"
        disabled={status === "saving"}
        className="px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {status === "saving" ? "Uploading..." : "Save"}
      </button>

      {status === "ok" && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          Saved.
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
