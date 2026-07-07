// Font registry: bundled fonts (self-hosted woff2, committed under
// public/fonts/) + user uploads (public/fonts/uploaded/ + fonts.json manifest).
// IMPORTANT: canvas fonts must be registered through real CSSOM stylesheets
// (a <style> tag with @font-face) — html-to-image walks stylesheets to embed
// fonts into exports and cannot see fonts added via the FontFace JS API.
import builtinManifest from "./builtin-fonts.json";
import type { FontAsset } from "./types";

// Multiple manifest entries may share a family (weight/subset slices).
export const BUILTIN_FONTS: FontAsset[] = (
  builtinManifest as Array<FontAsset & { unicodeRange?: string }>
).map((f) => ({ ...f, builtin: true }));

// "System" renders through the OS font stack — nothing to load or embed.
export const SYSTEM_FAMILY = "System";
const SYSTEM_STACK = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

export function cssFontFamily(family: string): string {
  if (family === SYSTEM_FAMILY) return SYSTEM_STACK;
  return `"${family}", ${SYSTEM_STACK}`;
}

export function familiesOf(fonts: FontAsset[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of fonts) {
    if (!seen.has(f.family)) {
      seen.add(f.family);
      out.push(f.family);
    }
  }
  if (!seen.has(SYSTEM_FAMILY)) out.push(SYSTEM_FAMILY);
  return out;
}

function formatFor(file: string): string {
  if (file.endsWith(".woff2")) return "woff2";
  if (file.endsWith(".woff")) return "woff";
  if (file.endsWith(".otf")) return "opentype";
  return "truetype";
}

export function fontFaceCss(fonts: Array<FontAsset & { unicodeRange?: string }>): string {
  return fonts
    .filter((f) => f.file)
    .map((f) => {
      const lines = [
        `@font-face {`,
        `  font-family: "${f.family}";`,
        `  src: url("${f.file}") format("${formatFor(f.file)}");`,
        `  font-weight: ${f.weight};`,
        `  font-style: ${f.style || "normal"};`,
        `  font-display: block;`,
      ];
      if (f.unicodeRange) lines.push(`  unicode-range: ${f.unicodeRange};`);
      lines.push(`}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export async function fetchFontRegistry(): Promise<FontAsset[]> {
  try {
    const resp = await fetch("/api/fonts", { cache: "no-store" });
    if (!resp.ok) return BUILTIN_FONTS;
    const json = (await resp.json()) as { ok: boolean; fonts?: FontAsset[] };
    return json.ok && json.fonts ? json.fonts : BUILTIN_FONTS;
  } catch {
    return BUILTIN_FONTS;
  }
}

// Ask the browser to actually load every registered family before an export;
// fonts that were never painted on screen stay unloaded otherwise and come out
// as fallback glyphs in the capture.
export async function ensureFontsLoaded(families: string[]): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const probes = families
    .filter((f) => f !== SYSTEM_FAMILY)
    .flatMap((f) => [
      document.fonts.load(`400 24px "${f}"`, "Пример Sample"),
      document.fonts.load(`700 24px "${f}"`, "Пример Sample"),
    ]);
  try {
    await Promise.all(probes);
    await document.fonts.ready;
  } catch {
    /* best-effort */
  }
}
