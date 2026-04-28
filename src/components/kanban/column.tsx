"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Business, ColumnId } from "@/lib/types";
import { BusinessCard } from "./business-card";

type Props = {
  id: ColumnId;
  label: string;
  businesses: Business[];
};

export function Column({ id, label, businesses }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 shrink-0 rounded-lg border bg-zinc-50 dark:bg-zinc-900 transition-colors ${
        isOver ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {label}
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
          {businesses.length}
        </span>
      </header>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
        {businesses.length === 0 ? (
          <div className="text-xs text-zinc-400 dark:text-zinc-600 text-center py-8">
            Drop here or add a business
          </div>
        ) : (
          businesses.map((b) => <BusinessCard key={b.id} business={b} />)
        )}
      </div>
    </div>
  );
}
