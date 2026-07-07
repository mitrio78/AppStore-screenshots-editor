"use client";
import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Device, Orientation, Slide, Theme } from "@/lib/types";
import { SlideThumb } from "./slide-thumb";

type Props = {
  slides: Slide[];
  activeId: string | null;
  device: Device;
  orientation: Orientation;
  theme: Theme;
  locale: string;
  appName?: string;
  appIcon?: string;
  disabled?: boolean;
  onReorder: (next: Slide[]) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onApplyTemplate: () => void;
  onAdd: () => void;
};

export function Sidebar({
  slides,
  activeId,
  device,
  orientation,
  theme,
  locale,
  appName,
  appIcon,
  disabled,
  onReorder,
  onSelect,
  onDelete,
  onDuplicate,
  onApplyTemplate,
  onAdd,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = slides.findIndex((s) => s.id === active.id);
    const newIdx = slides.findIndex((s) => s.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    onReorder(arrayMove(slides, oldIdx, newIdx));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <h2 className="text-sm font-semibold">Slides</h2>
        <p className="text-xs text-muted-foreground">
          {slides.length} slide{slides.length === 1 ? "" : "s"} · drag to reorder
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {slides.map((slide, i) => (
                <SlideThumb
                  key={slide.id}
                  slide={slide}
                  index={i}
                  active={slide.id === activeId}
                  device={device}
                  orientation={orientation}
                  theme={theme}
                  locale={locale}
                  appName={appName}
                  appIcon={appIcon}
                  onSelect={() => onSelect(slide.id)}
                  onDelete={() => onDelete(slide.id)}
                  onDuplicate={() => onDuplicate(slide.id)}
                />
              ))}
              {slides.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-xs font-medium text-foreground">No slides yet</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Click <span className="font-semibold">Add slide</span> to get started.
                  </p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex flex-col gap-2 border-t bg-card p-3">
        <Button
          type="button"
          className="h-auto min-h-9 w-full whitespace-normal px-3 py-2 text-center leading-snug"
          variant="outline"
          onClick={onApplyTemplate}
          disabled={disabled || !activeId || slides.length < 2}
          title="Применить шаблон активного слайда ко всем остальным слайдам текущей колоды"
        >
          <Copy data-icon="inline-start" /> Применить шаблон на все слайды
        </Button>
        <Button
          type="button"
          className="w-full"
          variant="default"
          onClick={onAdd}
          disabled={disabled}
        >
          <Plus data-icon="inline-start" /> Add slide
        </Button>
      </div>
    </div>
  );
}
