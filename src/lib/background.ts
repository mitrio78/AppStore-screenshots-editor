// Single place that converts a Background union into renderable CSS.
// The canvas renders the root style plus an optional image layer div
// (image backgrounds need their own layer so blur can overscan the edges).
import type { CSSProperties } from "react";
import { img } from "./image-cache";
import { resolveScreenshot } from "./locale";
import type { Background, Slide, Theme } from "./types";

export const DEFAULT_BACKGROUND: Background = { type: "theme" };

export function themeGradient(theme: Theme, inverted?: boolean): string {
  if (inverted) {
    return `linear-gradient(160deg, ${theme.bgAlt} 0%, ${shade(theme.bgAlt, -8)} 100%)`;
  }
  return `linear-gradient(160deg, ${theme.bg} 0%, ${shade(theme.bg, -6)} 100%)`;
}

export function shade(hex: string, percent: number) {
  const c = hex.replace("#", "");
  const num = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const amt = Math.round((255 * percent) / 100);
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

export type BackgroundCss = {
  root: CSSProperties;            // applied to the slide's root div
  imageLayer?: CSSProperties;     // absolutely-positioned layer for image backgrounds
  isTheme: boolean;               // theme backgrounds also render decorative blobs
};

export function cssForBackground(
  bg: Background | undefined,
  theme: Theme,
  inverted: boolean,
  locale: string,
): BackgroundCss {
  const b = bg || DEFAULT_BACKGROUND;
  switch (b.type) {
    case "solid":
      return { root: { background: b.color }, isTheme: false };
    case "gradient": {
      const stops = [...b.stops]
        .sort((s1, s2) => s1.position - s2.position)
        .map((s) => `${s.color} ${Math.round(s.position * 100)}%`)
        .join(", ");
      return { root: { background: `linear-gradient(${b.angle}deg, ${stops})` }, isTheme: false };
    }
    case "image": {
      const src = img(resolveScreenshot(b.src, locale));
      const blur = b.blur || 0;
      // Overscan by 2× blur so blurred edges don't reveal the backdrop color.
      const inset = blur > 0 ? -blur * 2 : 0;
      const layer: CSSProperties = {
        position: "absolute",
        inset,
        backgroundImage: src ? `url(${src})` : undefined,
        backgroundRepeat: "no-repeat",
        pointerEvents: "none",
      };
      if (b.fit === "contain") {
        layer.backgroundSize = "contain";
        layer.backgroundPosition = "center";
      } else if (b.fit === "panorama") {
        layer.backgroundSize = "auto 100%";
        layer.backgroundPosition = `${(b.offsetX ?? 0) * 100}% 50%`;
      } else {
        layer.backgroundSize = "cover";
        layer.backgroundPosition = "center";
      }
      if (blur > 0) layer.filter = `blur(${blur}px)`;
      if (b.opacity !== undefined && b.opacity < 1) layer.opacity = b.opacity;
      // Root keeps a flat theme-ish color so contain/opacity modes have a backdrop.
      return {
        root: { background: inverted ? theme.bgAlt : theme.bg },
        imageLayer: layer,
        isTheme: false,
      };
    }
    case "theme":
    default:
      return { root: { background: themeGradient(theme, inverted) }, isTheme: true };
  }
}

// All image paths a slide's background needs preloaded (per project locale).
export function backgroundAssetPaths(slide: Slide, locales: string[]): string[] {
  const bg = slide.background;
  if (!bg || bg.type !== "image" || !bg.src || bg.src.startsWith("data:")) return [];
  if (bg.src.includes("{locale}")) {
    return locales.map((loc) => resolveScreenshot(bg.src, loc));
  }
  return [bg.src];
}
