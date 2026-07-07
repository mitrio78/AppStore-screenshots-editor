"use client";
import * as React from "react";
import { BUILTIN_FONTS, fetchFontRegistry, fontFaceCss } from "@/lib/fonts";
import type { FontAsset } from "@/lib/types";

// Module-level registry shared between the <style> injector and the font
// pickers, with a tiny subscription so late-mounting panels see uploads.
let registry: FontAsset[] = BUILTIN_FONTS;
const listeners = new Set<() => void>();

function setRegistry(fonts: FontAsset[]) {
  registry = fonts;
  listeners.forEach((fn) => fn());
}

export async function refreshFontRegistry(): Promise<void> {
  setRegistry(await fetchFontRegistry());
}

export function useFonts(): FontAsset[] {
  return React.useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => registry,
    () => registry,
  );
}

// Injects @font-face rules for every registered font as a REAL stylesheet.
// html-to-image discovers fonts by walking CSSOM stylesheets and inlining
// their src URLs into exports — fonts registered through the FontFace JS API
// are invisible to it, so this must stay a <style> tag.
export function FontLoader() {
  const fonts = useFonts();

  React.useEffect(() => {
    void refreshFontRegistry();
  }, []);

  const css = React.useMemo(() => fontFaceCss(fonts), [fonts]);
  return <style data-canvas-fonts dangerouslySetInnerHTML={{ __html: css }} />;
}
