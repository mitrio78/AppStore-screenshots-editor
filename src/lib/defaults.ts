import { THEMES } from "./constants";
import { DEFAULT_LOCALE } from "./locale";
import { captionElements } from "./migrations";
import { SCHEMA_VERSION } from "./types";
import type {
  Device,
  Orientation,
  ProjectState,
  Slide,
  SlideLayout,
  ThemeId,
} from "./types";

let _id = 0;
export const nid = () => `s_${Date.now().toString(36)}_${(_id++).toString(36)}`;
export const eid = () => `e_${Date.now().toString(36)}_${(_id++).toString(36)}`;

const en = (s: string) => ({ [DEFAULT_LOCALE]: s });

// Starter decks are authored as label/headline pairs and expanded into free
// text elements through the same code path the v1→v2 migration uses, so
// defaults and migrated projects look identical.
function starter(
  device: Device,
  themeId: ThemeId,
  layout: SlideLayout,
  label: string,
  headline: string,
  opts?: { inverted?: boolean; secondary?: boolean; orientation?: Orientation },
): Slide {
  const id = nid();
  const slide: Slide = {
    id,
    layout,
    screenshot: "",
    elements: captionElements({
      slideId: id,
      layout,
      device,
      orientation: opts?.orientation || "portrait",
      theme: THEMES[themeId],
      inverted: opts?.inverted,
      label: label ? en(label) : {},
      headline: headline ? en(headline) : {},
    }),
  };
  if (opts?.secondary) slide.screenshotSecondary = "";
  if (opts?.inverted) slide.inverted = true;
  return slide;
}

function makeStarterSlides(device: Device, themeId: ThemeId): Slide[] {
  return [
    starter(device, themeId, "hero", "MEET YOUR APP", "Sell one\nidea per slide."),
    starter(device, themeId, "device-bottom", "FEATURE 01", "Your headline\nlives here."),
    starter(device, themeId, "two-devices", "FEATURE 02", "Show two\nscreens at once.", { secondary: true }),
    starter(device, themeId, "device-top", "FEATURE 03", "Flip the contrast\nfor visual rhythm.", { inverted: true }),
    starter(device, themeId, "no-device", "MORE", "And so\nmuch more."),
  ];
}

function ipadStarter(themeId: ThemeId): Slide[] {
  return [
    starter("ipad", themeId, "hero", "MEET YOUR APP", "Made for\nthe big screen."),
    starter("ipad", themeId, "device-bottom", "FEATURE 01", "Built for\nfocus."),
    starter("ipad", themeId, "device-top", "FEATURE 02", "Always within reach.", { inverted: true }),
  ];
}

function tabletStarter(device: Device, kind: "7" | "10", themeId: ThemeId): Slide[] {
  return [
    starter(device, themeId, "hero", "MEET YOUR APP", kind === "7" ? "Pocket-sized\npower." : "Made for\nthe big screen."),
    starter(device, themeId, "split-landscape", "FEATURE 01", "Wide canvas,\nbigger ideas.", { orientation: "landscape" }),
  ];
}

function fgStarter(themeId: ThemeId): Slide[] {
  return [starter("feature-graphic", themeId, "feature-graphic", "", "Your tagline goes here.")];
}

const DEFAULT_THEME_ID: ThemeId = "clean-light";

export const DEFAULT_PROJECT: ProjectState = {
  schemaVersion: SCHEMA_VERSION,
  name: "Default",
  appName: "My App",
  themeId: DEFAULT_THEME_ID,
  locales: [DEFAULT_LOCALE],
  locale: DEFAULT_LOCALE,
  device: "iphone",
  orientation: "portrait",
  appIcon: "",
  slidesByDevice: {
    iphone: makeStarterSlides("iphone", DEFAULT_THEME_ID),
    android: makeStarterSlides("android", DEFAULT_THEME_ID),
    ipad: ipadStarter(DEFAULT_THEME_ID),
    "android-7": tabletStarter("android-7", "7", DEFAULT_THEME_ID),
    "android-10": tabletStarter("android-10", "10", DEFAULT_THEME_ID),
    "feature-graphic": fgStarter(DEFAULT_THEME_ID),
  },
};

export function newSlide(
  layout: SlideLayout,
  device: Device,
  themeId: ThemeId,
  orientation: Orientation = "portrait",
): Slide {
  return starter(device, themeId, layout, "NEW", "Edit this\nheadline.", {
    orientation,
    secondary: layout === "two-devices",
  });
}

export function detectPlatform(device: Device): "ios" | "android" {
  return device === "iphone" || device === "ipad" ? "ios" : "android";
}
