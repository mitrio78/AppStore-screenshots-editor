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
import { useI18n } from "@/lib/i18n";
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
  const { messages: m } = useI18n();
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
        <h2 className="text-sm font-semibold">{m.sidebar.title}</h2>
        <p className="text-xs text-muted-foreground">
          {m.sidebar.count(slides.length)}
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
                  <p className="text-xs font-medium text-foreground">{m.sidebar.noSlidesTitle}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {m.sidebar.noSlidesHint}
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
          title={m.sidebar.applyTemplateTitle}
        >
          <Copy data-icon="inline-start" /> {m.sidebar.applyTemplate}
        </Button>
        <Button
          type="button"
          className="w-full"
          variant="default"
          onClick={onAdd}
          disabled={disabled}
        >
          <Plus data-icon="inline-start" /> {m.sidebar.addSlide}
        </Button>
      </div>
    </div>
  );
}
