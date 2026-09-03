import {describe, it, expect} from 'vitest';
import { normalizeLocaleCode, isValidLocaleCode, pickText, resolveScreenshot, pickScreenshot, coerceLocalized, writeLocalized, removeLocalized } from './locale';

describe("normalizeLocaleCode", () => {
  it("normalizes underscore to hyphen", () => {
    expect(normalizeLocaleCode('en_US')).toBe("en-US");
  })

  it('fixes casing', () => {
    expect(normalizeLocaleCode("EN-us")).toBe('en-US');
  })
})

describe("isValidLocaleCode", () => {
  it("accepts valid BCP-47 codes", () => {
    expect(isValidLocaleCode("en-US")).toBe(true);
    expect(isValidLocaleCode('ru')).toBe(true);
  })

  it("rejects invalid codes", () => {
    expect(isValidLocaleCode("")).toBe(false);
  })
})

describe("pickText", () => {
  it("returns empty string if localized text is undefined", () => {
    expect(pickText(undefined, 'ru-RU')).toBe("");
  })

  it("returns value of localised field", () => {
    expect(pickText({
      en: "Hello",
      ru: "Привет"
    }, "ru")).toBe("Привет")
  })

  it("defaults to en text if no translation is in provided locale", () => {
    expect(pickText({
      en: "Hello",
      ru: ""
    }, 'ru')).toBe("Hello")
    expect(pickText({
      en: "Hello"
    }, 'ru')).toBe("Hello")
  })

  it("falls back to first non-empty value if en is also missing", () => {
    expect(pickText({ de: "Hallo" }, "ru")).toBe("Hallo");
  })

  it("returns empty string if all values are empty", () => {
    expect(pickText({ en: "", ru: "" }, "ru")).toBe("");
  })
})

describe("resolveScreenshot", () => {
  it("returns empty string for undefined path", () => {
    expect(resolveScreenshot(undefined, "en")).toBe("");
  })

  it("passes data URLs through unchanged", () => {
    const dataUrl = "data:image/png;base64,abc123";
    expect(resolveScreenshot(dataUrl, "ru")).toBe(dataUrl);
  })

  it("returns path as-is when no {locale} placeholder", () => {
    expect(resolveScreenshot("/screenshots/screen1.png", "ru")).toBe("/screenshots/screen1.png");
  })

  it("replaces {locale} placeholder with locale", () => {
    expect(resolveScreenshot("/screenshots/{locale}/screen1.png", "ru")).toBe("/screenshots/ru/screen1.png");
  })

  it("replaces multiple {locale} placeholders", () => {
    expect(resolveScreenshot("/{locale}/img/{locale}.png", "de")).toBe("/de/img/de.png");
  })
})

describe("pickScreenshot", () => {
  it("uses per-locale override when available", () => {
    expect(pickScreenshot("/base.png", { ru: "/override-ru.png" }, "ru")).toBe("/override-ru.png");
  })

  it("falls back to base when no override for locale", () => {
    expect(pickScreenshot("/base.png", { de: "/override-de.png" }, "ru")).toBe("/base.png");
  })

  it("falls back to base when byLocale is undefined", () => {
    expect(pickScreenshot("/base.png", undefined, "ru")).toBe("/base.png");
  })

  it("resolves {locale} in override path", () => {
    expect(pickScreenshot("/base.png", { ru: "/{locale}/screen.png" }, "ru")).toBe("/ru/screen.png");
  })

  it("resolves {locale} in base path when no override", () => {
    expect(pickScreenshot("/{locale}/base.png", undefined, "de")).toBe("/de/base.png");
  })

  it("returns empty string when both base and override are missing", () => {
    expect(pickScreenshot(undefined, undefined, "en")).toBe("");
  })
})

describe("coerceLocalized", () => {
  it("wraps a string into default locale", () => {
    expect(coerceLocalized("Hello")).toEqual({ en: "Hello" });
  })

  it("passes through an already-localized object", () => {
    const field = { en: "Hello", ru: "Привет" };
    expect(coerceLocalized(field)).toEqual({ en: "Hello", ru: "Привет" });
  })

  it("returns empty object for null", () => {
    expect(coerceLocalized(null)).toEqual({});
  })

  it("returns empty object for undefined", () => {
    expect(coerceLocalized(undefined)).toEqual({});
  })

  it("returns empty object for non-string primitives", () => {
    expect(coerceLocalized(42)).toEqual({});
    expect(coerceLocalized(true)).toEqual({});
  })
})

describe("writeLocalized", () => {
  it("sets a locale value", () => {
    expect(writeLocalized({ en: "Hello" }, "ru", "Привет")).toEqual({ en: "Hello", ru: "Привет" });
  })

  it("overwrites an existing locale value", () => {
    expect(writeLocalized({ en: "Hello" }, "en", "Hi")).toEqual({ en: "Hi" });
  })

  it("deletes key when value is empty string", () => {
    const result = writeLocalized({ en: "Hello", ru: "Привет" }, "ru", "");
    expect(result).toEqual({ en: "Hello" });
    expect(result).not.toHaveProperty("ru");
  })

  it("does not mutate the original object", () => {
    const original = { en: "Hello" };
    writeLocalized(original, "ru", "Привет");
    expect(original).toEqual({ en: "Hello" });
  })

  it("handles undefined field", () => {
    expect(writeLocalized(undefined, "en", "Hello")).toEqual({ en: "Hello" });
  })
})

describe("removeLocalized", () => {
  it("removes an existing locale key", () => {
    const result = removeLocalized({ en: "Hello", ru: "Привет" }, "ru");
    expect(result).toEqual({ en: "Hello" });
    expect(result).not.toHaveProperty("ru");
  })

  it("does nothing if locale key does not exist", () => {
    expect(removeLocalized({ en: "Hello" }, "ru")).toEqual({ en: "Hello" });
  })

  it("does not mutate the original object", () => {
    const original = { en: "Hello", ru: "Привет" };
    removeLocalized(original, "ru");
    expect(original).toEqual({ en: "Hello", ru: "Привет" });
  })

  it("handles undefined field", () => {
    expect(removeLocalized(undefined, "en")).toEqual({});
  })
})