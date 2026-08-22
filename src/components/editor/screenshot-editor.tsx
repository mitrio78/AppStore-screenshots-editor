"use client";
import * as React from "react";
import JSZip from "jszip";
import { getFontEmbedCSS, toCanvas } from "html-to-image";
import { Toaster, toast } from "sonner";
import { backgroundAssetPaths } from "@/lib/background";
import {
  DEFAULT_PROJECT_SLUG,
  LAST_PROJECT_KEY,
  supportsLandscape,
  storageKeyFor,
  THEMES,
} from "@/lib/constants";
import { detectPlatform, eid, newSlide } from "@/lib/defaults";
import { ensureFontsLoaded } from "@/lib/fonts";
import { getCanvasSize } from "@/lib/layout-rects";
import { didFail, preloadImages } from "@/lib/image-cache";
import { useI18n } from "@/lib/i18n";
import {
  DEFAULT_LOCALE,
  pickText,
  removeLocalized,
  resolveScreenshot,
  writeLocalized,
} from "@/lib/locale";
import { useProject } from "@/lib/storage";
import { uploadImageFile, imageSize } from "@/lib/upload";
import type {
  Device,
  DeviceElementId,
  ElementTransform,
  FreeElement,
  ImageElement,
  SelectableId,
  Slide,
  TextElement,
} from "@/lib/types";
import { currentDeviceRect } from "./device-panel";
import type { ClipboardMode, ElementPatch, LayerDir } from "./element-panel";
import { DeckRowPreviewStage } from "./deck-row-preview-stage";
import { ExportDialog, type ExportOptions } from "./export-dialog";
import { Inspector } from "./inspector";
import { PreviewStage } from "./preview-stage";
import { Sidebar } from "./sidebar";
import { SlideCanvas, getCanvas } from "./slide-canvas";
import { Toolbar, type EditorViewMode } from "./toolbar";

function isDeviceId(id: SelectableId): id is DeviceElementId {
  return id === "device" || id === "deviceSecondary";
}

const TEXT_CLIPBOARD_MIME = "application/x-screenshot-studio-text-element+json";
const CLIPBOARD_MODE_KEY = "screenshot-studio:text-clipboard-mode";

type TextClipboardStyle = Pick<
  TextElement,
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "color"
  | "align"
  | "lineHeight"
  | "letterSpacing"
  | "textTransform"
  | "opacity"
  | "box"
>;

type TextClipboardPayload = {
  type: "screenshot-studio/text-element";
  version: 1;
  text: string;
  style: TextClipboardStyle;
};

type ExportRenderJob = {
  key: string;
  slide: Slide;
  locale: string;
};

function initialClipboardMode(): ClipboardMode {
  if (typeof window === "undefined") return "format";
  try {
    const value = window.localStorage.getItem(CLIPBOARD_MODE_KEY);
    return value === "text" ? "text" : "format";
  } catch {
    return "format";
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!(
    el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.isContentEditable)
  );
}

function isTextInputTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA"));
}

function shouldKeepNativeCopy(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (isTextInputTarget(el)) return true;
  if (!el.isContentEditable) return false;

  const selection = window.getSelection();
  return !!(
    selection &&
    !selection.isCollapsed &&
    selection.anchorNode &&
    selection.focusNode &&
    el.contains(selection.anchorNode) &&
    el.contains(selection.focusNode)
  );
}

function textClipboardStyle(el: TextElement): TextClipboardStyle {
  return {
    fontFamily: el.fontFamily,
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    color: el.color,
    align: el.align,
    lineHeight: el.lineHeight,
    letterSpacing: el.letterSpacing,
    textTransform: el.textTransform,
    opacity: el.opacity,
    box: el.box ? { ...el.box } : undefined,
  };
}

function parseTextClipboardPayload(raw: string | undefined): TextClipboardPayload | null {
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as Partial<TextClipboardPayload>;
    if (
      payload.type !== "screenshot-studio/text-element" ||
      payload.version !== 1 ||
      typeof payload.text !== "string" ||
      !payload.style
    ) {
      return null;
    }
    return payload as TextClipboardPayload;
  } catch {
    return null;
  }
}

function editableHtmlFromText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

function syncEditablePasteTarget(target: EventTarget | null, text: string) {
  const el = target as HTMLElement | null;
  if (!el?.isContentEditable) return;
  el.innerHTML = editableHtmlFromText(text);

  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function cloneDeviceTransforms(transforms: Slide["transforms"]): Slide["transforms"] | undefined {
  if (!transforms) return undefined;
  const next: Slide["transforms"] = {};
  if (transforms.device) next.device = { ...transforms.device };
  if (transforms.deviceSecondary) next.deviceSecondary = { ...transforms.deviceSecondary };
  return next;
}

function cloneTemplateElement(template: FreeElement, targetText?: TextElement): FreeElement {
  if (template.kind === "text") {
    const next: TextElement = {
      ...template,
      id: eid(),
      text: { ...(targetText?.text || template.text) },
      transform: { ...template.transform },
    };
    if (template.box) next.box = { ...template.box };
    return next;
  }

  return {
    ...template,
    id: eid(),
    transform: { ...template.transform },
  };
}

function textVisualRank(a: TextElement, b: TextElement): number {
  const ay = a.transform.y + a.transform.height / 2;
  const by = b.transform.y + b.transform.height / 2;
  if (Math.abs(ay - by) > 8) return ay - by;

  const ax = a.transform.x + a.transform.width / 2;
  const bx = b.transform.x + b.transform.width / 2;
  return ax - bx;
}

function cloneTemplateElements(template: FreeElement[], target: Slide): FreeElement[] {
  const templateTextElements = template
    .filter((el): el is TextElement => el.kind === "text")
    .sort(textVisualRank);
  const targetTextElements = target.elements
    .filter((el): el is TextElement => el.kind === "text")
    .sort(textVisualRank);
  const textByTemplateId = new Map(
    templateTextElements.map((el, index) => [el.id, targetTextElements[index]]),
  );

  return template.map((el) => {
    const targetText = el.kind === "text" ? textByTemplateId.get(el.id) : undefined;
    return cloneTemplateElement(el, targetText);
  });
}

// WebKit needs extra warm-up passes to render images inside html-to-image's
// foreignObject (see captureSlide). Matches Safari but not Chrome/Edge/Firefox.
const IS_SAFARI =
  typeof navigator !== "undefined" &&
  /^((?!chrome|chromium|crios|android|edg|fxios|firefox).)*safari/i.test(navigator.userAgent);

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

const PNG_CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let value = n;
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[n] = value >>> 0;
  }
  return table;
})();

function pngCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = PNG_CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(data.length + 12);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i);
  chunk.set(data, 8);
  view.setUint32(data.length + 8, pngCrc32(chunk.subarray(4, data.length + 8)));
  return chunk;
}

async function bytesToDataUrl(bytes: Uint8Array): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(new Blob([buffer], { type: "image/png" }));
  });
}

// Browser canvas PNG export is RGBA even for an opaque 2D context. App Store
// Connect rejects files that merely contain an alpha channel, so encode a PNG
// with color type 2 (truecolor RGB) ourselves after flattening onto white.
async function canvasToOpaquePng(canvas: HTMLCanvasElement): Promise<string> {
  const opaque = document.createElement("canvas");
  opaque.width = canvas.width;
  opaque.height = canvas.height;
  const context = opaque.getContext("2d", { alpha: false });
  if (!context) throw new Error("Could not create an opaque PNG canvas");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, opaque.width, opaque.height);
  context.drawImage(canvas, 0, 0);

  const rgba = context.getImageData(0, 0, opaque.width, opaque.height).data;
  const stride = opaque.width * 3 + 1;
  const scanlines = new Uint8Array(stride * opaque.height);
  for (let y = 0; y < opaque.height; y++) {
    const rowStart = y * stride;
    scanlines[rowStart] = 1; // PNG Sub filter for materially smaller files.
    let source = y * opaque.width * 4;
    let target = rowStart + 1;
    for (let x = 0; x < opaque.width; x++) {
      for (let channel = 0; channel < 3; channel++) {
        const value = rgba[source + channel];
        const left = x === 0 ? 0 : rgba[source + channel - 4];
        scanlines[target++] = (value - left + 256) & 0xff;
      }
      source += 4;
    }
  }

  if (typeof CompressionStream === "undefined") {
    throw new Error("RGB PNG export requires a browser with CompressionStream support");
  }
  const compression = new CompressionStream("deflate");
  const compressedPromise = new Response(compression.readable).arrayBuffer();
  const writer = compression.writable.getWriter();
  await writer.write(scanlines);
  await writer.close();
  const compressed = new Uint8Array(await compressedPromise);

  const header = new Uint8Array(13);
  const headerView = new DataView(header.buffer);
  headerView.setUint32(0, opaque.width);
  headerView.setUint32(4, opaque.height);
  header[8] = 8; // bit depth
  header[9] = 2; // truecolor RGB, deliberately no alpha channel

  const chunks = [
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", new Uint8Array()),
  ];
  const byteLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const png = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    png.set(chunk, offset);
    offset += chunk.length;
  }
  return bytesToDataUrl(png);
}

function pixelVariation(data: Uint8ClampedArray): number {
  const count = data.length / 4;
  if (!count) return 0;
  const sums = [0, 0, 0];
  const squares = [0, 0, 0];
  for (let i = 0; i < data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      const value = data[i + channel];
      sums[channel] += value;
      squares[channel] += value * value;
    }
  }
  return sums.reduce((total, sum, channel) => {
    const mean = sum / count;
    return total + Math.sqrt(Math.max(0, squares[channel] / count - mean * mean));
  }, 0) / 3;
}

function sampledVariation(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): number {
  const probe = document.createElement("canvas");
  probe.width = 32;
  probe.height = 64;
  const context = probe.getContext("2d", { willReadFrequently: true });
  if (!context || sw <= 0 || sh <= 0) return 0;
  context.drawImage(source, sx, sy, sw, sh, 0, 0, probe.width, probe.height);
  return pixelVariation(context.getImageData(0, 0, probe.width, probe.height).data);
}

// html-to-image can return a valid-looking file while silently omitting a
// nested screenshot. Compare each rendered device-screen region with its
// decoded source and reject exact/near-exact blank regions before zipping.
function assertExportScreensRendered(el: HTMLElement, canvas: HTMLCanvasElement) {
  const rootRect = el.getBoundingClientRect();
  const screenshots = Array.from(
    el.querySelectorAll<HTMLImageElement>('img[data-export-screenshot="true"]'),
  );

  for (const image of screenshots) {
    const sourceVariation = sampledVariation(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
    );
    // A genuinely flat source is allowed to remain flat.
    if (sourceVariation < 1) continue;

    const rect = image.getBoundingClientRect();
    const insetX = rect.width * 0.08;
    const insetY = rect.height * 0.05;
    const x = Math.max(0, rect.left - rootRect.left + insetX);
    const y = Math.max(0, rect.top - rootRect.top + insetY);
    const width = Math.min(canvas.width - x, rect.width - insetX * 2);
    const height = Math.min(canvas.height - y, rect.height - insetY * 2);
    const outputVariation = sampledVariation(canvas, x, y, width, height);

    if (outputVariation < 0.5) {
      throw new Error("device screenshot was omitted while rasterizing");
    }
  }
}

function initialSlug(): string {
  if (typeof window === "undefined") return DEFAULT_PROJECT_SLUG;
  try {
    return window.localStorage.getItem(LAST_PROJECT_KEY) || DEFAULT_PROJECT_SLUG;
  } catch {
    return DEFAULT_PROJECT_SLUG;
  }
}

export function ScreenshotEditor() {
  const { deviceLabel, messages: m } = useI18n();
  const [slug, setSlugState] = React.useState<string>(initialSlug);
  const { state, setState, hydrated, savedAt, saveError, reset, resetDevice, undo, redo } =
    useProject(slug);
  const [activeSlideId, setActiveSlideId] = React.useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = React.useState<SelectableId | null>(null);
  const [exporting, setExporting] = React.useState<string | null>(null);
  // Mount exactly one fresh off-screen canvas per exported file. Reusing a
  // large deck here makes Chromium intermittently drop nested data-URL images
  // from html-to-image's foreignObject clone during long batch exports.
  const [exportRenderJob, setExportRenderJob] = React.useState<ExportRenderJob | null>(null);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<EditorViewMode>("edit");
  const [clipboardMode, setClipboardModeState] =
    React.useState<ClipboardMode>(initialClipboardMode);
  const exportRef = React.useRef<HTMLDivElement | null>(null);
  const exportJobSequence = React.useRef(0);
  const clipboardModeRef = React.useRef<ClipboardMode>(clipboardMode);
  const textClipboardRef = React.useRef<TextClipboardPayload | null>(null);

  const setSlug = React.useCallback((next: string) => {
    setSlugState(next);
    setActiveSlideId(null);
    setSelectedElementId(null);
    try {
      window.localStorage.setItem(LAST_PROJECT_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    if (!hydrated || !slug) return;
    let cancelled = false;

    void (async () => {
      try {
        const resp = await fetch("/api/projects", { cache: "no-store" });
        if (!resp.ok) return;
        const json = (await resp.json()) as {
          ok: boolean;
          projects?: Array<{ slug: string }>;
        };
        if (
          cancelled ||
          !json.ok ||
          !json.projects ||
          json.projects.some((project) => project.slug === slug)
        ) {
          return;
        }

        try {
          window.localStorage.removeItem(storageKeyFor(slug));
          window.localStorage.setItem(LAST_PROJECT_KEY, DEFAULT_PROJECT_SLUG);
        } catch {
          /* ignore */
        }
        toast.warning(m.editor.projectMissing(slug));
        setSlug(DEFAULT_PROJECT_SLUG);
      } catch {
        /* If the project list cannot load, keep the current slug and surface save errors normally. */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, m, setSlug, slug]);

  const setClipboardMode = React.useCallback((mode: ClipboardMode) => {
    clipboardModeRef.current = mode;
    if (mode === "text") textClipboardRef.current = null;
    setClipboardModeState(mode);
    try {
      window.localStorage.setItem(CLIPBOARD_MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const currentSlides = state.slidesByDevice[state.device] || [];
  const activeSlide =
    currentSlides.find((s) => s.id === activeSlideId) || currentSlides[0] || null;
  const theme = THEMES[state.themeId];

  React.useEffect(() => {
    setSelectedElementId(null);
  }, [activeSlide?.id]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (!activeSlide && currentSlides.length > 0) {
      setActiveSlideId(currentSlides[0].id);
    }
  }, [hydrated, currentSlides, activeSlide]);

  React.useEffect(() => {
    if (!supportsLandscape(state.device) && state.orientation !== "portrait") {
      setState((p) => ({ ...p, orientation: "portrait" }));
    }
  }, [state.device, state.orientation, setState]);

  const assetPaths = React.useMemo(() => {
    const paths = new Set<string>();
    paths.add("/mockup.png");
    if (state.appIcon) paths.add(state.appIcon);
    const addLocalized = (raw: string | undefined) => {
      if (!raw || raw.startsWith("data:")) return;
      if (raw.includes("{locale}")) {
        for (const loc of state.locales) paths.add(resolveScreenshot(raw, loc));
      } else {
        paths.add(raw);
      }
    };
    // Preload every locale variant so bulk export doesn't race image loads.
    const allSlides: Slide[] = Object.values(state.slidesByDevice).flat();
    for (const s of allSlides) {
      addLocalized(s.screenshot);
      addLocalized(s.screenshotSecondary);
      for (const p of Object.values(s.screenshotByLocale || {})) addLocalized(p);
      for (const p of Object.values(s.screenshotSecondaryByLocale || {})) addLocalized(p);
      for (const p of backgroundAssetPaths(s, state.locales)) paths.add(p);
      for (const el of s.elements) {
        if (el.kind === "image") addLocalized(el.src);
      }
    }
    return Array.from(paths).sort();
  }, [state.slidesByDevice, state.appIcon, state.locales]);
  const assetSig = assetPaths.join("|");

  React.useEffect(() => {
    if (!hydrated) return;
    preloadImages(assetPaths).finally(() => setReady(true));
    // assetPaths is derived from assetSig; depending on the string keeps the
    // effect from re-firing when slidesByDevice churns without path changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, assetSig]);

  // Surface storage failures (quota exceeded etc.) so the user knows their work isn't safe.
  React.useEffect(() => {
    if (saveError) {
      toast.error(m.editor.saveLocalError, {
        description: saveError,
        duration: 8000,
      });
      if (saveError.includes("HTTP 404") && slug !== DEFAULT_PROJECT_SLUG) {
        try {
          window.localStorage.removeItem(storageKeyFor(slug));
          window.localStorage.setItem(LAST_PROJECT_KEY, DEFAULT_PROJECT_SLUG);
        } catch {
          /* ignore */
        }
        setSlug(DEFAULT_PROJECT_SLUG);
      }
    }
  }, [m, saveError, setSlug, slug]);

  // ---------- Slide mutations ----------

  const patchSlide = React.useCallback(
    (id: string, patch: Partial<Slide>) => {
      setState((prev) => ({
        ...prev,
        slidesByDevice: {
          ...prev.slidesByDevice,
          [prev.device]: (prev.slidesByDevice[prev.device] || []).map((s) =>
            s.id === id ? { ...s, ...patch } : s,
          ),
        },
      }));
    },
    [setState],
  );

  const reorderSlides = React.useCallback(
    (next: Slide[]) => {
      setState((prev) => ({
        ...prev,
        slidesByDevice: { ...prev.slidesByDevice, [prev.device]: next },
      }));
    },
    [setState],
  );

  const deleteSlide = React.useCallback(
    (id: string) => {
      const dev = state.device;
      const slides = state.slidesByDevice[dev] || [];
      const idx = slides.findIndex((s) => s.id === id);
      if (idx === -1) return;
      const snap = slides[idx];
      const fallback = slides[idx + 1] || slides[idx - 1] || null;

      setState((prev) => {
        const cur = prev.slidesByDevice[dev] || [];
        return {
          ...prev,
          slidesByDevice: { ...prev.slidesByDevice, [dev]: cur.filter((s) => s.id !== id) },
        };
      });
      setActiveSlideId((cur) => (cur === id ? fallback?.id || null : cur));
      toast(m.editor.slideDeleted, {
        action: {
          label: m.editor.undo,
          onClick: () => {
            setState((prev) => {
              const cur = prev.slidesByDevice[dev] || [];
              if (cur.some((s) => s.id === snap.id)) return prev;
              const restored = [...cur.slice(0, idx), snap, ...cur.slice(idx)];
              return {
                ...prev,
                slidesByDevice: { ...prev.slidesByDevice, [dev]: restored },
              };
            });
            setActiveSlideId(snap.id);
          },
        },
        duration: 6000,
      });
    },
    [m, setState, state.device, state.slidesByDevice],
  );

  const addSlide = React.useCallback(
    (slide: Slide) => {
      setState((prev) => ({
        ...prev,
        slidesByDevice: {
          ...prev.slidesByDevice,
          [prev.device]: [...(prev.slidesByDevice[prev.device] || []), slide],
        },
      }));
      setActiveSlideId(slide.id);
    },
    [setState],
  );

  const duplicateSlide = React.useCallback(
    (id: string) => {
      let newId: string | null = null;
      setState((prev) => {
        const slides = prev.slidesByDevice[prev.device] || [];
        const idx = slides.findIndex((s) => s.id === id);
        if (idx === -1) return prev;
        const src = slides[idx];
        newId = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const copy: Slide = {
          ...src,
          id: newId,
          // Deep-copy elements so edits to the copy don't leak into the original.
          elements: src.elements.map((el) => ({ ...el, id: eid(), transform: { ...el.transform } })),
        };
        const next = [...slides.slice(0, idx + 1), copy, ...slides.slice(idx + 1)];
        return {
          ...prev,
          slidesByDevice: { ...prev.slidesByDevice, [prev.device]: next },
        };
      });
      if (newId) setActiveSlideId(newId);
    },
    [setState],
  );

  // ---------- Element mutations ----------

  const patchElement = React.useCallback(
    (slideId: string, elementId: string, patch: ElementPatch) => {
      setState((prev) => ({
        ...prev,
        slidesByDevice: {
          ...prev.slidesByDevice,
          [prev.device]: (prev.slidesByDevice[prev.device] || []).map((s) =>
            s.id === slideId
              ? {
                  ...s,
                  elements: s.elements.map((el) =>
                    el.id === elementId ? ({ ...el, ...patch } as FreeElement) : el,
                  ),
                }
              : s,
          ),
        },
      }));
    },
    [setState],
  );

  const handleTextChange = React.useCallback(
    (slideId: string, elementId: string, value: string) => {
      setState((prev) => ({
        ...prev,
        slidesByDevice: {
          ...prev.slidesByDevice,
          [prev.device]: (prev.slidesByDevice[prev.device] || []).map((s) =>
            s.id === slideId
              ? {
                  ...s,
                  elements: s.elements.map((el) =>
                    el.id === elementId && el.kind === "text"
                      ? { ...el, text: writeLocalized(el.text, prev.locale, value) }
                      : el,
                  ),
                }
              : s,
          ),
        },
      }));
    },
    [setState],
  );

  // Route a transform change to the right home: device slots live on
  // slide.transforms, free elements carry their own transform.
  const handleElementChange = React.useCallback(
    (slide: Slide, id: SelectableId, t: ElementTransform) => {
      if (isDeviceId(id)) {
        patchSlide(slide.id, { transforms: { ...(slide.transforms || {}), [id]: t } });
      } else {
        patchElement(slide.id, id, { transform: t });
      }
    },
    [patchSlide, patchElement],
  );

  const handlePatchTransform = React.useCallback(
    (slide: Slide, id: SelectableId, patch: Partial<ElementTransform>) => {
      if (isDeviceId(id)) {
        const rect = currentDeviceRect(slide, state.device, state.orientation, id);
        if (!rect) return;
        patchSlide(slide.id, {
          transforms: { ...(slide.transforms || {}), [id]: { ...rect, ...patch } },
        });
      } else {
        const el = slide.elements.find((e) => e.id === id);
        if (!el) return;
        patchElement(slide.id, id, { transform: { ...el.transform, ...patch } });
      }
    },
    [patchSlide, patchElement, state.device, state.orientation],
  );

  const addTextElement = React.useCallback(() => {
    if (!activeSlide) return;
    const { cW, cH } = getCanvasSize(state.device, state.orientation);
    const unit = Math.min(cW, cH);
    const inverted = !!activeSlide.inverted;
    const topZ = Math.max(
      4,
      ...activeSlide.elements.map((e) => e.transform.zIndex ?? 4),
    );
    const el: TextElement = {
      id: eid(),
      kind: "text",
      text: { [state.locale]: m.editor.newText },
      fontFamily: "Inter",
      fontSize: Math.round(unit * 0.045),
      fontWeight: 600,
      color: inverted ? theme.fgAlt : theme.fg,
      align: "center",
      lineHeight: 1.1,
      transform: {
        x: cW * 0.1,
        y: cH * 0.42,
        width: cW * 0.8,
        height: Math.round(unit * 0.12),
        zIndex: topZ + 1,
      },
    };
    patchSlide(activeSlide.id, { elements: [...activeSlide.elements, el] });
    setSelectedElementId(el.id);
  }, [activeSlide, m, patchSlide, state.device, state.orientation, state.locale, theme]);

  const addImageElement = React.useCallback(
    async (file: File) => {
      if (!activeSlide) return;
      const result = await uploadImageFile(file);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { cW, cH } = getCanvasSize(state.device, state.orientation);
      let ratio = 1;
      try {
        const dims = await imageSize(result.dataUrl);
        ratio = dims.h / Math.max(dims.w, 1);
      } catch {
        /* keep square */
      }
      const width = cW * 0.35;
      const topZ = Math.max(4, ...activeSlide.elements.map((e) => e.transform.zIndex ?? 4));
      const el: ImageElement = {
        id: eid(),
        kind: "image",
        src: result.path,
        transform: {
          x: (cW - width) / 2,
          y: cH * 0.3,
          width,
          height: width * ratio,
          zIndex: topZ + 1,
        },
      };
      patchSlide(activeSlide.id, { elements: [...activeSlide.elements, el] });
      setSelectedElementId(el.id);
    },
    [activeSlide, patchSlide, state.device, state.orientation],
  );

  const deleteElement = React.useCallback(
    (id: string) => {
      if (!activeSlide) return;
      patchSlide(activeSlide.id, {
        elements: activeSlide.elements.filter((el) => el.id !== id),
      });
      setSelectedElementId((cur) => (cur === id ? null : cur));
    },
    [activeSlide, patchSlide],
  );

  const duplicateElement = React.useCallback(
    (id: string) => {
      if (!activeSlide) return;
      const src = activeSlide.elements.find((el) => el.id === id);
      if (!src) return;
      const { cW } = getCanvasSize(state.device, state.orientation);
      const offset = Math.round(cW * 0.02);
      const copy: FreeElement = {
        ...src,
        id: eid(),
        transform: {
          ...src.transform,
          x: src.transform.x + offset,
          y: src.transform.y + offset,
          zIndex: (src.transform.zIndex ?? 4) + 1,
        },
      };
      patchSlide(activeSlide.id, { elements: [...activeSlide.elements, copy] });
      setSelectedElementId(copy.id);
    },
    [activeSlide, patchSlide, state.device, state.orientation],
  );

  // Unified z-order across device slots and free elements.
  const reorderLayer = React.useCallback(
    (slide: Slide, id: SelectableId, dir: LayerDir) => {
      const present: SelectableId[] = [];
      if (slide.layout !== "no-device" && slide.layout !== "feature-graphic") {
        if (slide.layout === "two-devices") present.push("deviceSecondary");
        present.push("device");
      }
      for (const el of slide.elements) present.push(el.id);

      const zOf = (eid_: SelectableId): number => {
        if (isDeviceId(eid_)) {
          return slide.transforms?.[eid_]?.zIndex ?? (eid_ === "deviceSecondary" ? 2 : 3);
        }
        return slide.elements.find((e) => e.id === eid_)?.transform.zIndex ?? 4;
      };

      const ranked = [...present].sort((a, b) => zOf(a) - zOf(b));
      const idx = ranked.indexOf(id);
      if (idx === -1) return;
      let target = idx;
      if (dir === "front") target = ranked.length - 1;
      else if (dir === "back") target = 0;
      else if (dir === "up") target = Math.min(ranked.length - 1, idx + 1);
      else if (dir === "down") target = Math.max(0, idx - 1);
      if (target === idx) return;
      ranked.splice(idx, 1);
      ranked.splice(target, 0, id);

      const nextTransforms = { ...(slide.transforms || {}) };
      const zPatches = new Map<string, number>();
      ranked.forEach((rid, i) => {
        const z = i + 1;
        if (isDeviceId(rid)) {
          const rect = currentDeviceRect(slide, state.device, state.orientation, rid);
          if (rect) nextTransforms[rid] = { ...rect, ...nextTransforms[rid], zIndex: z };
        } else {
          zPatches.set(rid, z);
        }
      });
      patchSlide(slide.id, {
        transforms: nextTransforms,
        elements: slide.elements.map((el) =>
          zPatches.has(el.id)
            ? { ...el, transform: { ...el.transform, zIndex: zPatches.get(el.id)! } }
            : el,
        ),
      });
    },
    [patchSlide, state.device, state.orientation],
  );

  // Set a slide's screenshot the way localized text works: editing while the
  // PRIMARY locale (locales[0]) is active writes the shared path every locale
  // falls back to; any other locale writes/clears only that locale's override.
  const setSlideScreenshot = React.useCallback(
    (slide: Slide, slot: DeviceElementId, path: string) => {
      setState((prev) => {
        const primary = prev.locales[0];
        const baseKey = slot === "device" ? "screenshot" : "screenshotSecondary";
        const mapKey = slot === "device" ? "screenshotByLocale" : "screenshotSecondaryByLocale";
        return {
          ...prev,
          slidesByDevice: {
            ...prev.slidesByDevice,
            [prev.device]: (prev.slidesByDevice[prev.device] || []).map((s) => {
              if (s.id !== slide.id) return s;
              if (prev.locale === primary) return { ...s, [baseKey]: path };
              const nextMap = writeLocalized(s[mapKey], prev.locale, path);
              const next = { ...s, [mapKey]: nextMap };
              if (Object.keys(nextMap).length === 0) delete next[mapKey];
              return next;
            }),
          },
        };
      });
    },
    [setState],
  );

  const handleDropScreenshot = React.useCallback(
    async (slide: Slide, slot: DeviceElementId, file: File) => {
      const result = await uploadImageFile(file);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSlideScreenshot(slide, slot, result.path);
      toast.success(m.editor.screenshotPlaced);
    },
    [m, setSlideScreenshot],
  );

  const applyBackgroundToDeck = React.useCallback(() => {
    if (!activeSlide) return;
    const bg = activeSlide.background;
    setState((prev) => ({
      ...prev,
      slidesByDevice: {
        ...prev.slidesByDevice,
        [prev.device]: (prev.slidesByDevice[prev.device] || []).map((s) => {
          const next = { ...s };
          if (bg === undefined) delete next.background;
          else next.background = bg;
          return next;
        }),
      },
    }));
    toast.success(m.editor.backgroundApplied);
  }, [activeSlide, m, setState]);

  // Spread the active slide's image OR gradient background as a panorama across
  // `count` consecutive slides starting at the active one, with offsetX evenly
  // stepped 0 → 1 so it pans left-to-right. Images use fit "panorama"; gradients
  // set span so they stretch to span× slide width and each slide shows its slice.
  const spreadPanorama = React.useCallback(
    (count: number) => {
      if (!activeSlide) return;
      const bg = activeSlide.background;
      const isImage = bg?.type === "image" && !!bg.src;
      const isGradient = bg?.type === "gradient";
      if (!bg || (!isImage && !isGradient)) {
        toast.error(m.editor.setImageOrGradientFirst);
        return;
      }
      let applied = 0;
      setState((prev) => {
        const slides = prev.slidesByDevice[prev.device] || [];
        const start = slides.findIndex((s) => s.id === activeSlide.id);
        if (start === -1) return prev;
        const n = Math.max(2, Math.min(count, slides.length - start));
        applied = n;
        const next = slides.map((s, i) => {
          if (i < start || i >= start + n) return s;
          const offsetX = Math.round(((i - start) / (n - 1)) * 1000) / 1000;
          const background =
            bg.type === "image"
              ? { ...bg, fit: "panorama" as const, offsetX }
              : { ...bg, span: n, offsetX };
          return { ...s, background };
        });
        return {
          ...prev,
          slidesByDevice: { ...prev.slidesByDevice, [prev.device]: next },
        };
      });
      if (applied) toast.success(m.editor.panoramaSpread(applied));
    },
    [activeSlide, m, setState],
  );

  const applySlideTemplateToDeck = React.useCallback(() => {
    if (!activeSlide) return;

    const appliedCount = currentSlides.filter((slide) => slide.id !== activeSlide.id).length;
    setState((prev) => {
      const slides = prev.slidesByDevice[prev.device] || [];
      const template = slides.find((s) => s.id === activeSlide.id) || activeSlide;
      const templateTransforms = cloneDeviceTransforms(template.transforms);
      const nextSlides = slides.map((slide) => {
        if (slide.id === template.id) return slide;

        const next: Slide = {
          ...slide,
          layout: template.layout,
          elements: cloneTemplateElements(template.elements, slide),
        };

        if (templateTransforms) next.transforms = cloneDeviceTransforms(templateTransforms);
        else delete next.transforms;

        if (template.deviceShadow) next.deviceShadow = { ...template.deviceShadow };
        else delete next.deviceShadow;

        if (template.frameColor) next.frameColor = template.frameColor;
        else delete next.frameColor;

        if (template.layout === "two-devices") {
          next.screenshotSecondary = slide.screenshotSecondary || slide.screenshot;
        } else {
          delete next.screenshotSecondary;
        }

        return next;
      });

      return {
        ...prev,
        slidesByDevice: {
          ...prev.slidesByDevice,
          [prev.device]: nextSlides,
        },
      };
    });

    if (appliedCount === 0) {
      toast.message(m.editor.noOtherSlidesForTemplate);
    } else {
      toast.success(m.editor.templateApplied(appliedCount));
    }
  }, [activeSlide, currentSlides, m, setState]);

  // ---------- Keyboard shortcuts ----------

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inEditable =
        target && isEditableTarget(target);
      if (exporting) return;

      // Undo / redo and deselect work everywhere (including inside text
      // fields) so the shortcuts feel native.
      if ((e.metaKey || e.ctrlKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "Escape") {
        setSelectedElementId(null);
        if (target && "blur" in target && typeof target.blur === "function") target.blur();
        return;
      }

      if (inEditable) return;

      // Bare Backspace/Delete removes the selected free element.
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        !e.metaKey &&
        !e.ctrlKey &&
        selectedElementId &&
        !isDeviceId(selectedElementId)
      ) {
        e.preventDefault();
        deleteElement(selectedElementId);
        return;
      }

      if (!currentSlides.length) return;
      const idx = activeSlide ? currentSlides.findIndex((s) => s.id === activeSlide.id) : -1;
      if (e.key === "ArrowDown" || (e.key === "j" && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        const next = currentSlides[Math.min(currentSlides.length - 1, idx + 1)];
        if (next) setActiveSlideId(next.id);
      } else if (e.key === "ArrowUp" || (e.key === "k" && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        const next = currentSlides[Math.max(0, idx - 1)];
        if (next) setActiveSlideId(next.id);
      } else if ((e.key === "d" || e.key === "D") && (e.metaKey || e.ctrlKey)) {
        if (activeSlide) {
          e.preventDefault();
          duplicateSlide(activeSlide.id);
        }
      } else if ((e.key === "Backspace" || e.key === "Delete") && (e.metaKey || e.ctrlKey)) {
        if (activeSlide) {
          e.preventDefault();
          deleteSlide(activeSlide.id);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    activeSlide,
    currentSlides,
    duplicateSlide,
    deleteSlide,
    deleteElement,
    selectedElementId,
    exporting,
    undo,
    redo,
  ]);

  React.useEffect(() => {
    function selectedTextElement(): TextElement | null {
      if (!activeSlide || !selectedElementId || isDeviceId(selectedElementId)) return null;
      const el = activeSlide.elements.find((e) => e.id === selectedElementId);
      return el?.kind === "text" ? el : null;
    }

    function onCopy(e: ClipboardEvent) {
      if (exporting || shouldKeepNativeCopy(e.target)) return;
      const el = selectedTextElement();
      if (!el || !e.clipboardData) return;
      const mode = clipboardModeRef.current;

      const text = pickText(el.text, state.locale);
      const payload: TextClipboardPayload = {
        type: "screenshot-studio/text-element",
        version: 1,
        text,
        style: textClipboardStyle(el),
      };

      e.clipboardData.setData("text/plain", text);
      if (mode === "format") {
        e.clipboardData.setData(TEXT_CLIPBOARD_MIME, JSON.stringify(payload));
        textClipboardRef.current = payload;
      } else {
        textClipboardRef.current = null;
      }
      e.preventDefault();
    }

    function onPaste(e: ClipboardEvent) {
      if (exporting || isTextInputTarget(e.target)) return;
      const el = selectedTextElement();
      if (!activeSlide || !el || !e.clipboardData) return;
      const mode = clipboardModeRef.current;

      const types = Array.from(e.clipboardData.types);
      const plainText = e.clipboardData.getData("text/plain");
      let payload =
        mode === "format"
          ? parseTextClipboardPayload(e.clipboardData.getData(TEXT_CLIPBOARD_MIME))
          : null;
      if (mode === "format" && !payload && textClipboardRef.current?.text === plainText) {
        payload = textClipboardRef.current;
      }
      if (!payload && !types.includes("text/plain")) return;

      const text = payload?.text ?? plainText;
      const patch: ElementPatch = {
        text: writeLocalized(el.text, state.locale, text),
      };

      if (mode === "format" && payload) {
        Object.assign(patch, {
          ...payload.style,
          box: payload.style.box ? { ...payload.style.box } : undefined,
        });
      }

      patchElement(activeSlide.id, el.id, patch);
      syncEditablePasteTarget(e.target, text);
      e.preventDefault();
    }

    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste, true);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste, true);
    };
  }, [
    activeSlide,
    exporting,
    patchElement,
    selectedElementId,
    state.locale,
  ]);

  // ---------- Export ----------

  // Wait two animation frames so React's render → browser layout/paint of the
  // off-screen container settles before html-to-image snapshots it. One frame
  // is occasionally not enough on slower machines.
  const waitForPaint = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

  async function exportBundle(opts: ExportOptions) {
    const slides = opts.scope === "current" && activeSlide ? [activeSlide] : currentSlides;
    if (!slides.length || !opts.sizes.length || !opts.locales.length) {
      toast.error(m.editor.nothingToExport);
      return;
    }

    try {
      await runExport(opts, slides);
    } finally {
      exportRef.current = null;
      setExportRenderJob(null);
      setExporting(null);
    }
  }

  async function mountExportJob(slide: Slide, locale: string): Promise<HTMLDivElement> {
    const key = `${slide.id}:${locale}:${++exportJobSequence.current}`;
    exportRef.current = null;
    setExportRenderJob({ key, slide, locale });

    for (let i = 0; i < 60; i++) {
      await waitForPaint();
      // React mutates the ref during the awaited commit; make that external
      // mutation explicit to TypeScript after we deliberately cleared it.
      const el = exportRef.current as HTMLDivElement | null;
      if (el?.dataset.exportKey !== key) continue;

      const images = Array.from(el.querySelectorAll<HTMLImageElement>("img[src]"));
      await Promise.all(images.map(async (image) => {
        if (!image.complete || image.naturalWidth === 0) await image.decode();
        if (!image.complete || image.naturalWidth === 0) {
          throw new Error("export image did not decode");
        }
      }));
      await waitForPaint();
      return el;
    }

    throw new Error("export render target did not mount");
  }

  async function unmountExportJob() {
    exportRef.current = null;
    setExportRenderJob(null);
    await waitForPaint();
    // Give the browser time to release the previous foreignObject/image tree.
    // This is deliberately paced for reliable large App Store batches.
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  async function runExport(opts: ExportOptions, slides: Slide[]) {
    // Load every family used on the exported deck up front — fonts that were
    // never painted (e.g. other locales) would otherwise export as fallbacks.
    const families = new Set<string>();
    for (const s of slides) {
      for (const el of s.elements) {
        if (el.kind === "text") families.add(el.fontFamily);
      }
    }
    await ensureFontsLoaded(Array.from(families));

    // Guarantee every image the exported slides use is cached as a data URL
    // BEFORE capture. html-to-image can only reliably embed already-loaded
    // data URLs — an un-cached path renders as a black screen. Awaiting here
    // closes the race where a freshly-referenced screenshot (new project,
    // JSON-edited path, just-added slide) hadn't finished preloading yet.
    const needed = new Set<string>();
    needed.add("/mockup.png");
    if (state.appIcon) needed.add(state.appIcon);
    const addImg = (raw: string | undefined) => {
      if (!raw || raw.startsWith("data:")) return;
      if (raw.includes("{locale}")) {
        for (const loc of opts.locales) needed.add(resolveScreenshot(raw, loc));
      } else {
        needed.add(raw);
      }
    };
    for (const s of slides) {
      addImg(s.screenshot);
      addImg(s.screenshotSecondary);
      for (const p of Object.values(s.screenshotByLocale || {})) addImg(p);
      for (const p of Object.values(s.screenshotSecondaryByLocale || {})) addImg(p);
      for (const p of backgroundAssetPaths(s, opts.locales)) needed.add(p);
      for (const el of s.elements) if (el.kind === "image") addImg(el.src);
    }
    await preloadImages(Array.from(needed));

    // Loudly flag screenshots that genuinely can't be fetched — a missing file
    // exports as a black mockup screen, which users read as "export is broken".
    const missing = Array.from(needed).filter((p) => didFail(p));
    if (missing.length) {
      console.error("Export: images could not load:", missing);
      toast.error(m.editor.imagesCouldNotLoad(missing.length), {
        description: missing.slice(0, 4).join("\n"),
        duration: 15000,
      });
    }

    const { cW, cH } = getCanvas(state.device, state.orientation);
    const platform = detectPlatform(state.device);
    const zip = new JSZip();
    const totalUnits = opts.sizes.length * opts.locales.length * slides.length;
    let unit = 0;
    let okCount = 0;
    let failed = 0;
    const errors: string[] = [];
    const ext = opts.format === "jpg" ? "jpg" : "png";
    let singleDataUrl: string | null = null;
    let singleName = "";

    // Compute the @font-face embed CSS once — html-to-image otherwise
    // re-fetches and re-inlines every font for every single capture.
    let fontEmbedCSS: string | undefined;

    for (const locale of opts.locales) {
      for (const size of opts.sizes) {
        // Uniform downscale so smaller sizes shrink instead of getting cropped
        // by html-to-image.
        const scale = Math.min(size.w / cW, size.h / cH);

        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          unit += 1;
          setExporting(`${unit}/${totalUnits}`);
          try {
            let dataUrl = "";
            let lastError: unknown;

            // A retry always gets a newly-mounted image tree. Retrying the same
            // cloned DOM is ineffective when foreignObject has already lost an
            // image resource under memory pressure.
            for (let attempt = 0; attempt < 3 && !dataUrl; attempt++) {
              try {
                const el = await mountExportJob(slide, locale);
                if (fontEmbedCSS === undefined) {
                  try {
                    fontEmbedCSS = await getFontEmbedCSS(el);
                  } catch {
                    fontEmbedCSS = "";
                  }
                }
                dataUrl = await captureSlide(el, size.w, size.h, scale, opts, fontEmbedCSS);
              } catch (error) {
                lastError = error;
                if (attempt === 2) throw error;
              } finally {
                await unmountExportJob();
              }
            }
            if (!dataUrl) throw lastError || new Error("render produced no image");
            const slideNo = opts.scope === "current"
              ? currentSlides.findIndex((s) => s.id === slide.id) + 1
              : i + 1;
            const filename = `${String(slideNo).padStart(2, "0")}-${slide.layout}.${ext}`;
            if (totalUnits === 1) {
              singleDataUrl = dataUrl;
              singleName = `${slugifyName(state.appName)}-${size.w}x${size.h}-${locale}-${filename}`;
            } else {
              const base64 = dataUrl.split(",")[1] || "";
              const path = `${platform}/${state.device}/${size.w}x${size.h}/${locale}/${filename}`;
              zip.file(path, base64, { base64: true });
            }
            okCount += 1;
          } catch (e) {
            failed += 1;
            const msg = e instanceof Error ? e.message : String(e);
            errors.push(`${locale} ${size.w}×${size.h} slide ${i + 1}: ${msg}`);
            console.error("Export failed", { slideId: slide.id, locale, size }, e);
          }
        }
      }
    }

    setExporting(null);

    if (okCount > 0) {
      try {
        if (singleDataUrl) {
          downloadUrl(singleDataUrl, singleName);
        } else {
          const blob = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(blob);
          downloadUrl(url, `${slugifyName(state.appName)}-${platform}-${state.device}-${stamp()}.zip`);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        }
      } catch (e) {
        toast.error(m.editor.bundleError);
        console.error(e);
        return;
      }
    }

    const summary = m.editor.exportSummary(opts.locales.length, opts.sizes.length);
    if (failed === 0) {
      toast.success(m.editor.exported(okCount, ext.toUpperCase(), summary));
    } else if (okCount === 0) {
      toast.error(m.editor.allRendersFailed(failed), {
        description: errors.slice(0, 3).join("\n"),
      });
    } else {
      toast.error(m.editor.rendersFailed(failed, totalUnits), {
        description: errors.slice(0, 3).join("\n"),
      });
    }
  }

  async function captureSlide(
    el: HTMLElement,
    w: number,
    h: number,
    scale: number,
    opts: ExportOptions,
    fontEmbedCSS?: string,
  ) {
    // html-to-image needs the node at (0,0) and uniformly scaled so the
    // captured pixel buffer matches the requested export size. Snapshot the
    // styles we touch so we can restore them after capture.
    const prev = {
      left: el.style.left,
      top: el.style.top,
      position: el.style.position,
      transform: el.style.transform,
      transformOrigin: el.style.transformOrigin,
      zIndex: el.style.zIndex,
    };
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.position = "absolute";
    el.style.transform = `scale(${scale})`;
    el.style.transformOrigin = "top left";
    el.style.zIndex = "-1";
    try {
      // Decode every image up front. Missing decodes must fail loudly so the
      // caller can remount a fresh export tree and retry the file.
      await Promise.all(Array.from(el.querySelectorAll<HTMLImageElement>("img[src]")).map(
        async (image) => {
          if (!image.complete || image.naturalWidth === 0) await image.decode();
          if (!image.complete || image.naturalWidth === 0) {
            throw new Error("export image did not decode");
          }
        },
      ));
      const options = {
        width: w,
        height: h,
        pixelRatio: 1,
        cacheBust: false,
        ...(fontEmbedCSS !== undefined ? { fontEmbedCSS } : {}),
      };
      const run = async () => {
        const canvas = await toCanvas(el, { ...options, backgroundColor: "#ffffff" });
        assertExportScreensRendered(el, canvas);
        return opts.format === "jpg"
          ? canvas.toDataURL("image/jpeg", opts.quality)
          : canvasToOpaquePng(canvas);
      };
      // The first html-to-image pass is a warm-up pass. Even Chromium can
      // intermittently omit nested data-URL images from foreignObject while a
      // bulk export is switching locales, which leaves otherwise-valid device
      // mockups with blank screens. Always capture twice and keep only the last
      // result; WebKit gets one additional pass because it is less reliable.
      const passes = IS_SAFARI ? 3 : 2;
      let dataUrl = "";
      let lastError: unknown;
      for (let i = 0; i < passes; i++) {
        try {
          dataUrl = await run();
        } catch (error) {
          lastError = error;
        }
        if (i < passes - 1) await new Promise((r) => setTimeout(r, 80));
      }
      if (!dataUrl) throw lastError || new Error("render produced no image");
      return dataUrl;
    } finally {
      el.style.left = prev.left || "-99999px";
      el.style.top = prev.top || "0px";
      el.style.position = prev.position || "absolute";
      el.style.transform = prev.transform;
      el.style.transformOrigin = prev.transformOrigin;
      el.style.zIndex = prev.zIndex;
    }
  }

  // ---------- Render ----------

  if (!hydrated || !ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <p className="text-sm">{m.editor.loading}</p>
        </div>
      </div>
    );
  }

  const { cW, cH } = getCanvas(state.device, state.orientation);
  const busy = !!exporting;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Toaster position="top-right" richColors closeButton />
      <Toolbar
        projectSlug={slug}
        projectName={state.name}
        onSwitchProject={setSlug}
        onRenameProject={(name) => setState((p) => ({ ...p, name }))}
        appName={state.appName}
        setAppName={(v) => setState((p) => ({ ...p, appName: v }))}
        locale={state.locale}
        setLocale={(v) => setState((p) => ({ ...p, locale: v }))}
        locales={state.locales}
        onAddLocale={(locale) =>
          setState((p) => {
            const exists = p.locales.some((l) => l.toLowerCase() === locale.toLowerCase());
            return {
              ...p,
              locales: exists ? p.locales : [...p.locales, locale],
              locale,
            };
          })
        }
        onDeleteLocale={(locale) =>
          setState((p) => {
            const nextLocales = p.locales.filter(
              (l) => l.toLowerCase() !== locale.toLowerCase(),
            );
            const locales = nextLocales.length ? nextLocales : [DEFAULT_LOCALE];
            const nextLocale =
              p.locale.toLowerCase() === locale.toLowerCase()
                ? locales.includes(DEFAULT_LOCALE)
                  ? DEFAULT_LOCALE
                  : locales[0]
                : p.locale;
            const slidesByDevice: typeof p.slidesByDevice = { ...p.slidesByDevice };
            (Object.keys(slidesByDevice) as Device[]).forEach((device) => {
              slidesByDevice[device] = slidesByDevice[device].map((slide) => ({
                ...slide,
                elements: slide.elements.map((el) =>
                  el.kind === "text"
                    ? { ...el, text: removeLocalized(el.text, locale) }
                    : el,
                ),
              }));
            });
            return {
              ...p,
              locales,
              locale: nextLocale,
              slidesByDevice,
            };
          })
        }
        device={state.device}
        setDevice={(v) => setState((p) => ({ ...p, device: v }))}
        orientation={state.orientation}
        setOrientation={(v) => setState((p) => ({ ...p, orientation: v }))}
        onExport={() => setExportOpen(true)}
        onResetAll={() => {
          reset();
          setActiveSlideId(null);
          toast.success(m.editor.resetAllToast);
        }}
        onResetDevice={() => {
          resetDevice(state.device);
          setActiveSlideId(null);
          toast.success(m.editor.resetDeviceToast(deviceLabel(state.device)));
        }}
        viewMode={viewMode}
        setViewMode={setViewMode}
        exporting={exporting}
        savedAt={savedAt}
        saveError={saveError}
        busy={busy}
      />

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        device={state.device}
        orientation={state.orientation}
        locales={state.locales}
        slideCount={currentSlides.length}
        onExport={(opts) => void exportBundle(opts)}
      />

      <div className="flex flex-1 overflow-hidden md:flex-row flex-col">
        <aside className="md:w-72 w-full shrink-0 border-r bg-card md:max-h-none max-h-64 overflow-hidden">
          <Sidebar
            slides={currentSlides}
            activeId={activeSlide?.id || null}
            device={state.device}
            orientation={state.orientation}
            theme={theme}
            locale={state.locale}
            appName={state.appName}
            appIcon={state.appIcon}
            disabled={busy}
            onReorder={reorderSlides}
            onSelect={setActiveSlideId}
            onDelete={deleteSlide}
            onDuplicate={duplicateSlide}
            onApplyTemplate={applySlideTemplateToDeck}
            onAdd={() => addSlide(newSlide("device-bottom", state.device, state.themeId, state.orientation))}
          />
        </aside>

        <main className="flex flex-1 items-stretch overflow-hidden min-h-0">
          {viewMode === "row" ? (
            <DeckRowPreviewStage
              slides={currentSlides}
              activeSlideId={activeSlide?.id || null}
              device={state.device}
              orientation={state.orientation}
              theme={theme}
              locale={state.locale}
              appName={state.appName}
              appIcon={state.appIcon}
              onSelectSlide={setActiveSlideId}
            />
          ) : activeSlide ? (
            <PreviewStage
              slide={activeSlide}
              device={state.device}
              orientation={state.orientation}
              theme={theme}
              locale={state.locale}
              appName={state.appName}
              appIcon={state.appIcon}
              selectedElementId={selectedElementId}
              onTextChange={(elId, v) => handleTextChange(activeSlide.id, elId, v)}
              onElementChange={(id, t) => handleElementChange(activeSlide, id, t)}
              onSelectElement={setSelectedElementId}
              onDropScreenshot={(slot, file) => void handleDropScreenshot(activeSlide, slot, file)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{m.editor.noSlideSelectedTitle}</p>
              <p>{m.editor.noSlideSelectedHint}</p>
            </div>
          )}
        </main>

        <aside className="md:w-80 w-full shrink-0 border-l bg-card md:max-h-none max-h-96 overflow-hidden">
          {activeSlide ? (
            <Inspector
              slide={activeSlide}
              device={state.device}
              orientation={state.orientation}
              themeId={state.themeId}
              locale={state.locale}
              selectedElementId={selectedElementId}
              clipboardMode={clipboardMode}
              slideIndex={currentSlides.findIndex((s) => s.id === activeSlide.id)}
              slideCount={currentSlides.length}
              primaryLocale={state.locales[0]}
              onChange={(patch) => patchSlide(activeSlide.id, patch)}
              onScreenshotChange={(slot, path) => setSlideScreenshot(activeSlide, slot, path)}
              onThemeChange={(themeId) => setState((p) => ({ ...p, themeId }))}
              onApplyBackgroundToDeck={applyBackgroundToDeck}
              onSpreadPanorama={spreadPanorama}
              onClipboardModeChange={setClipboardMode}
              onAddText={addTextElement}
              onAddImage={(file) => void addImageElement(file)}
              onPatchElement={(id, patch) => patchElement(activeSlide.id, id, patch)}
              onPatchTransform={(id, patch) => handlePatchTransform(activeSlide, id, patch)}
              onReorderLayer={(id, dir) => reorderLayer(activeSlide, id, dir)}
              onDeleteElement={deleteElement}
              onDuplicateElement={duplicateElement}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{m.editor.nothingToInspectTitle}</p>
              <p className="text-xs">{m.editor.nothingToInspectHint}</p>
            </div>
          )}
        </aside>
      </div>

      {/* A single fresh full-resolution canvas for the current export unit. */}
      {exportRenderJob && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: -99999,
            top: 0,
            pointerEvents: "none",
          }}
        >
          <div
            key={exportRenderJob.key}
            ref={exportRef}
            data-export-key={exportRenderJob.key}
            style={{ width: cW, height: cH, position: "absolute", left: -99999, top: 0 }}
          >
            <SlideCanvas
              slide={exportRenderJob.slide}
              device={state.device}
              orientation={state.orientation}
              theme={theme}
              locale={exportRenderJob.locale}
              appName={state.appName}
              appIcon={state.appIcon}
              hideEmpty
            />
          </div>
        </div>
      )}
    </div>
  );
}

function downloadUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

function slugifyName(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "screenshots"
  );
}

function stamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
