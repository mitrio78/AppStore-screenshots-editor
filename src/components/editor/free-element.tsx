"use client";
import * as React from "react";
import { cssFontFamily } from "@/lib/fonts";
import { didFail, img } from "@/lib/image-cache";
import { pickText, resolveScreenshot } from "@/lib/locale";
import type { FreeElement, TextElement } from "@/lib/types";

// ---------- Editable text (contentEditable with plain-text semantics) ----------

export function EditableText({
  value,
  editable,
  onChange,
  style,
  multiline = false,
  placeholder,
  onFocus,
}: {
  value: string;
  editable?: boolean;
  onChange?: (v: string) => void;
  style?: React.CSSProperties;
  multiline?: boolean;
  placeholder?: string;
  onFocus?: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const incoming = multiline ? value.replace(/\n/g, "<br/>") : value;
    if (el.innerHTML !== incoming && document.activeElement !== el) {
      el.innerHTML = incoming || "";
    }
  }, [value, multiline]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!onChange) return;
    const html = (e.currentTarget.innerHTML || "")
      .replace(/<div>/gi, "\n")
      .replace(/<\/div>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    onChange(multiline ? html : html.replace(/\n/g, ""));
  };

  return (
    <div
      ref={ref}
      contentEditable={editable}
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={handleInput}
      onFocus={() => onFocus?.()}
      onMouseDown={(e) => {
        // Allow text editing without starting an Rnd drag.
        if (editable) {
          e.stopPropagation();
          onFocus?.();
        }
      }}
      onPointerDown={(e) => {
        if (editable) e.stopPropagation();
      }}
      style={{
        outline: "none",
        whiteSpace: multiline ? "pre-wrap" : "nowrap",
        cursor: editable ? "text" : "default",
        ...style,
      }}
    />
  );
}

// ---------- Free element renderer (fills its Movable rect) ----------

export function textElementStyle(el: TextElement): React.CSSProperties {
  return {
    fontFamily: cssFontFamily(el.fontFamily),
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    color: el.color,
    textAlign: el.align,
    lineHeight: el.lineHeight,
    letterSpacing: el.letterSpacing !== undefined ? `${el.letterSpacing}px` : undefined,
    textTransform: el.textTransform === "uppercase" ? "uppercase" : undefined,
  };
}

export function FreeElementView({
  el,
  locale,
  editable,
  onTextChange,
  onFocus,
}: {
  el: FreeElement;
  locale: string;
  editable?: boolean;
  onTextChange?: (v: string) => void;
  onFocus?: () => void;
}) {
  if (el.kind === "image") {
    const src = img(resolveScreenshot(el.src, locale));
    const missing = !src || didFail(el.src);
    return (
      <div style={{ width: "100%", height: "100%", opacity: el.opacity ?? 1 }}>
        {missing ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px dashed rgba(127,127,127,0.5)",
              borderRadius: 8,
              color: "rgba(127,127,127,0.8)",
              fontSize: 14,
            }}
          >
            image missing
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            draggable={false}
            style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
          />
        )}
      </div>
    );
  }

  const boxStyle: React.CSSProperties = el.box
    ? {
        background: el.box.color,
        padding: el.box.padding,
        borderRadius: el.box.radius,
      }
    : {};

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: el.box ? "center" : "flex-start",
        opacity: el.opacity ?? 1,
        ...boxStyle,
      }}
    >
      <EditableText
        value={pickText(el.text, locale)}
        editable={editable}
        multiline
        onChange={onTextChange}
        onFocus={onFocus}
        placeholder="Text"
        style={textElementStyle(el)}
      />
    </div>
  );
}
