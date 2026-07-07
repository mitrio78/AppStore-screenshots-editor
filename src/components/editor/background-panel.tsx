"use client";
import * as React from "react";
import { ArrowLeftRight, GalleryHorizontal, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { THEMES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { getCanvasSize } from "@/lib/layout-rects";
import type { Background, Device, GradientStop, Orientation, ThemeId } from "@/lib/types";
import { ColorField, NumberField } from "./element-panel";
import { ScreenshotPicker } from "./screenshot-picker";

type Props = {
  background: Background | undefined;
  inverted: boolean;
  themeId: ThemeId;
  device: Device;
  orientation: Orientation;
  slideIndex: number;
  slideCount: number;
  onChange: (bg: Background | undefined) => void;
  onInvertedChange: (inverted: boolean) => void;
  onThemeChange: (id: ThemeId) => void;
  onApplyToDeck: () => void;
  onSpreadPanorama: (count: number) => void;
};

type BgKind = "theme" | "solid" | "gradient" | "image";

const DEFAULT_GRADIENT: Background = {
  type: "gradient",
  angle: 160,
  stops: [
    { color: "#0B1020", position: 0 },
    { color: "#31427A", position: 1 },
  ],
};

export function BackgroundPanel({
  background,
  inverted,
  themeId,
  device,
  orientation,
  slideIndex,
  slideCount,
  onChange,
  onInvertedChange,
  onThemeChange,
  onApplyToDeck,
  onSpreadPanorama,
}: Props) {
  const { messages: m, themeName } = useI18n();
  const kind: BgKind = background?.type || "theme";

  function switchKind(next: BgKind) {
    if (next === kind) return;
    if (next === "theme") onChange(undefined);
    else if (next === "solid") onChange({ type: "solid", color: THEMES[themeId].bg });
    else if (next === "gradient") onChange(DEFAULT_GRADIENT);
    else onChange({ type: "image", src: "", fit: "cover" });
  }

  return (
    <div className="space-y-2.5 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{m.background.title}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] text-muted-foreground"
          onClick={onApplyToDeck}
          title={m.background.applyToAllTitle}
        >
          {m.background.applyToAllSlides}
        </Button>
      </div>

      <Select value={kind} onValueChange={(v) => switchKind(v as BgKind)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="theme">{m.background.theme}</SelectItem>
          <SelectItem value="solid">{m.background.solid}</SelectItem>
          <SelectItem value="gradient">{m.background.gradient}</SelectItem>
          <SelectItem value="image">{m.background.image}</SelectItem>
        </SelectContent>
      </Select>

      {kind === "theme" && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1.5">
            {Object.values(THEMES).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onThemeChange(t.id)}
                className={`h-9 rounded border-2 transition-all ${
                  t.id === themeId ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-foreground/30"
                }`}
                style={{ background: `linear-gradient(135deg, ${t.bg} 55%, ${t.accent} 130%)` }}
                title={themeName(t.id)}
                aria-label={m.background.themeAria(themeName(t.id))}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={inverted}
              onChange={(e) => onInvertedChange(e.target.checked)}
            />
            {m.background.inverted}
          </label>
        </div>
      )}

      {background?.type === "solid" && (
        <ColorField
          label={m.background.color}
          value={background.color}
          onChange={(color) => onChange({ ...background, color })}
        />
      )}

      {background?.type === "gradient" && (
        <GradientControls
          bg={background}
          device={device}
          orientation={orientation}
          slideIndex={slideIndex}
          slideCount={slideCount}
          onChange={onChange}
          onSpreadPanorama={onSpreadPanorama}
        />
      )}

      {background?.type === "image" && (
        <ImageControls
          bg={background}
          device={device}
          orientation={orientation}
          slideIndex={slideIndex}
          slideCount={slideCount}
          onChange={onChange}
          onSpreadPanorama={onSpreadPanorama}
        />
      )}
    </div>
  );
}

function GradientControls({
  bg,
  device,
  orientation,
  slideIndex,
  slideCount,
  onChange,
  onSpreadPanorama,
}: {
  bg: Extract<Background, { type: "gradient" }>;
  device: Device;
  orientation: Orientation;
  slideIndex: number;
  slideCount: number;
  onChange: (bg: Background) => void;
  onSpreadPanorama: (count: number) => void;
}) {
  const { messages: m } = useI18n();
  function patchStop(i: number, patch: Partial<GradientStop>) {
    const stops = bg.stops.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    onChange({ ...bg, stops });
  }

  // Mirror the gradient: each stop's position → (1 - position), then re-sort.
  // Flips which color sits at each end in one click.
  function reverse() {
    const stops = bg.stops
      .map((s) => ({ color: s.color, position: Math.round((1 - s.position) * 1000) / 1000 }))
      .sort((a, b) => a.position - b.position);
    onChange({ ...bg, stops });
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] text-muted-foreground">{m.background.angle}</Label>
          <div className="flex items-center gap-2">
            <span className="text-[11px] tabular-nums text-muted-foreground">{bg.angle}°</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={reverse}
              title={m.background.invertGradient}
              aria-label={m.background.invertGradient}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          step={5}
          value={bg.angle}
          onChange={(e) => onChange({ ...bg, angle: Number(e.target.value) })}
          className="w-full"
          aria-label={m.background.gradientAngle}
        />
      </div>

      <div className="space-y-1.5">
        {bg.stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(stop.color) ? stop.color : "#000000"}
              onChange={(e) => patchStop(i, { color: e.target.value })}
              className="h-7 w-7 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
              aria-label={m.background.stopColor(i)}
            />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(stop.position * 100)}
              onChange={(e) => patchStop(i, { position: Number(e.target.value) / 100 })}
              className="flex-1"
              aria-label={m.background.stopPosition(i)}
            />
            <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">
              {Math.round(stop.position * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={bg.stops.length <= 2}
              onClick={() => onChange({ ...bg, stops: bg.stops.filter((_, idx) => idx !== i) })}
              title={m.background.removeStop(i)}
              aria-label={m.background.removeStop(i)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-full text-[11px]"
          onClick={() => {
            const last = bg.stops[bg.stops.length - 1];
            onChange({
              ...bg,
              stops: [...bg.stops, { color: last?.color || "#888888", position: 1 }],
            });
          }}
        >
          <Plus className="h-3 w-3" /> {m.background.addStop}
        </Button>
      </div>

      {bg.span && bg.span > 1 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-muted-foreground">{m.background.horizontalOffset}</Label>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {Math.round((bg.offsetX ?? 0) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round((bg.offsetX ?? 0) * 100)}
            onChange={(e) => onChange({ ...bg, offsetX: Number(e.target.value) / 100 })}
            className="w-full"
            aria-label={m.background.panoramaOffset}
          />
        </div>
      )}

      <SpreadAcrossDeck
        kind="gradient"
        device={device}
        orientation={orientation}
        slideIndex={slideIndex}
        slideCount={slideCount}
        onSpread={onSpreadPanorama}
      />
    </div>
  );
}

// Shared "spread this background as a panorama over N slides" control, used by
// both the gradient and image background panels.
function SpreadAcrossDeck({
  kind,
  device,
  orientation,
  slideIndex,
  slideCount,
  onSpread,
}: {
  kind: "image" | "gradient";
  device: Device;
  orientation: Orientation;
  slideIndex: number;
  slideCount: number;
  onSpread: (count: number) => void;
}) {
  const { messages: m } = useI18n();
  const maxSpread = Math.max(0, slideCount - Math.max(slideIndex, 0));
  const [spreadCount, setSpreadCount] = React.useState(Math.max(2, maxSpread));
  React.useEffect(() => {
    setSpreadCount((c) => Math.max(2, Math.min(c, Math.max(2, maxSpread))));
  }, [maxSpread]);
  const { cW, cH } = getCanvasSize(device, orientation);

  return (
    <div className="space-y-1.5 rounded border border-dashed p-2">
      <Label className="text-[11px] font-medium">{m.background.panoramaAcrossDeck}</Label>
      {maxSpread >= 2 ? (
        <>
          <div className="flex items-center gap-1.5">
            <NumberField
              min={2}
              max={maxSpread}
              step={1}
              className="h-8 w-16 text-xs"
              value={spreadCount}
              onCommit={setSpreadCount}
              ariaLabel={m.background.panoramaSlideCount}
            />
            <span className="text-[11px] text-muted-foreground">{m.background.slides}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto h-8 text-[11px]"
              onClick={() => onSpread(spreadCount)}
              title={m.background.spreadTitle(slideIndex + 1, slideIndex + spreadCount)}
            >
              <GalleryHorizontal className="h-3.5 w-3.5" /> {m.background.spread}
            </Button>
          </div>
          <p className="text-[10px] leading-snug text-muted-foreground">
            {m.background.panoramaHelpIntro(slideIndex + 1, slideIndex + spreadCount)}{" "}
            {kind === "image"
              ? m.background.panoramaHelpImage(spreadCount * cW, cH)
              : m.background.panoramaHelpGradient}
          </p>
        </>
      ) : (
        <p className="text-[10px] text-muted-foreground">
          {m.background.panoramaNeedsEarlier}
        </p>
      )}
    </div>
  );
}

function ImageControls({
  bg,
  device,
  orientation,
  slideIndex,
  slideCount,
  onChange,
  onSpreadPanorama,
}: {
  bg: Extract<Background, { type: "image" }>;
  device: Device;
  orientation: Orientation;
  slideIndex: number;
  slideCount: number;
  onChange: (bg: Background) => void;
  onSpreadPanorama: (count: number) => void;
}) {
  const { messages: m } = useI18n();
  return (
    <div className="space-y-2">
      <ScreenshotPicker
        label={m.background.backgroundImage}
        value={bg.src}
        onChange={(src) => onChange({ ...bg, src })}
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">{m.background.fit}</Label>
          <Select
            value={bg.fit}
            onValueChange={(fit) => onChange({ ...bg, fit: fit as typeof bg.fit })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">{m.background.cover}</SelectItem>
              <SelectItem value="contain">{m.background.contain}</SelectItem>
              <SelectItem value="panorama">{m.background.panorama}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-muted-foreground">{m.background.blur}</Label>
            <span className="text-[10px] tabular-nums text-muted-foreground">{bg.blur || 0}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={80}
            step={1}
            value={bg.blur || 0}
            onChange={(e) => onChange({ ...bg, blur: Number(e.target.value) || undefined })}
            className="mt-2 w-full"
            aria-label={m.background.backgroundBlur}
          />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] text-muted-foreground">{m.background.opacity}</Label>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {Math.round((bg.opacity ?? 1) * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={100}
          step={1}
          value={Math.round((bg.opacity ?? 1) * 100)}
          onChange={(e) => {
            const v = Number(e.target.value) / 100;
            onChange({ ...bg, opacity: v >= 1 ? undefined : v });
          }}
          className="w-full"
          aria-label={m.background.backgroundImageOpacity}
        />
      </div>
      {bg.fit === "panorama" && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-muted-foreground">{m.background.horizontalOffset}</Label>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {Math.round((bg.offsetX ?? 0) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round((bg.offsetX ?? 0) * 100)}
            onChange={(e) => onChange({ ...bg, offsetX: Number(e.target.value) / 100 })}
            className="w-full"
            aria-label={m.background.panoramaOffset}
          />
        </div>
      )}
      {!!bg.src && (
        <SpreadAcrossDeck
          kind="image"
          device={device}
          orientation={orientation}
          slideIndex={slideIndex}
          slideCount={slideCount}
          onSpread={onSpreadPanorama}
        />
      )}
      <Input
        value={bg.src}
        onChange={(e) => onChange({ ...bg, src: e.target.value })}
        placeholder={m.background.imagePathPlaceholder}
        className="h-7 font-mono text-[10px]"
        spellCheck={false}
      />
    </div>
  );
}
