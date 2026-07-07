import type { Device, Orientation, ShadowSpec, SlideLayout, Theme, ThemeId } from "./types";

// ---------- Canvas dimensions (design at largest required resolution) ----------
export const CANVAS: Record<Device, { w: number; h: number; wL?: number; hL?: number }> = {
  iphone:        { w: 1320, h: 2868 },
  ipad:          { w: 2064, h: 2752 },
  android:       { w: 1080, h: 1920 },
  "android-7":   { w: 1200, h: 1920, wL: 1920, hL: 1200 },
  "android-10":  { w: 1600, h: 2560, wL: 2560, hL: 1600 },
  "feature-graphic": { w: 1024, h: 500 },
};

// ---------- Export sizes per device ----------
export type ExportSize = { label: string; w: number; h: number };

export const EXPORT_SIZES: Record<Device, ExportSize[]> = {
  iphone: [
    { label: '6.9"', w: 1320, h: 2868 },
    { label: '6.5"', w: 1284, h: 2778 },
    { label: '6.3"', w: 1206, h: 2622 },
    { label: '6.1"', w: 1125, h: 2436 },
  ],
  ipad: [
    { label: '13" iPad',       w: 2064, h: 2752 },
    { label: '12.9" iPad Pro', w: 2048, h: 2732 },
  ],
  android:       [{ label: "Phone",          w: 1080, h: 1920 }],
  "android-7":   [{ label: '7" Portrait',    w: 1200, h: 1920 }],
  "android-10":  [{ label: '10" Portrait',   w: 1600, h: 2560 }],
  "feature-graphic": [{ label: "Feature Graphic", w: 1024, h: 500 }],
};

// Landscape sizes (tablets only)
export const EXPORT_SIZES_LANDSCAPE: Partial<Record<Device, ExportSize[]>> = {
  "android-7":  [{ label: '7" Landscape',  w: 1920, h: 1200 }],
  "android-10": [{ label: '10" Landscape', w: 2560, h: 1600 }],
};

export function supportsLandscape(device: Device): boolean {
  return device in EXPORT_SIZES_LANDSCAPE;
}

export function getExportSizes(device: Device, orientation: Orientation): ExportSize[] {
  if (orientation === "landscape") {
    return EXPORT_SIZES_LANDSCAPE[device] || EXPORT_SIZES[device];
  }
  return EXPORT_SIZES[device];
}

// ---------- Frame aspect ratios ----------
export const MK_RATIO    = 1022 / 2082; // iPhone PNG mockup
export const TAB_P_RATIO = 0.667;        // tablet portrait
export const TAB_L_RATIO = 1.5;          // tablet landscape
export const IPAD_RATIO  = 0.770;        // iPad

// iPhone mockup screen overlay (pre-measured)
export const PHONE_SCREEN = {
  L: (52 / 1022) * 100,
  T: (46 / 2082) * 100,
  W: (918 / 1022) * 100,
  H: (1990 / 2082) * 100,
  RX: (126 / 918) * 100,
  RY: (126 / 1990) * 100,
};

// ---------- Width formula helpers ----------
export function phoneW(cW: number, cH: number, clamp = 0.84) {
  return Math.min(clamp, 0.72 * (cH / cW) * MK_RATIO);
}
export function phoneWSmall(cW: number, cH: number) {
  return phoneW(cW, cH, 0.66);
}
export function tabletPW(cW: number, cH: number, clamp = 0.80) {
  return Math.min(clamp, 0.72 * (cH / cW) * TAB_P_RATIO);
}
export function tabletLW(cW: number, cH: number, clamp = 0.62) {
  return Math.min(clamp, 0.75 * (cH / cW) * TAB_L_RATIO);
}
export function ipadW(cW: number, cH: number, clamp = 0.75) {
  return Math.min(clamp, 0.72 * (cH / cW) * IPAD_RATIO);
}

// ---------- Mockup frame (body) colors ----------
// The iPhone frame is a photographic PNG (natural titanium) recolored with a
// CSS filter; the other frames are CSS-drawn, so they take a bezel gradient +
// camera color directly. Absent frameColor keeps each device's built-in look.
export type FrameColor = {
  id: string;
  label: string;
  swatch: string;          // color shown on the picker button
  iphoneFilter?: string;   // CSS filter applied to mockup.png (undefined = none)
  bezel: string;           // CSS gradient for CSS-drawn frames
  camera: string;          // camera dot color for CSS-drawn frames
};

export const FRAME_COLORS: FrameColor[] = [
  {
    id: "natural",
    label: "Natural",
    swatch: "#C7BBA6",
    iphoneFilter: undefined,
    bezel: "linear-gradient(160deg, #d8ccb8 0%, #a89a82 100%)",
    camera: "#3a352c",
  },
  {
    id: "black",
    label: "Black",
    swatch: "#2b2b2e",
    iphoneFilter: "brightness(0.34) saturate(0.7) contrast(1.05)",
    bezel: "linear-gradient(160deg, #2a2a2e 0%, #141416 100%)",
    camera: "#0d0d0f",
  },
  {
    id: "silver",
    label: "Silver",
    swatch: "#d7d9dc",
    iphoneFilter: "brightness(1.12) saturate(0.22)",
    bezel: "linear-gradient(160deg, #e6e7ea 0%, #b4b6ba 100%)",
    camera: "#6a6c70",
  },
  {
    id: "blue",
    label: "Blue",
    swatch: "#41567a",
    iphoneFilter: "brightness(0.82) saturate(1.5) hue-rotate(178deg)",
    bezel: "linear-gradient(160deg, #33455f 0%, #1c2a40 100%)",
    camera: "#0d1420",
  },
  {
    id: "gold",
    label: "Gold",
    swatch: "#d9c08a",
    iphoneFilter: "brightness(1.06) saturate(1.4) hue-rotate(-8deg)",
    bezel: "linear-gradient(160deg, #e6d2a0 0%, #c2a86e 100%)",
    camera: "#4a3f28",
  },
];

export function getFrameColor(id?: string): FrameColor | undefined {
  if (!id) return undefined;
  return FRAME_COLORS.find((c) => c.id === id);
}

// ---------- Themes ----------
export const THEMES: Record<ThemeId, Theme> = {
  "clean-light": {
    id: "clean-light",
    name: "Clean Light",
    bg: "#F6F1EA",
    bgAlt: "#171717",
    fg: "#171717",
    fgAlt: "#F6F1EA",
    accent: "#5B7CFA",
    muted: "#6B7280",
  },
  "dark-bold": {
    id: "dark-bold",
    name: "Dark Bold",
    bg: "#0B1020",
    bgAlt: "#F8FAFC",
    fg: "#F8FAFC",
    fgAlt: "#0B1020",
    accent: "#8B5CF6",
    muted: "#94A3B8",
  },
  "warm-editorial": {
    id: "warm-editorial",
    name: "Warm Editorial",
    bg: "#F7E8DA",
    bgAlt: "#2B1D17",
    fg: "#2B1D17",
    fgAlt: "#F7E8DA",
    accent: "#D97706",
    muted: "#7C5A47",
  },
  "ocean-fresh": {
    id: "ocean-fresh",
    name: "Ocean Fresh",
    bg: "#E0F2FE",
    bgAlt: "#0C4A6E",
    fg: "#0C4A6E",
    fgAlt: "#E0F2FE",
    accent: "#0284C7",
    muted: "#475569",
  },
};

// Per-project localStorage cache. v1 lived under
// "app-store-screenshots:project:v1" — left untouched as rollback insurance.
export function storageKeyFor(slug: string) {
  return `screenshot-studio:project:${slug}:v2`;
}
export const LAST_PROJECT_KEY = "screenshot-studio:last-project";
export const DEFAULT_PROJECT_SLUG = "default";

// Device mockup shadow defaults — approximates the frames' original built-in
// box-shadow (0 8px 40px rgba(0,0,0,.55)) so enabling the control doesn't jump.
export const DEFAULT_SHADOW: ShadowSpec = {
  enabled: true,
  color: "#000000",
  opacity: 0.55,
  blur: 40,
  offsetX: 0,
  offsetY: 8,
};

export const DEVICE_LABEL: Record<Device, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  android: "Android Phone",
  "android-7": 'Android 7" Tablet',
  "android-10": 'Android 10" Tablet',
  "feature-graphic": "Feature Graphic",
};

// Friendly labels for slide layouts (used in dropdowns)
export const LAYOUT_LABEL: Record<SlideLayout, string> = {
  hero: "Hero",
  "device-bottom": "Device bottom",
  "device-top": "Device top",
  "two-devices": "Two devices",
  "no-device": "No device",
  "split-landscape": "Split (landscape)",
  "feature-graphic": "Feature graphic",
};

// Short description shown under each layout name
export const LAYOUT_HINT: Record<SlideLayout, string> = {
  hero: "Headline above, device at bottom",
  "device-bottom": "Headline top, device anchored below",
  "device-top": "Flipped — device on top",
  "two-devices": "Layered back + front phones",
  "no-device": "Big standalone headline",
  "split-landscape": "Caption left, device right",
  "feature-graphic": "1024×500 Play Store banner",
};
