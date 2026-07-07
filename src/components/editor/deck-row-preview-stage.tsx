"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n";
import type { Device, Orientation, Slide, Theme } from "@/lib/types";
import { getCanvas, SlideCanvas } from "./slide-canvas";

type Props = {
  slides: Slide[];
  activeSlideId: string | null;
  device: Device;
  orientation: Orientation;
  theme: Theme;
  locale: string;
  appName?: string;
  appIcon?: string;
  onSelectSlide: (id: string) => void;
};

export function DeckRowPreviewStage({
  slides,
  activeSlideId,
  device,
  orientation,
  theme,
  locale,
  appName,
  appIcon,
  onSelectSlide,
}: Props) {
  const { deviceLabel, messages: m } = useI18n();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.18);
  const { cW, cH } = getCanvas(device, orientation);
  const gap = Math.round(cW * 0.035);
  const rowWidth = slides.length * cW + Math.max(0, slides.length - 1) * gap;
  const rowHeight = cH;

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const heightScale = (rect.height - 112) / cH;
      const widthScale = slides.length > 0 ? (rect.width - 96) / rowWidth : heightScale;
      const fitSmallDeck = slides.length <= 3 ? widthScale : heightScale;
      setScale(Math.max(0.035, Math.min(0.28, heightScale, fitSmallDeck)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cH, rowWidth, slides.length]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full flex-col overflow-hidden bg-neutral-200 dark:bg-neutral-800"
    >
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">{m.preview.storeRowTitle}</span>
        <span aria-hidden>·</span>
        <span>{deviceLabel(device)}</span>
        <span aria-hidden>·</span>
        <span>{locale.toUpperCase()}</span>
      </div>

      {slides.length > 0 ? (
        <div className="flex-1 overflow-auto px-8 pb-10 pt-14">
          <div
            className="mx-auto"
            style={{
              width: rowWidth * scale,
              height: rowHeight * scale,
              minWidth: rowWidth * scale,
            }}
          >
            <div
              className="flex"
              style={{
                width: rowWidth,
                height: rowHeight,
                gap,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              {slides.map((slide, index) => {
                const active = slide.id === activeSlideId;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    className="relative shrink-0 overflow-hidden border-0 bg-white p-0 text-left transition"
                    style={{
                      width: cW,
                      height: cH,
                      borderRadius: 14 / scale,
                      boxShadow: active
                        ? `0 0 0 ${Math.max(2, 4 / scale)}px hsl(var(--primary)), 0 ${20 / scale}px ${46 / scale}px rgba(0,0,0,0.28)`
                        : `0 ${18 / scale}px ${40 / scale}px rgba(0,0,0,0.22)`,
                    }}
                    aria-label={m.preview.selectRowSlide(index)}
                    title={m.preview.selectRowSlide(index)}
                    onClick={() => onSelectSlide(slide.id)}
                  >
                    <SlideCanvas
                      slide={slide}
                      device={device}
                      orientation={orientation}
                      theme={theme}
                      locale={locale}
                      appName={appName}
                      appIcon={appIcon}
                      editable={false}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{m.preview.storeRowEmptyTitle}</p>
          <p>{m.preview.storeRowEmptyHint}</p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 text-[10px] tabular-nums text-muted-foreground">
        <span>{slides.length}×</span>
        <span>{cW}×{cH}</span>
        <span aria-hidden>·</span>
        <span>{(scale * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
