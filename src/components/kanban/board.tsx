"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { COLUMNS, type Business, type ColumnId } from "@/lib/types";
import { Column } from "./column";
import { BusinessCard } from "./business-card";
import { AddBusinessButton } from "./add-business-button";
import { moveBusinessStatus } from "@/app/businesses/actions";

type Props = {
  initialBusinesses: Business[];
};

export function Board({ initialBusinesses }: Props) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const businessId = String(active.id);
    const targetColumn = String(over.id) as ColumnId;
    const business = businesses.find((b) => b.id === businessId);
    if (!business || business.status === targetColumn) return;

    const previousStatus = business.status;
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === businessId
          ? {
              ...b,
              status: targetColumn,
              last_activity_at: new Date().toISOString(),
            }
          : b
      )
    );

    startTransition(async () => {
      const result = await moveBusinessStatus(businessId, targetColumn);
      if ("error" in result && result.error) {
        // Roll back on failure so the UI matches reality.
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === businessId ? { ...b, status: previousStatus } : b
          )
        );
      }
    });
  }

  function handleCreated(business: Business) {
    setBusinesses((prev) => [business, ...prev]);
  }

  const activeBusiness = activeId
    ? businesses.find((b) => b.id === activeId) ?? null
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
          {businesses.length} {businesses.length === 1 ? "business" : "businesses"}
        </span>
        <AddBusinessButton onCreated={handleCreated} />
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto p-6 flex-1">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              businesses={businesses.filter((b) => b.status === col.id)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeBusiness ? (
            <BusinessCard business={activeBusiness} dragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
