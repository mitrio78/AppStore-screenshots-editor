"use client";
import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LAYOUT_HINT, LAYOUT_LABEL } from "@/lib/constants";
import type {
  Device,
  ElementTransform,
  Orientation,
  SelectableId,
  Slide,
  SlideLayout,
  ThemeId,
} from "@/lib/types";
import { BackgroundPanel } from "./background-panel";
import { DevicePanel } from "./device-panel";
import { ElementPanel, type ClipboardMode, type ElementPatch, type LayerDir } from "./element-panel";
import { ScreenshotPicker } from "./screenshot-picker";

type Props = {
  slide: Slide;
  device: Device;
  orientation: Orientation;
  themeId: ThemeId;
  locale: string;
  selectedElementId: SelectableId | null;
  clipboardMode: ClipboardMode;
  onChange: (patch: Partial<Slide>) => void;
  onThemeChange: (id: ThemeId) => void;
  onApplyBackgroundToDeck: () => void;
  onClipboardModeChange: (mode: ClipboardMode) => void;
  onAddText: () => void;
  onAddImage: (file: File) => void;
  onPatchElement: (id: string, patch: ElementPatch) => void;
  onPatchTransform: (id: SelectableId, patch: Partial<ElementTransform>) => void;
  onReorderLayer: (id: SelectableId, dir: LayerDir) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
};

export function Inspector({
  slide,
  device,
  orientation,
  themeId,
  locale,
  selectedElementId,
  clipboardMode,
  onChange,
  onThemeChange,
  onApplyBackgroundToDeck,
  onClipboardModeChange,
  onAddText,
  onAddImage,
  onPatchElement,
  onPatchTransform,
  onReorderLayer,
  onDeleteElement,
  onDuplicateElement,
}: Props) {
  const isFeatureGraphic = slide.layout === "feature-graphic";
  const isNoDevice = slide.layout === "no-device";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Slide settings</h2>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            editing · {locale.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{LAYOUT_HINT[slide.layout]}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Layout</Label>
          <Select
            value={slide.layout}
            onValueChange={(layout) => {
              const next = layout as SlideLayout;
              // Device placement is layout-specific; free elements are user
              // content and survive layout switches untouched.
              onChange({
                layout: next,
                transforms: undefined,
                screenshotSecondary:
                  next === "two-devices" ? slide.screenshotSecondary || slide.screenshot : undefined,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LAYOUT_LABEL).map(([layout, label]) => (
                <SelectItem key={layout} value={layout}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isFeatureGraphic && !isNoDevice && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              {slide.layout === "two-devices" ? "Front device screenshot" : "Screenshot"}
            </Label>
            <ScreenshotPicker
              label="Primary"
              value={slide.screenshot}
              onChange={(v) => onChange({ screenshot: v })}
            />
          </div>
        )}

        {slide.layout === "two-devices" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Back device screenshot</Label>
            <ScreenshotPicker
              label="Secondary (back layer)"
              value={slide.screenshotSecondary || ""}
              onChange={(v) => onChange({ screenshotSecondary: v })}
            />
          </div>
        )}

        {!isFeatureGraphic && (
          <BackgroundPanel
            background={slide.background}
            inverted={!!slide.inverted}
            themeId={themeId}
            onChange={(background) => onChange({ background })}
            onInvertedChange={(inverted) => onChange({ inverted: inverted || undefined })}
            onThemeChange={onThemeChange}
            onApplyToDeck={onApplyBackgroundToDeck}
          />
        )}

        {!isFeatureGraphic && !isNoDevice && (
          <DevicePanel
            slide={slide}
            device={device}
            orientation={orientation}
            onChange={onChange}
          />
        )}

        {!isFeatureGraphic && (
          <ElementPanel
            slide={slide}
            selectedElementId={selectedElementId}
            clipboardMode={clipboardMode}
            onClipboardModeChange={onClipboardModeChange}
            onAddText={onAddText}
            onAddImage={onAddImage}
            onPatchElement={onPatchElement}
            onPatchTransform={onPatchTransform}
            onReorderLayer={onReorderLayer}
            onDeleteElement={onDeleteElement}
            onDuplicateElement={onDuplicateElement}
          />
        )}

        {isFeatureGraphic && (
          <p className="rounded-md border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
            Shows app icon + name + tagline (click the tagline on the canvas to edit it). Drop an icon at <span className="rounded bg-background px-1 py-0.5 font-mono text-[10px] text-foreground">/public/app-icon.png</span> (or leave blank — the app initial will be used). Name is set in the toolbar.
          </p>
        )}
      </div>
    </div>
  );
}
