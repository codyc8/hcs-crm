"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { VERTICAL_LABELS, type Business } from "@/lib/types";

type Props = {
  business: Business;
  dragging?: boolean;
};

const VERTICAL_COLORS: Record<string, string> = {
  restaurant: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  salon: "bg-pink-100 text-pink-900 dark:bg-pink-950 dark:text-pink-200",
  barbershop: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  contractor: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  retail: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  fitness: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200",
  other: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200",
};

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function BusinessCard({ business, dragging }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: business.id });

  const stale = daysSince(business.last_activity_at) >= 7;

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-md border bg-white dark:bg-zinc-950 p-3 shadow-sm cursor-grab active:cursor-grabbing select-none ${
        isDragging && !dragging ? "opacity-30" : ""
      } ${stale ? "border-red-300 dark:border-red-900" : "border-zinc-200 dark:border-zinc-800"} ${
        dragging ? "shadow-lg ring-2 ring-blue-400" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
          {business.name}
        </h3>
        {business.assigned_to ? (
          <div className="w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-700 text-[10px] font-semibold flex items-center justify-center text-zinc-700 dark:text-zinc-200 shrink-0">
            {business.assigned_to.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <span className="text-[10px] uppercase tracking-wide text-zinc-400 shrink-0">
            unassigned
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
            VERTICAL_COLORS[business.vertical] ?? VERTICAL_COLORS.other
          }`}
        >
          {VERTICAL_LABELS[business.vertical]}
        </span>
        <span
          className={`text-[10px] tabular-nums ${
            stale ? "text-red-600 dark:text-red-400 font-semibold" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {daysSince(business.last_activity_at)}d ago
        </span>
      </div>
    </div>
  );
}
