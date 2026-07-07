// Shared upload path used by the inspector picker, canvas drag&drop and the
// background/image-element pickers.
import { setImage } from "./image-cache";

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadDataUrl(dataUrl: string): Promise<string | null> {
  try {
    const resp = await fetch("/api/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });
    if (!resp.ok) return null;
    const json = (await resp.json()) as { ok: boolean; path?: string };
    return json.ok && json.path ? json.path : null;
  } catch {
    return null;
  }
}

export type UploadResult =
  | { ok: true; path: string; dataUrl: string }
  | { ok: false; error: string };

// Validate + read + persist a dropped/picked file. Returns the public path
// (preferred; survives git clone) or falls back to the inline data URI when
// the upload endpoint is unreachable. The image cache is primed either way so
// the canvas can render immediately.
export async function uploadImageFile(file: File): Promise<UploadResult> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: "Use PNG or JPG (App Store rejects other formats)" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image too large (>8MB)" };
  }
  let dataUrl: string;
  try {
    dataUrl = await fileToDataUrl(file);
  } catch {
    return { ok: false, error: "Failed to read file" };
  }
  const uploadedPath = await uploadDataUrl(dataUrl);
  if (uploadedPath) {
    setImage(uploadedPath, dataUrl);
    return { ok: true, path: uploadedPath, dataUrl };
  }
  setImage(dataUrl, dataUrl);
  return { ok: true, path: dataUrl, dataUrl };
}

// Natural pixel size of an image data URL (used to size new image elements).
export function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ w: image.naturalWidth, h: image.naturalHeight });
    image.onerror = reject;
    image.src = dataUrl;
  });
}
