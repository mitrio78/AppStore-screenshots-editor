import type { LocalizedText } from "./types";

export const DEFAULT_LOCALE = "en";

export function normalizeLocaleCode(value: string): string {
  const parts = value
    .trim()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .split("-")
    .filter(Boolean);

  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index === 0) return lower;
      if (/^[a-z]{4}$/i.test(part)) return lower.charAt(0).toUpperCase() + lower.slice(1);
      if (/^([a-z]{2}|\d{3})$/i.test(part)) return part.toUpperCase();
      return lower;
    })
    .join("-");
}

export function isValidLocaleCode(value: string): boolean {
  return /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,4}$/.test(value);
}

// Read the value for `locale` from a localized field. Falls back to en, then to
// the first locale that has a non-empty value, then to empty string. Used by
// the canvas/preview/thumb so switching to a locale the user hasn't filled in
// shows the source copy instead of blanks.
export function pickText(field: LocalizedText | undefined, locale: string): string {
  if (!field) return "";
  const direct = field[locale];
  if (direct && direct.length) return direct;
  const en = field[DEFAULT_LOCALE];
  if (en && en.length) return en;
  for (const k of Object.keys(field)) {
    const v = field[k];
    if (v && v.length) return v;
  }
  return "";
}

// Replace `{locale}` placeholders in a screenshot path. Data URLs and empty
// strings pass through unchanged.
export function resolveScreenshot(path: string | undefined, locale: string): string {
  if (!path) return "";
  if (path.startsWith("data:")) return path;
  if (!path.includes("{locale}")) return path;
  return path.replace(/\{locale\}/g, locale);
}

// Convert legacy `string` headline/label fields to the per-locale shape. Safe
// to call on already-migrated data.
export function coerceLocalized(value: unknown): LocalizedText {
  if (typeof value === "string") return { [DEFAULT_LOCALE]: value };
  if (value && typeof value === "object") return value as LocalizedText;
  return {};
}

// Set or clear the value for `locale` on a localized field. Empty values delete
// the key so the persisted JSON stays free of "" placeholders.
export function writeLocalized(
  field: LocalizedText | undefined,
  locale: string,
  value: string,
): LocalizedText {
  const next: LocalizedText = { ...(field || {}) };
  if (value.length === 0) delete next[locale];
  else next[locale] = value;
  return next;
}
