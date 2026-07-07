"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DEFAULT_SHADOW, FRAME_COLORS } from "@/lib/constants";
import { defaultRectsFor, getCanvasSize } from "@/lib/layout-rects";
import type {
  Device,
  DeviceElementId,
  ElementTransform,
  Orientation,
  ShadowSpec,
  Slide,
} from "@/lib/types";
import { ColorField, NumberField } from "./element-panel";

type Props = {
  slide: Slide;
  device: Device;
  orientation: Orientation;
  onChange: (patch: Partial<Slide>) => void;
};

// Current rect of a device slot: explicit transform, else the layout default.
export function currentDeviceRect(
  slide: Slide,
  device: Device,
  orientation: Orientation,
  id: DeviceElementId,
): ElementTransform | undefined {
  const saved = slide.transforms?.[id];
  if (saved) return saved;
  const def = defaultRectsFor(slide.layout, device, orientation)[id];
  return def ? { ...def } : undefined;
}

export function DevicePanel({ slide, device, orientation, onChange }: Props) {
  const { cW } = getCanvasSize(device, orientation);
  const rect = currentDeviceRect(slide, device, orientation, "device");
  const shadow = slide.deviceShadow;

  function resize(widthPct: number) {
    if (!rect) return;
    const clamped = Math.max(10, Math.min(200, widthPct));
    const newW = (clamped / 100) * cW;
    const scale = newW / rect.width;
    const newH = rect.height * scale;
    // Keep the mockup's center anchored so numeric resizing doesn't drift.
    const next: ElementTransform = {
      ...rect,
      x: rect.x + (rect.width - newW) / 2,
      y: rect.y + (rect.height - newH) / 2,
      width: newW,
      height: newH,
    };
    onChange({ transforms: { ...(slide.transforms || {}), device: next } });
  }

  function patchShadow(patch: Partial<ShadowSpec>) {
    onChange({ deviceShadow: { ...(shadow || DEFAULT_SHADOW), ...patch } });
  }

  const widthPct = rect ? Math.round((rect.width / cW) * 1000) / 10 : 0;

  return (
    <div className="space-y-2.5 rounded-md border bg-muted/30 p-3">
      <Label className="text-xs font-semibold">Mockup</Label>

      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Body color</Label>
        <div className="flex flex-wrap gap-1.5">
          {FRAME_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() =>
                onChange({ frameColor: slide.frameColor === c.id ? undefined : c.id })
              }
              className={`h-7 w-7 rounded-full border-2 transition-all ${
                slide.frameColor === c.id
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-foreground/40"
              }`}
              style={{ background: c.swatch }}
              title={c.label}
              aria-label={`Frame color ${c.label}`}
            />
          ))}
        </div>
      </div>

      {rect && (
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-[11px] text-muted-foreground">Width, % of canvas</Label>
            <NumberField
              min={10}
              max={200}
              step={1}
              className="h-8 text-xs"
              value={widthPct}
              onCommit={resize}
              ariaLabel="Mockup width, % of canvas"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-[11px]"
            onClick={() =>
              onChange({
                transforms: slide.transforms
                  ? Object.fromEntries(
                      Object.entries(slide.transforms).filter(([k]) => k !== "device" && k !== "deviceSecondary"),
                    )
                  : undefined,
              })
            }
            title="Reset mockup position and size to the layout default"
          >
            Reset placement
          </Button>
        </div>
      )}

      <div className="space-y-2 rounded border border-dashed p-2">
        <label className="flex items-center gap-2 text-[11px] font-medium">
          <input
            type="checkbox"
            checked={shadow ? shadow.enabled : false}
            onChange={(e) => patchShadow({ enabled: e.target.checked })}
          />
          Custom shadow
        </label>
        {shadow?.enabled && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <ColorField
                label="Color"
                value={shadow.color}
                onChange={(color) => patchShadow({ color })}
              />
              <SliderField
                label="Opacity"
                value={Math.round(shadow.opacity * 100)}
                min={0}
                max={100}
                suffix="%"
                onChange={(v) => patchShadow({ opacity: v / 100 })}
              />
            </div>
            <SliderField
              label="Blur"
              value={shadow.blur}
              min={0}
              max={300}
              suffix="px"
              onChange={(blur) => patchShadow({ blur })}
            />
            <div className="grid grid-cols-2 gap-2">
              <SliderField
                label="Offset X"
                value={shadow.offsetX}
                min={-150}
                max={150}
                suffix="px"
                onChange={(offsetX) => patchShadow({ offsetX })}
              />
              <SliderField
                label="Offset Y"
                value={shadow.offsetY}
                min={-150}
                max={150}
                suffix="px"
                onChange={(offsetY) => patchShadow({ offsetY })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-muted-foreground">{label}</Label>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label={label}
      />
    </div>
  );
}
