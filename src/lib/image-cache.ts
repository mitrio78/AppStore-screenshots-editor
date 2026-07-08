"use client";
// Pre-loads images as base64 data URIs so html-to-image exports without
// non-deterministic image fetch races. Always use img(path) in render.

const cache = new Map<string, string>();
const failed = new Set<string>();

async function fetchAsDataUrl(path: string): Promise<string | null> {
  try {
    const resp = await fetch(path);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function preloadImages(paths: string[]): Promise<void> {
  await Promise.all(
    paths
      .filter(Boolean)
      // Retry previously-failed paths on every preload: a transient outage
      // (e.g. the dev server restarting) must not poison the session — a
      // permanent `failed` skip once exported mockups as blank screens even
      // though the files were back. Only cached successes are skipped.
      .filter((p) => !cache.has(p))
      .map(async (p) => {
        const data = await fetchAsDataUrl(p);
        if (data) {
          cache.set(p, data);
          failed.delete(p);
        } else {
          failed.add(p);
        }
      }),
  );
}

export function img(path: string | undefined): string {
  if (!path) return "";
  if (path.startsWith("data:")) return path;
  if (failed.has(path)) return "";
  return cache.get(path) || path;
}

export function setImage(path: string, dataUrl: string) {
  cache.set(path, dataUrl);
  failed.delete(path);
}

export function didFail(path: string | undefined): boolean {
  if (!path) return false;
  if (path.startsWith("data:")) return false;
  return failed.has(path);
}
