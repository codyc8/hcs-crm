"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { VERTICAL_LABELS, type Business } from "@/lib/types";

type Member = {
  user_id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
};

type Props = {
  business: Business;
  dragging?: boolean;
  assignee?: Member | null;
  onOpen?: () => void;
};

const VERTICAL_COLORS: Record<string, string> = {
  restaurant:
    "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  salon: "bg-pink-100 text-pink-900 dark:bg-pink-950 dark:text-pink-200",
  barbershop: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  contractor:
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  retail:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  fitness: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200",
  other: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200",
};

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;
const INTERESTED_DEADLINE_HOURS = 48;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
}

function hoursSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / HOUR);
}

function initialsFor(member: Member): string {
  const source = member.name || member.email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function BusinessCard({ business, dragging, assignee, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: business.id });

  const stale = daysSince(business.last_activity_at) >= 7;
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  let interestedBadge: { text: string; className: string } | null = null;
  if (business.status === "interested") {
    const elapsed = hoursSince(business.last_activity_at);
    const left = INTERESTED_DEADLINE_HOURS - elapsed;
    if (left > 0) {
      interestedBadge = {
        text: `${left}h left`,
        className:
          left <= 12
            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
            : left <= 24
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      };
    } else {
      interestedBadge = {
        text: `Overdue ${Math.abs(left)}h`,
        className:
          "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200 font-semibold",
      };
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen?.()}
      className={`group relative rounded-md border bg-white dark:bg-zinc-950 p-3 shadow-sm cursor-pointer select-none ${
        isDragging && !dragging ? "opacity-30" : ""
      } ${
        stale && !interestedBadge
          ? "border-red-300 dark:border-red-900"
          : "border-zinc-200 dark:border-zinc-800"
      } ${dragging ? "shadow-lg ring-2 ring-blue-400" : ""}`}
    >
      {/* Drag handle — visible on hover, only this triggers drag */}
      <div
        {...listeners}
        {...attributes}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 left-2 hidden group-hover:flex items-center justify-center w-5 h-5 rounded cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        title="Drag to move"
      >
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="2" cy="2" r="1.2" />
          <circle cx="8" cy="2" r="1.2" />
          <circle cx="2" cy="7" r="1.2" />
          <circle cx="8" cy="7" r="1.2" />
          <circle cx="2" cy="12" r="1.2" />
          <circle cx="8" cy="12" r="1.2" />
        </svg>
      </div>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-tight pl-0 group-hover:pl-6 transition-all duration-100">
          {business.name}
        </h3>
        {assignee ? (
          assignee.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assignee.avatar_url}
              alt={assignee.name || assignee.email}
              title={assignee.name || assignee.email}
              className="w-6 h-6 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
            />
          ) : (
            <div
              title={assignee.name || assignee.email}
              className="w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-700 text-[10px] font-semibold flex items-center justify-center text-zinc-700 dark:text-zinc-200 shrink-0"
            >
              {initialsFor(assignee)}
            </div>
          )
        ) : (
          <span className="text-[10px] uppercase tracking-wide text-zinc-400 shrink-0">
            unassigned
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span
          className={`inline-flex items-center text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
            VERTICAL_COLORS[business.vertical] ?? VERTICAL_COLORS.other
          }`}
        >
          {VERTICAL_LABELS[business.vertical]}
        </span>
        {interestedBadge ? (
          <span
            className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${interestedBadge.className}`}
          >
            {interestedBadge.text}
          </span>
        ) : (
          <span
            className={`text-[10px] tabular-nums ${
              stale
                ? "text-red-600 dark:text-red-400 font-semibold"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {daysSince(business.last_activity_at)}d ago
          </span>
        )}
      </div>
    </div>
  );
}
