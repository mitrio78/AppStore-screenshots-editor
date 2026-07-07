"use client";
import * as React from "react";
import { Rnd } from "react-rnd";
import { cssForBackground, shade } from "@/lib/background";
import {
  getCanvasSize,
  getDefaultRects,
  getFrameAspect,
  getFrameWidthFns,
  type LayoutRects,
  type Rect,
} from "@/lib/layout-rects";
import { img } from "@/lib/image-cache";
import { pickText, resolveScreenshot } from "@/lib/locale";
import type {
  Device,
  DeviceElementId,
  ElementTransform,
  Orientation,
  SelectableId,
  ShadowSpec,
  Slide,
  TextElement,
  Theme,
} from "@/lib/types";
import {
  AndroidPhone,
  AndroidTabletL,
  AndroidTabletP,
  IPad,
  Phone,
  type FrameProps,
} from "./device-frames";
import { EditableText, FreeElementView, textElementStyle } from "./free-element";

type FrameComp = React.ComponentType<FrameProps>;

export function getCanvas(device: Device, orientation: Orientation) {
  return getCanvasSize(device, orientation);
}

export function getFrameForDevice(device: Device, orientation: Orientation): {
  Comp: FrameComp;
  widthFn: (cW: number, cH: number) => number;
  smallWidthFn: (cW: number, cH: number) => number;
} {
  const { widthFn, smallWidthFn } = getFrameWidthFns(device, orientation);
  switch (device) {
    case "iphone":
      return { Comp: Phone, widthFn, smallWidthFn };
    case "ipad":
      return { Comp: IPad, widthFn, smallWidthFn };
    case "android":
      return { Comp: AndroidPhone, widthFn, smallWidthFn };
    case "android-7":
    case "android-10":
      return {
        Comp: orientation === "landscape" ? AndroidTabletL : AndroidTabletP,
        widthFn,
        smallWidthFn,
      };
    default:
      return { Comp: Phone, widthFn, smallWidthFn };
  }
}

type EditHandlers = {
  onElementChange?: (id: SelectableId, t: ElementTransform) => void;
  onSelectElement?: (id: SelectableId | null) => void;
  onTextChange?: (elementId: string, v: string) => void;
  onDropScreenshot?: (slot: DeviceElementId, file: File) => void;
};

type Props = {
  slide: Slide;
  device: Device;
  orientation: Orientation;
  theme: Theme;
  locale: string;
  appName?: string;
  appIcon?: string;
  editable?: boolean;
  edit?: EditHandlers;
  selectedElementId?: SelectableId | null;
  // Preview scale (1.0 = full size). Used so react-rnd maps drag deltas correctly
  // when the canvas is rendered inside a CSS-transformed container.
  previewScale?: number;
  /** When true, suppress the "Drop a screenshot here" placeholder. Used for export. */
  hideEmpty?: boolean;
};

// ---------- Decorative blob (theme backgrounds only) ----------

function Blob({
  cW,
  color,
  x,
  y,
  size,
  opacity = 0.4,
}: {
  cW: number;
  color: string;
  x: number;
  y: number;
  size: number;
  opacity?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}%`,
        aspectRatio: "1 / 1",
        background: color,
        borderRadius: "50%",
        filter: `blur(${cW * 0.06}px)`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
}

function rectFor(
  id: DeviceElementId,
  slide: Slide,
  defaults: LayoutRects,
): Rect | undefined {
  const saved = slide.transforms?.[id];
  const def = defaults[id];
  if (!def && !saved) return undefined;
  if (!saved) return def;
  return { x: saved.x, y: saved.y, width: saved.width, height: saved.height };
}

// ---------- Alignment guides ----------

// Canvas-space positions of the active center guide lines (undefined = off).
type SnapGuides = { x?: number; y?: number };

// Magnetic snap zone, measured in *screen* pixels and converted to canvas
// pixels per preview zoom so it feels identical at any scale.
const SNAP_SCREEN_PX = 9;
const GUIDE_COLOR = "#FF375F";

// ---------- Main canvas ----------

export function SlideCanvas({
  slide,
  device,
  orientation,
  theme,
  locale,
  appName,
  appIcon,
  editable,
  edit,
  selectedElementId = null,
  previewScale = 1,
  hideEmpty,
}: Props) {
  const { cW, cH } = getCanvas(device, orientation);
  // Active center guides while dragging (editable canvas only).
  const [guides, setGuides] = React.useState<SnapGuides>({});
  // onDrag fires per mousemove — bail out unless the guide values actually
  // changed, otherwise every mouse move re-renders the whole canvas tree.
  const handleGuides = React.useCallback((g: SnapGuides | null) => {
    setGuides((prev) => {
      const x = g?.x;
      const y = g?.y;
      if (prev.x === x && prev.y === y) return prev;
      return { x, y };
    });
  }, []);
  const screenshot = resolveScreenshot(slide.screenshot, locale);
  const screenshotSecondary = resolveScreenshot(slide.screenshotSecondary, locale);
  const { Comp: Frame } = getFrameForDevice(device, orientation);
  const inverted = !!slide.inverted;
  const bg = cssForBackground(slide.background, theme, inverted, locale);
  const frameAspect = getFrameAspect(device, orientation);
  const { widthFn, smallWidthFn } = getFrameWidthFns(device, orientation);
  const defaults = getDefaultRects(
    slide.layout, cW, cH, frameAspect, widthFn(cW, cH), smallWidthFn(cW, cH),
  );

  // Special: feature-graphic layout — its own composition (not draggable).
  // The tagline is the slide's first text element so its copy stays localized
  // and agent-editable like everything else.
  if (slide.layout === "feature-graphic" || device === "feature-graphic") {
    const tagline = slide.elements.find((e): e is TextElement => e.kind === "text");
    return (
      <div
        className="slide-surface"
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${theme.bgAlt} 0%, ${shade(theme.bgAlt, -10)} 50%, ${theme.accent} 200%)`,
          display: "flex",
          alignItems: "center",
          padding: `0 ${cW * 0.06}px`,
          color: theme.fgAlt,
        }}
      >
        <Blob cW={cW} color={theme.accent} x={70} y={20} size={50} opacity={0.45} />
        <div style={{ display: "flex", alignItems: "center", gap: cW * 0.03, zIndex: 2 }}>
          {appIcon && img(appIcon) ? (
            <img
              src={img(appIcon)}
              alt=""
              style={{
                width: cW * 0.13,
                height: cW * 0.13,
                borderRadius: cW * 0.022,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              }}
              draggable={false}
            />
          ) : (
            <div
              aria-hidden
              style={{
                width: cW * 0.13,
                height: cW * 0.13,
                borderRadius: cW * 0.022,
                background: `linear-gradient(135deg, ${theme.accent}55, ${theme.accent})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.fgAlt,
                fontWeight: 800,
                fontSize: cW * 0.07,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              }}
            >
              {(appName || "A").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: cW * 0.06, fontWeight: 800, lineHeight: 1.05 }}>{appName || "App"}</div>
            {tagline && (
              <EditableText
                value={pickText(tagline.text, locale)}
                editable={editable}
                multiline
                onChange={(v) => edit?.onTextChange?.(tagline.id, v)}
                style={{
                  ...textElementStyle(tagline),
                  fontSize: cW * 0.028,
                  marginTop: cW * 0.012,
                  textAlign: "left",
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  const deviceRect = rectFor("device", slide, defaults);
  const secondaryRect = rectFor("deviceSecondary", slide, defaults);

  function renderDevice(
    id: DeviceElementId,
    rect: Rect,
    src: string,
    extraStyle?: React.CSSProperties,
  ) {
    const saved = slide.transforms?.[id];
    const rotation = saved?.rotation ?? 0;
    const zIndex = saved?.zIndex ?? (id === "deviceSecondary" ? 2 : 3);
    return (
      <Movable
        rect={rect}
        cW={cW}
        cH={cH}
        editable={editable}
        previewScale={previewScale}
        rotation={rotation}
        onChange={(t) =>
          edit?.onElementChange?.(id, {
            ...t,
            rotation,
            zIndex,
          })
        }
        lockAspectRatio={frameAspect}
        zIndex={zIndex}
        allowOverflow
        selected={selectedElementId === id}
        onSelect={() => edit?.onSelectElement?.(id)}
        onGuides={handleGuides}
      >
        <Frame
          src={src}
          hideEmpty={hideEmpty}
          shadow={slide.deviceShadow}
          frameColor={slide.frameColor}
          onDropFile={
            editable && edit?.onDropScreenshot
              ? (file) => edit.onDropScreenshot?.(id, file)
              : undefined
          }
          style={{ width: "100%", height: "100%", ...extraStyle }}
        />
      </Movable>
    );
  }

  function renderFreeElements() {
    return slide.elements.map((el) => {
      const t = el.transform;
      return (
        <Movable
          key={el.id}
          rect={t}
          cW={cW}
          cH={cH}
          editable={editable}
          previewScale={previewScale}
          rotation={t.rotation ?? 0}
          onChange={(next) =>
            edit?.onElementChange?.(el.id, {
              ...t,
              ...next,
            })
          }
          lockAspectRatio={el.kind === "image" ? t.width / Math.max(t.height, 1) : undefined}
          zIndex={t.zIndex ?? 4}
          allowOverflow
          selected={selectedElementId === el.id}
          onSelect={() => edit?.onSelectElement?.(el.id)}
          onGuides={handleGuides}
        >
          <FreeElementView
            el={el}
            locale={locale}
            editable={editable}
            onTextChange={(v) => edit?.onTextChange?.(el.id, v)}
            onFocus={() => edit?.onSelectElement?.(el.id)}
          />
        </Movable>
      );
    });
  }

  // Click on empty background area deselects any active element. Movable
  // children sit absolutely-positioned inside this root; checking that the
  // event landed directly on the root (not bubbled up from a child) keeps
  // device/element clicks from accidentally deselecting.
  const handleBackgroundMouseDown = editable
    ? (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) edit?.onSelectElement?.(null);
      }
    : undefined;

  return (
    <div
      onMouseDown={handleBackgroundMouseDown}
      className="slide-surface"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        color: inverted ? theme.fgAlt : theme.fg,
        ...bg.root,
      }}
    >
      {bg.imageLayer && <div aria-hidden style={bg.imageLayer} />}
      {bg.isTheme && (
        <>
          <Blob cW={cW} color={theme.accent} x={-15} y={-10} size={55} opacity={inverted ? 0.25 : 0.32} />
          <Blob cW={cW} color={theme.accent} x={70} y={75} size={45} opacity={inverted ? 0.18 : 0.25} />
        </>
      )}

      {secondaryRect &&
        renderDevice(
          "deviceSecondary",
          secondaryRect,
          screenshotSecondary || screenshot,
          { opacity: 0.85 },
        )}
      {deviceRect &&
        renderDevice("device", deviceRect, screenshot)}
      {renderFreeElements()}

      {editable && guides.x !== undefined && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: guides.x,
            top: 0,
            width: Math.max(1, 1.5 / previewScale),
            height: "100%",
            transform: "translateX(-50%)",
            background: GUIDE_COLOR,
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
      )}
      {editable && guides.y !== undefined && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: guides.y,
            left: 0,
            height: Math.max(1, 1.5 / previewScale),
            width: "100%",
            transform: "translateY(-50%)",
            background: GUIDE_COLOR,
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
      )}
    </div>
  );
}

// ---------- Movable wrapper ----------

// Fraction of an element's width/height that must remain inside the canvas
// when overflow is allowed. Keeps a graspable handle visible so the user can
// always drag the element back onto the canvas.
const MIN_VISIBLE_FRAC = 0.1;

function clampRect(
  r: { x: number; y: number; width: number; height: number },
  cW: number,
  cH: number,
  allowOverflow = false,
) {
  if (allowOverflow) {
    const width = r.width;
    const height = r.height;
    const minVisX = Math.max(8, width * MIN_VISIBLE_FRAC);
    const minVisY = Math.max(8, height * MIN_VISIBLE_FRAC);
    const x = Math.max(-(width - minVisX), Math.min(r.x, cW - minVisX));
    const y = Math.max(-(height - minVisY), Math.min(r.y, cH - minVisY));
    return { x, y, width, height };
  }
  const width = Math.min(r.width, cW);
  const height = Math.min(r.height, cH);
  const x = Math.max(0, Math.min(r.x, cW - width));
  const y = Math.max(0, Math.min(r.y, cH - height));
  return { x, y, width, height };
}

function Movable({
  rect,
  cW,
  cH,
  editable,
  previewScale,
  onChange,
  children,
  lockAspectRatio,
  zIndex,
  rotation = 0,
  allowOverflow = false,
  selected = false,
  onSelect,
  onGuides,
}: {
  rect: Rect;
  cW: number;
  cH: number;
  editable?: boolean;
  previewScale: number;
  onChange: (t: ElementTransform) => void;
  children: React.ReactNode;
  lockAspectRatio?: number | boolean;
  zIndex?: number;
  rotation?: number;
  allowOverflow?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onGuides?: (g: SnapGuides | null) => void;
}) {
  // Rotation lives on the inner wrapper so the Rnd's axis-aligned rect remains
  // the authoritative bounding box for drag/resize math. A bare mousedown
  // listener (no stopPropagation — that would prevent react-rnd from starting
  // a drag) marks the element as the current selection.
  const rotated = (
    <div
      onMouseDown={() => {
        if (editable) onSelect?.();
      }}
      style={{
        width: "100%",
        height: "100%",
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );

  // Non-editable (export) path: plain absolute-positioned div, no Rnd.
  if (!editable) {
    return (
      <div
        style={{
          position: "absolute",
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          zIndex,
        }}
      >
        {rotated}
      </div>
    );
  }

  const display = clampRect(rect, cW, cH, allowOverflow);

  // Magnetic zone in canvas px (constant in screen px → same feel at any zoom).
  const snapPx = SNAP_SCREEN_PX / Math.max(previewScale, 0.05);

  // Snap the element's center to the canvas center on each axis when within the
  // magnetic zone; returns the (possibly snapped) position plus which guides lit.
  // The element drags freely (react-rnd owns the live transform — controlling it
  // mid-drag fights the library); the snap is committed on release, which pins
  // the element exactly onto the guide.
  function snap(x: number, y: number): { x: number; y: number; g: SnapGuides } {
    const w = display.width;
    const h = display.height;
    const g: SnapGuides = {};
    let sx = x;
    let sy = y;
    if (Math.abs(x + w / 2 - cW / 2) <= snapPx) {
      sx = (cW - w) / 2;
      g.x = cW / 2;
    }
    if (Math.abs(y + h / 2 - cH / 2) <= snapPx) {
      sy = (cH - h) / 2;
      g.y = cH / 2;
    }
    return { x: sx, y: sy, g };
  }

  return (
    <Rnd
      bounds={allowOverflow ? undefined : "parent"}
      scale={previewScale}
      lockAspectRatio={lockAspectRatio}
      position={{ x: display.x, y: display.y }}
      size={{ width: display.width, height: display.height }}
      onDragStart={() => onSelect?.()}
      onResizeStart={() => onSelect?.()}
      onDrag={(_e, d) => {
        // Only light the guide while dragging; the position stays free.
        onGuides?.(snap(d.x, d.y).g);
      }}
      onDragStop={(_e, d) => {
        const s = snap(d.x, d.y);
        const next = clampRect(
          { x: s.x, y: s.y, width: display.width, height: display.height },
          cW,
          cH,
          allowOverflow,
        );
        onGuides?.(null);
        onChange(next);
      }}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        const next = clampRect(
          {
            x: position.x,
            y: position.y,
            width: parseFloat(ref.style.width),
            height: parseFloat(ref.style.height),
          },
          cW,
          cH,
          allowOverflow,
        );
        onChange(next);
      }}
      style={{ zIndex }}
      resizeHandleStyles={handleStyle}
      className={selected ? "rnd-editable rnd-selected" : "rnd-editable"}
    >
      {rotated}
    </Rnd>
  );
}

// Subtle resize handles (visible only on hover via globals.css).
const handleSize = 14;
const handleStyle: Record<string, React.CSSProperties> = {
  top: { height: handleSize },
  right: { width: handleSize },
  bottom: { height: handleSize },
  left: { width: handleSize },
  topRight: { width: handleSize, height: handleSize },
  bottomRight: { width: handleSize, height: handleSize },
  bottomLeft: { width: handleSize, height: handleSize },
  topLeft: { width: handleSize, height: handleSize },
};
