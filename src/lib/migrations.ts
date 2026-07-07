// Project schema migrations. v1 (template) slides carried fixed `label` and
// `headline` caption slots; v2 replaces them with a free `elements` array.
// migrateProject() is called on every load path (localStorage, project file,
// API) and is idempotent — already-v2 data passes through normalized.
import { THEMES } from "./constants";
import { coerceLocalized } from "./locale";
import { defaultRectsFor } from "./layout-rects";
import { getCanvasSize } from "./layout-rects";
import type {
  Device,
  ElementTransform,
  FreeElement,
  LocalizedText,
  Orientation,
  ProjectState,
  Slide,
  TextElement,
  Theme,
  ThemeId,
} from "./types";
import { SCHEMA_VERSION } from "./types";

// v1 slide shape (what we migrate away from).
type V1Slide = Omit<Slide, "elements" | "transforms"> & {
  label?: unknown;
  headline?: unknown;
  elements?: FreeElement[];
  transforms?: Partial<Record<"caption" | "device" | "deviceSecondary", ElementTransform>>;
};

function hasAnyText(field: LocalizedText): boolean {
  return Object.values(field).some((v) => v && v.length > 0);
}

// Build the pair of text elements that replaces the v1 caption block. Also
// used by defaults.ts so starter decks match the migrated shape exactly.
export function captionElements(args: {
  slideId: string;
  layout: Slide["layout"];
  device: Device;
  orientation: Orientation;
  theme: Theme;
  inverted?: boolean;
  label?: LocalizedText;
  headline?: LocalizedText;
  captionOverride?: ElementTransform;
}): TextElement[] {
  const { slideId, layout, device, orientation, theme, inverted, captionOverride } = args;
  const label = args.label || {};
  const headline = args.headline || {};
  const { cW, cH } = getCanvasSize(device, orientation);
  const unit = Math.min(cW, cH);

  if (layout === "feature-graphic") {
    if (!hasAnyText(headline)) return [];
    return [
      {
        id: `${slideId}_tagline`,
        kind: "text",
        text: headline,
        fontFamily: "Inter",
        fontSize: Math.round(cW * 0.028),
        fontWeight: 400,
        color: "#FFFFFFDD",
        align: "left",
        lineHeight: 1.25,
        // The feature-graphic composition renders this element in a fixed slot;
        // the rect is only used if the layout is later switched.
        transform: { x: cW * 0.3, y: cH * 0.55, width: cW * 0.6, height: cH * 0.3, zIndex: 4 },
      },
    ];
  }

  const defaults = defaultRectsFor(layout, device, orientation);
  const cap = captionOverride
    ? { ...captionOverride, align: defaults.caption?.align }
    : defaults.caption;
  if (!cap) return [];
  const align = (cap as { align?: "center" | "left" }).align || "center";
  const rotation = captionOverride?.rotation;
  const zIndex = captionOverride?.zIndex ?? 4;
  const labelH = unit * 0.048;

  const out: TextElement[] = [];
  if (hasAnyText(label)) {
    out.push({
      id: `${slideId}_label`,
      kind: "text",
      text: label,
      fontFamily: "Inter",
      fontSize: Math.round(unit * 0.028),
      fontWeight: 600,
      color: theme.accent,
      align,
      lineHeight: 1.2,
      letterSpacing: Math.round(unit * 0.0015 * 10) / 10,
      textTransform: "uppercase",
      transform: {
        x: cap.x,
        y: cap.y,
        width: cap.width,
        height: Math.round(labelH),
        ...(rotation ? { rotation } : {}),
        zIndex,
      },
    });
  }
  if (hasAnyText(headline)) {
    out.push({
      id: `${slideId}_headline`,
      kind: "text",
      text: headline,
      fontFamily: "Inter",
      fontSize: Math.round(unit * 0.092),
      fontWeight: 700,
      color: inverted ? theme.fgAlt : theme.fg,
      align,
      lineHeight: 0.96,
      letterSpacing: -Math.round(unit * 0.001 * 10) / 10,
      transform: {
        x: cap.x,
        y: cap.y + Math.round(labelH),
        width: cap.width,
        height: Math.max(Math.round(cap.height - labelH), Math.round(unit * 0.12)),
        ...(rotation ? { rotation } : {}),
        zIndex,
      },
    });
  }
  return out;
}

function migrateSlide(
  raw: V1Slide,
  device: Device,
  orientation: Orientation,
  theme: Theme,
): Slide {
  const label = coerceLocalized(raw.label);
  const headline = coerceLocalized(raw.headline);
  const transforms = raw.transforms || {};
  const isV1 = raw.label !== undefined || raw.headline !== undefined || transforms.caption !== undefined;

  const migratedElements: FreeElement[] = isV1
    ? captionElements({
        slideId: raw.id,
        layout: raw.layout,
        device,
        orientation,
        theme,
        inverted: raw.inverted,
        label,
        headline,
        captionOverride: transforms.caption,
      })
    : [];

  const { caption: _dropped, ...deviceTransforms } = transforms;
  const slide: Slide = {
    id: raw.id,
    layout: raw.layout,
    screenshot: raw.screenshot || "",
    elements: [...(raw.elements || []), ...migratedElements],
  };
  if (raw.screenshotSecondary !== undefined) slide.screenshotSecondary = raw.screenshotSecondary;
  if (raw.inverted) slide.inverted = raw.inverted;
  if (raw.background) slide.background = raw.background;
  if (raw.deviceShadow) slide.deviceShadow = raw.deviceShadow;
  if (raw.frameColor) slide.frameColor = raw.frameColor;
  if (Object.keys(deviceTransforms).length) slide.transforms = deviceTransforms;
  return slide;
}

// Migrate a parsed project of any known version to the current schema.
// Accepts partial states (merging with defaults is the caller's job).
export function migrateProject(raw: Partial<ProjectState> & Record<string, unknown>): Partial<ProjectState> {
  const themeId = (raw.themeId as ThemeId) || "clean-light";
  const theme = THEMES[themeId] || THEMES["clean-light"];
  const orientation = (raw.orientation as Orientation) || "portrait";

  const slidesByDevice = raw.slidesByDevice
    ? (Object.fromEntries(
        Object.entries(raw.slidesByDevice).map(([device, slides]) => [
          device,
          (slides || []).map((s) =>
            migrateSlide(s as V1Slide, device as Device, orientation, theme),
          ),
        ]),
      ) as ProjectState["slidesByDevice"])
    : undefined;

  const next: Partial<ProjectState> = {
    ...raw,
    schemaVersion: SCHEMA_VERSION,
    name: (raw.name as string) || (raw.appName as string) || "Default",
  };
  if (slidesByDevice) next.slidesByDevice = slidesByDevice;
  return next;
}
