"use client";

import { useState } from "react";
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

type Props = {
  initialBusinesses: Business[];
  onMove?: (businessId: string, toColumn: ColumnId) => Promise<void> | void;
};

export function Board({ initialBusinesses, onMove }: Props) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [activeId, setActiveId] = useState<string | null>(null);

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

    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === businessId
          ? { ...b, status: targetColumn, last_activity_at: new Date().toISOString() }
          : b
      )
    );
    onMove?.(businessId, targetColumn);
  }

  const activeBusiness = activeId
    ? businesses.find((b) => b.id === activeId) ?? null
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto p-6 h-full">
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
  );
}
