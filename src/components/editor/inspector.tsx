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
import { useI18n } from "@/lib/i18n";
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
import { LanguageSelect } from "./language-select";
import { ScreenshotPicker } from "./screenshot-picker";

type Props = {
  slide: Slide;
  device: Device;
  orientation: Orientation;
  themeId: ThemeId;
  locale: string;
  selectedElementId: SelectableId | null;
  clipboardMode: ClipboardMode;
  slideIndex: number;
  slideCount: number;
  onChange: (patch: Partial<Slide>) => void;
  onThemeChange: (id: ThemeId) => void;
  onApplyBackgroundToDeck: () => void;
  onSpreadPanorama: (count: number) => void;
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
  slideIndex,
  slideCount,
  onChange,
  onThemeChange,
  onApplyBackgroundToDeck,
  onSpreadPanorama,
  onClipboardModeChange,
  onAddText,
  onAddImage,
  onPatchElement,
  onPatchTransform,
  onReorderLayer,
  onDeleteElement,
  onDuplicateElement,
}: Props) {
  const { layoutLabel, layoutHint, messages: m } = useI18n();
  const isFeatureGraphic = slide.layout === "feature-graphic";
  const isNoDevice = slide.layout === "no-device";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">{m.inspector.title}</h2>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {m.inspector.editing} · {locale.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{layoutHint(slide.layout)}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <div className="space-y-2.5 rounded-md border bg-muted/30 p-3">
          <Label className="text-xs font-semibold">{m.inspector.editorSettings}</Label>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">{m.inspector.interfaceLanguage}</Label>
            <LanguageSelect triggerClassName="w-full" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{m.inspector.layout}</Label>
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
              {Object.keys(m.layouts.labels).map((layout) => (
                <SelectItem key={layout} value={layout}>
                  {layoutLabel(layout as SlideLayout)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isFeatureGraphic && !isNoDevice && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              {slide.layout === "two-devices" ? m.inspector.frontDeviceScreenshot : m.inspector.screenshot}
            </Label>
            <ScreenshotPicker
              label={m.inspector.primary}
              value={slide.screenshot}
              onChange={(v) => onChange({ screenshot: v })}
            />
          </div>
        )}

        {slide.layout === "two-devices" && (
          <div className="space-y-1.5">
            <Label className="text-xs">{m.inspector.backDeviceScreenshot}</Label>
            <ScreenshotPicker
              label={m.inspector.secondaryBackLayer}
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
            device={device}
            orientation={orientation}
            slideIndex={slideIndex}
            slideCount={slideCount}
            onChange={(background) => onChange({ background })}
            onInvertedChange={(inverted) => onChange({ inverted: inverted || undefined })}
            onThemeChange={onThemeChange}
            onApplyToDeck={onApplyBackgroundToDeck}
            onSpreadPanorama={onSpreadPanorama}
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
            {m.inspector.featureGraphicBeforePath}{" "}
            <span className="rounded bg-background px-1 py-0.5 font-mono text-[10px] text-foreground">/public/app-icon.png</span>{" "}
            {m.inspector.featureGraphicAfterPath}
          </p>
        )}
      </div>
    </div>
  );
}
