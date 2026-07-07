"use client";
import * as React from "react";
import { hexToRgba } from "@/lib/background";
import { PHONE_SCREEN, getFrameColor } from "@/lib/constants";
import { img } from "@/lib/image-cache";
import { useI18n } from "@/lib/i18n";
import type { ShadowSpec } from "@/lib/types";

export type FrameProps = {
  src: string;
  alt?: string;
  style?: React.CSSProperties;
  /** When true, hide EmptySlot placeholder (so it doesn't bake into exports). */
  hideEmpty?: boolean;
  /**
   * Custom mockup shadow. undefined → the frame's built-in default shadow;
   * {enabled:false} → no outer shadow at all; {enabled:true,...} → drop-shadow.
   */
  shadow?: ShadowSpec;
  /** Mockup body color id (see FRAME_COLORS); undefined → device default. */
  frameColor?: string;
  /** When set, the frame accepts image files dragged from the OS. */
  onDropFile?: (file: File) => void;
};

function shadowFilter(shadow?: ShadowSpec): string | undefined {
  if (!shadow || !shadow.enabled) return undefined;
  return `drop-shadow(${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${hexToRgba(shadow.color, shadow.opacity)})`;
}

// Built-in outer shadow is used only while the slide has no explicit
// deviceShadow, so the shadow panel fully takes over once engaged.
function outerBoxShadow(shadow: ShadowSpec | undefined, builtin: string): string {
  const inset = "inset 0 0 0 1px rgba(255,255,255,0.08)";
  if (shadow === undefined) return `${inset}, ${builtin}`;
  return inset;
}

function hasFiles(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer?.types || []).includes("Files");
}

function useFileDrop(onDropFile?: (file: File) => void) {
  const [active, setActive] = React.useState(false);
  const props: React.HTMLAttributes<HTMLDivElement> = onDropFile
    ? {
        onDragOver: (e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          e.stopPropagation();
          if (!active) setActive(true);
        },
        onDragLeave: (e) => {
          if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
            setActive(false);
          }
        },
        onDrop: (e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          e.stopPropagation();
          setActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onDropFile(file);
        },
      }
    : {};
  return { active: active && !!onDropFile, props };
}

function DropOverlay({ active }: { active: boolean }) {
  const { messages: m } = useI18n();
  if (!active) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(59,130,246,0.25)",
        boxShadow: "inset 0 0 0 4px rgba(59,130,246,0.9)",
        color: "#fff",
        fontSize: "min(3vw, 18px)",
        fontWeight: 600,
        textShadow: "0 1px 4px rgba(0,0,0,0.5)",
        pointerEvents: "none",
      }}
    >
      {m.canvas.dropScreenshot}
    </div>
  );
}

// iPhone — uses pre-measured mockup.png overlay
export function Phone({ src, alt = "", style, hideEmpty, shadow, frameColor, onDropFile }: FrameProps) {
  const resolved = img(src);
  const drop = useFileDrop(onDropFile);
  const bodyFilter = getFrameColor(frameColor)?.iphoneFilter;
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "1022 / 2082",
        filter: shadowFilter(shadow),
        ...style,
      }}
      {...drop.props}
    >
      <img
        src={img("/mockup.png")}
        alt=""
        style={{ display: "block", width: "100%", height: "100%", filter: bodyFilter }}
        draggable={false}
      />
      <div
        style={{
          position: "absolute",
          zIndex: 10,
          overflow: "hidden",
          left: `${PHONE_SCREEN.L}%`,
          top: `${PHONE_SCREEN.T}%`,
          width: `${PHONE_SCREEN.W}%`,
          height: `${PHONE_SCREEN.H}%`,
          borderRadius: `${PHONE_SCREEN.RX}% / ${PHONE_SCREEN.RY}%`,
          background: "#111",
        }}
      >
        {resolved ? (
          <img
            src={resolved}
            alt={alt}
            style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
            draggable={false}
          />
        ) : hideEmpty ? null : (
          <EmptySlot />
        )}
        <DropOverlay active={drop.active} />
      </div>
    </div>
  );
}

type CssFrameSpec = {
  aspectRatio: string;
  frameRadius: string;
  frameBackground: string;
  builtinShadow: string;
  camera: React.CSSProperties;
  screen: React.CSSProperties;
};

function CssFrame({
  spec,
  src,
  alt,
  style,
  hideEmpty,
  shadow,
  frameColor,
  onDropFile,
}: FrameProps & { spec: CssFrameSpec }) {
  const resolved = img(src);
  const drop = useFileDrop(onDropFile);
  const color = getFrameColor(frameColor);
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: spec.aspectRatio,
        filter: shadowFilter(shadow),
        ...style,
      }}
      {...drop.props}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: spec.frameRadius,
          background: color?.bezel ?? spec.frameBackground,
          boxShadow: outerBoxShadow(shadow, spec.builtinShadow),
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            zIndex: 20,
            ...spec.camera,
            ...(color ? { background: color.camera } : {}),
          }}
        />
        <div style={{ position: "absolute", overflow: "hidden", background: "#000", ...spec.screen }}>
          {resolved ? (
            <img
              src={resolved}
              alt={alt || ""}
              style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
              draggable={false}
            />
          ) : hideEmpty ? null : (
            <EmptySlot />
          )}
          <DropOverlay active={drop.active} />
        </div>
      </div>
    </div>
  );
}

const ANDROID_PHONE: CssFrameSpec = {
  aspectRatio: "9 / 19.5",
  frameRadius: "8% / 4%",
  frameBackground: "linear-gradient(160deg, #2a2a2e 0%, #18181b 100%)",
  builtinShadow: "0 8px 40px rgba(0,0,0,0.55)",
  camera: {
    top: "1.5%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "3%",
    height: "1.4%",
    borderRadius: "50%",
    background: "#0d0d0f",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  screen: {
    left: "3.5%",
    top: "2%",
    width: "93%",
    height: "96%",
    borderRadius: "5.5% / 2.6%",
  },
};

const ANDROID_TABLET_P: CssFrameSpec = {
  aspectRatio: "5 / 8",
  frameRadius: "4.5% / 2.8%",
  frameBackground: "linear-gradient(160deg, #2a2a2e 0%, #18181b 100%)",
  builtinShadow: "0 8px 48px rgba(0,0,0,0.6)",
  camera: {
    top: "1.2%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "1.4%",
    height: "0.88%",
    borderRadius: "50%",
    background: "#0d0d0f",
  },
  screen: {
    left: "3.5%",
    top: "2.2%",
    width: "93%",
    height: "95.6%",
    borderRadius: "2.5% / 1.6%",
  },
};

const ANDROID_TABLET_L: CssFrameSpec = {
  aspectRatio: "8 / 5",
  frameRadius: "2.8% / 4.5%",
  frameBackground: "linear-gradient(160deg, #2a2a2e 0%, #18181b 100%)",
  builtinShadow: "0 8px 48px rgba(0,0,0,0.6)",
  camera: {
    left: "1.2%",
    top: "50%",
    transform: "translateY(-50%)",
    width: "0.88%",
    height: "1.4%",
    borderRadius: "50%",
    background: "#0d0d0f",
  },
  screen: {
    left: "2.2%",
    top: "3.5%",
    width: "95.6%",
    height: "93%",
    borderRadius: "1.6% / 2.5%",
  },
};

const IPAD_SPEC: CssFrameSpec = {
  aspectRatio: "770 / 1000",
  frameRadius: "5% / 3.6%",
  frameBackground: "linear-gradient(180deg, #2C2C2E 0%, #1C1C1E 100%)",
  builtinShadow: "0 8px 40px rgba(0,0,0,0.6)",
  camera: {
    top: "1.2%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "0.9%",
    height: "0.65%",
    borderRadius: "50%",
    background: "#111113",
  },
  screen: {
    left: "4%",
    top: "2.8%",
    width: "92%",
    height: "94.4%",
    borderRadius: "2.2% / 1.6%",
  },
};

export function AndroidPhone(props: FrameProps) {
  return <CssFrame spec={ANDROID_PHONE} {...props} />;
}

export function AndroidTabletP(props: FrameProps) {
  return <CssFrame spec={ANDROID_TABLET_P} {...props} />;
}

export function AndroidTabletL(props: FrameProps) {
  return <CssFrame spec={ANDROID_TABLET_L} {...props} />;
}

export function IPad(props: FrameProps) {
  return <CssFrame spec={IPAD_SPEC} {...props} />;
}

function EmptySlot() {
  const { messages: m } = useI18n();
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.4)",
        fontSize: "min(2vw, 14px)",
        background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
        textAlign: "center",
        padding: "4%",
      }}
    >
      {m.canvas.dropScreenshotHere}
    </div>
  );
}
