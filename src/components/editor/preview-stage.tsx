"use client";
import * as React from "react";
import { DEVICE_LABEL, LAYOUT_LABEL } from "@/lib/constants";
import type {
  Device,
  DeviceElementId,
  ElementTransform,
  Orientation,
  SelectableId,
  Slide,
  Theme,
} from "@/lib/types";
import { getCanvas, SlideCanvas } from "./slide-canvas";

type Props = {
  slide: Slide;
  device: Device;
  orientation: Orientation;
  theme: Theme;
  locale: string;
  appName?: string;
  appIcon?: string;
  selectedElementId: SelectableId | null;
  onTextChange: (elementId: string, v: string) => void;
  onElementChange: (id: SelectableId, t: ElementTransform) => void;
  onSelectElement: (id: SelectableId | null) => void;
  onDropScreenshot: (slot: DeviceElementId, file: File) => void;
};

// Fits the full-resolution canvas inside its container by measuring the
// container and applying transform: scale().
export function PreviewStage({
  slide,
  device,
  orientation,
  theme,
  locale,
  appName,
  appIcon,
  selectedElementId,
  onTextChange,
  onElementChange,
  onSelectElement,
  onDropScreenshot,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.2);
  const { cW, cH } = getCanvas(device, orientation);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const sx = (rect.width - 48) / cW;
      const sy = (rect.height - 48) / cH;
      setScale(Math.max(0.05, Math.min(sx, sy)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cW, cH]);

  return (
    <div
      ref={containerRef}
      // Neutral (untinted) gray backdrop so surrounding color doesn't bias how
      // the slide's colors are perceived; darker in dark mode.
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-neutral-200 dark:bg-neutral-800"
    >
      <div
        style={{
          width: cW,
          height: cH,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          flexShrink: 0,
          boxShadow: "0 40px 80px -30px rgba(0,0,0,0.32), 0 10px 24px -12px rgba(0,0,0,0.18)",
          background: "white",
          borderRadius: 12 / scale,
          overflow: "hidden",
        }}
      >
        <SlideCanvas
          slide={slide}
          device={device}
          orientation={orientation}
          theme={theme}
          locale={locale}
          appName={appName}
          appIcon={appIcon}
          editable
          previewScale={scale}
          selectedElementId={selectedElementId}
          edit={{ onTextChange, onElementChange, onSelectElement, onDropScreenshot }}
        />
      </div>

      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">{DEVICE_LABEL[device]}</span>
        <span aria-hidden>·</span>
        <span>{LAYOUT_LABEL[slide.layout]}</span>
        {orientation === "landscape" && (
          <>
            <span aria-hidden>·</span>
            <span>landscape</span>
          </>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 text-[10px] tabular-nums text-muted-foreground">
        <span>{cW}×{cH}</span>
        <span aria-hidden>·</span>
        <span>{(scale * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
