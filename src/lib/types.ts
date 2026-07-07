export type Device =
  | "iphone"
  | "ipad"
  | "android"
  | "android-7"
  | "android-10"
  | "feature-graphic";

export type Orientation = "portrait" | "landscape";

export type Platform = "ios" | "android";

// Layouts the editor can render. Vary across slides for visual rhythm.
export type SlideLayout =
  | "hero"             // centered device, headline above
  | "device-bottom"    // headline top, device bottom-center
  | "device-top"       // device top, headline bottom (contrast)
  | "two-devices"      // back + front phones, headline above
  | "no-device"        // big headline + decorative blob, no device
  | "split-landscape"  // landscape tablets only: caption left + device right
  | "feature-graphic"; // 1024×500 banner with icon + name + tagline

// Per-element rect in canvas pixel space. Optional rotation in degrees and zIndex.
export type ElementTransform = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
};

// The two fixed device slots. Free elements are addressed by their own ids, so
// anything selectable on the canvas is either a device slot or an element id.
export type DeviceElementId = "device" | "deviceSecondary";
export type SelectableId = DeviceElementId | string;

// Per-locale text keyed by locale code (e.g. "en", "de"). A locale is absent
// if the user hasn't typed anything for it; renderers fall back to en (see
// lib/locale.ts). The set of locales a project targets lives on
// ProjectState.locales.
export type LocalizedText = Partial<Record<string, string>>;

// ---------- Backgrounds ----------

export type GradientStop = { color: string; position: number }; // position 0..1

export type Background =
  | { type: "theme" }                       // derive from the project theme (default)
  | { type: "solid"; color: string }
  | { type: "gradient"; angle: number; stops: GradientStop[] }
  | {
      type: "image";
      src: string;                          // /screenshots/... | /backgrounds/... | data:
      fit: "cover" | "contain" | "panorama";
      blur?: number;                        // px at canvas resolution
      opacity?: number;                     // 0..1
      // Panorama support: with fit "panorama" the image renders at full canvas
      // height and horizontal position offsetX (0 = left edge, 1 = right edge).
      // Spreading one image across a deck = same src on every slide with
      // offsetX = i / (slideCount - 1).
      offsetX?: number;
    };

// ---------- Device mockup shadow ----------

export type ShadowSpec = {
  enabled: boolean;
  color: string;      // hex
  opacity: number;    // 0..1
  blur: number;       // px in canvas space
  offsetX: number;    // px
  offsetY: number;    // px
};

// ---------- Free elements (text + images) ----------

export type TextElement = {
  id: string;
  kind: "text";
  text: LocalizedText;
  fontFamily: string;                 // CSS family name from the font registry
  fontSize: number;                   // px in canvas space
  fontWeight: number;                 // 100..900
  color: string;
  align: "left" | "center" | "right";
  lineHeight: number;                 // multiplier (e.g. 1.05)
  letterSpacing?: number;             // px
  textTransform?: "none" | "uppercase";
  opacity?: number;                   // 0..1
  // Optional pill/chip background behind the text.
  box?: { color: string; padding: number; radius: number };
  transform: ElementTransform;        // free elements always carry an explicit rect
};

export type ImageElement = {
  id: string;
  kind: "image";
  src: string;                        // uploaded sticker/badge; may contain {locale}
  opacity?: number;
  transform: ElementTransform;
};

export type FreeElement = TextElement | ImageElement;

// ---------- Slide ----------

export type Slide = {
  id: string;
  layout: SlideLayout;
  screenshot: string;           // path under /screenshots/ — may contain {locale}
  screenshotSecondary?: string; // for two-devices layout — may contain {locale}
  inverted?: boolean;           // dark variant of the theme background
  background?: Background;      // absent → { type: "theme" }
  deviceShadow?: ShadowSpec;    // absent → frame's built-in default shadow
  frameColor?: string;          // mockup body finish id (see FRAME_COLORS); absent → device default
  // Placement overrides for the device slots; free elements carry their own transform.
  transforms?: Partial<Record<DeviceElementId, ElementTransform>>;
  elements: FreeElement[];
};

export type ThemeId = "clean-light" | "dark-bold" | "warm-editorial" | "ocean-fresh";

export type Theme = {
  id: ThemeId;
  name: string;
  bg: string;          // primary background
  bgAlt: string;       // inverted background
  fg: string;          // text on bg
  fgAlt: string;       // text on bgAlt
  accent: string;
  muted: string;
};

// ---------- Fonts ----------

export type FontAsset = {
  family: string;                 // CSS family name, e.g. "Oswald"
  file: string;                   // public path, e.g. "/fonts/oswald.woff2"; "" = system font
  weight: string;                 // "100 900" (variable) or "400"
  style?: "normal" | "italic";
  builtin?: boolean;
};

// ---------- Project ----------

export const SCHEMA_VERSION = 2;

export type ProjectState = {
  schemaVersion: typeof SCHEMA_VERSION;
  name: string;                 // display name for the project switcher, e.g. "FitLinkPro"
  appName: string;
  themeId: ThemeId;
  // Locales this project targets. Drives the toolbar dropdown and bulk export.
  // Single-locale projects ship as ["en"] and hide the locale UI.
  locales: string[];
  locale: string;
  device: Device;
  orientation: Orientation;
  // Per-device slide decks so platform switching preserves work
  slidesByDevice: Record<Device, Slide[]>;
  appIcon?: string;    // path under /public (e.g. /app-icon.png)
};

// Summary row returned by GET /api/projects.
export type ProjectSummary = {
  slug: string;
  name: string;
  appName: string;
  updatedAt: string; // ISO
};
