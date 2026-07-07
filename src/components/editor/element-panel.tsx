"use client";
import * as React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  ImagePlus,
  RotateCw,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { familiesOf } from "@/lib/fonts";
import { useI18n } from "@/lib/i18n";
import type {
  ElementTransform,
  FreeElement,
  ImageElement,
  SelectableId,
  Slide,
  TextElement,
} from "@/lib/types";
import { FontUploadButton } from "./font-upload";
import { useFonts } from "./font-loader";

export type LayerDir = "front" | "back" | "up" | "down";
export type ClipboardMode = "format" | "text";

// Style patch applicable to either element kind ("kind"/"id" excluded so the
// discriminants can't conflict in the intersection).
export type ElementPatch = Partial<Omit<TextElement, "id" | "kind">> &
  Partial<Omit<ImageElement, "id" | "kind">>;

type Props = {
  slide: Slide;
  selectedElementId: SelectableId | null;
  clipboardMode: ClipboardMode;
  onClipboardModeChange: (mode: ClipboardMode) => void;
  onAddText: () => void;
  onAddImage: (file: File) => void;
  onPatchElement: (id: string, patch: ElementPatch) => void;
  onPatchTransform: (id: SelectableId, patch: Partial<ElementTransform>) => void;
  onReorderLayer: (id: SelectableId, dir: LayerDir) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
};

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

export function ElementPanel({
  slide,
  selectedElementId,
  clipboardMode,
  onClipboardModeChange,
  onAddText,
  onAddImage,
  onPatchElement,
  onPatchTransform,
  onReorderLayer,
  onDeleteElement,
  onDuplicateElement,
}: Props) {
  const { messages: m } = useI18n();
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const freeElement: FreeElement | undefined = selectedElementId
    ? slide.elements.find((e) => e.id === selectedElementId)
    : undefined;
  const isDeviceSelected =
    selectedElementId === "device" || selectedElementId === "deviceSecondary";
  const deviceTransform = isDeviceSelected
    ? slide.transforms?.[selectedElementId as "device" | "deviceSecondary"]
    : undefined;

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{m.elements.title}</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={onAddText}
            title={m.elements.addTextTitle}
          >
            <Type className="h-3.5 w-3.5" /> {m.common.text}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() => imageInputRef.current?.click()}
            title={m.elements.addImageTitle}
          >
            <ImagePlus className="h-3.5 w-3.5" /> {m.common.image}
          </Button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const input = e.currentTarget;
              const file = input.files?.[0];
              if (file) onAddImage(file);
              input.value = "";
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded border bg-background/50 p-2">
        <Label className="shrink-0 text-[11px] text-muted-foreground">{m.elements.copyPaste}</Label>
        <Select
          value={clipboardMode}
          onValueChange={(value) => onClipboardModeChange(value as ClipboardMode)}
        >
          <SelectTrigger
            className="h-8 flex-1 text-xs"
            aria-label={m.elements.copyPasteAria}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="format">{m.elements.textPlusFormat}</SelectItem>
              <SelectItem value="text">{m.elements.textOnly}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {freeElement ? (
        <FreeElementControls
          el={freeElement}
          onPatch={(patch) => onPatchElement(freeElement.id, patch)}
          onRotate={(rotation) => onPatchTransform(freeElement.id, { rotation })}
          onReorder={(dir) => onReorderLayer(freeElement.id, dir)}
          onDelete={() => onDeleteElement(freeElement.id)}
          onDuplicate={() => onDuplicateElement(freeElement.id)}
        />
      ) : isDeviceSelected && selectedElementId ? (
        <DeviceControls
          label={selectedElementId === "device" ? m.elements.device : m.elements.backDevice}
          rotation={deviceTransform?.rotation ?? 0}
          onRotate={(rotation) => onPatchTransform(selectedElementId, { rotation })}
          onReorder={(dir) => onReorderLayer(selectedElementId, dir)}
        />
      ) : (
        <div className="rounded border border-dashed bg-background/40 p-4 text-center text-[11px] text-muted-foreground">
          {m.elements.emptyHint}
        </div>
      )}
    </div>
  );
}

function RotationSlider({
  rotation,
  onRotate,
  label,
}: {
  rotation: number;
  onRotate: (r: number) => void;
  label: string;
}) {
  const { messages: m } = useI18n();
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <RotateCw className="h-3 w-3" /> {m.elements.rotation}
        </Label>
        <span className="text-[11px] tabular-nums text-muted-foreground">{rotation}°</span>
      </div>
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={rotation}
        onChange={(e) => onRotate(Number(e.target.value))}
        className="w-full"
        aria-label={m.elements.rotationAria(label)}
      />
    </div>
  );
}

function LayerRow({ onReorder }: { onReorder: (dir: LayerDir) => void }) {
  const { messages: m } = useI18n();
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{m.elements.layer}</Label>
      <div className="grid grid-cols-4 gap-1">
        <LayerButton onClick={() => onReorder("back")} label={m.elements.sendToBack}>
          <ArrowDownToLine className="h-3.5 w-3.5" />
        </LayerButton>
        <LayerButton onClick={() => onReorder("down")} label={m.elements.sendBackward}>
          <ChevronDown className="h-3.5 w-3.5" />
        </LayerButton>
        <LayerButton onClick={() => onReorder("up")} label={m.elements.bringForward}>
          <ChevronUp className="h-3.5 w-3.5" />
        </LayerButton>
        <LayerButton onClick={() => onReorder("front")} label={m.elements.bringToFront}>
          <ArrowUpToLine className="h-3.5 w-3.5" />
        </LayerButton>
      </div>
    </div>
  );
}

function DeviceControls({
  label,
  rotation,
  onRotate,
  onReorder,
}: {
  label: string;
  rotation: number;
  onRotate: (r: number) => void;
  onReorder: (dir: LayerDir) => void;
}) {
  const { messages: m } = useI18n();
  return (
    <div className="space-y-2 rounded border bg-background/60 p-2.5">
      <span className="text-xs font-medium">{label}</span>
      <RotationSlider rotation={rotation} onRotate={onRotate} label={label} />
      <LayerRow onReorder={onReorder} />
    </div>
  );
}

function FreeElementControls({
  el,
  onPatch,
  onRotate,
  onReorder,
  onDelete,
  onDuplicate,
}: {
  el: FreeElement;
  onPatch: (patch: ElementPatch) => void;
  onRotate: (r: number) => void;
  onReorder: (dir: LayerDir) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const { messages: m } = useI18n();
  return (
    <div className="space-y-2.5 rounded border bg-background/60 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{el.kind === "text" ? m.elements.textField : m.elements.image}</span>
        <div className="flex gap-0.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onDuplicate}
            title={m.elements.duplicateElement}
            aria-label={m.elements.duplicateElement}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6 hover:text-destructive"
            onClick={onDelete}
            title={m.elements.deleteElement}
            aria-label={m.elements.deleteElement}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {el.kind === "text" ? <TextControls el={el} onPatch={onPatch} /> : null}

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] text-muted-foreground">{m.elements.opacity}</Label>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {Math.round((el.opacity ?? 1) * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={100}
          step={1}
          value={Math.round((el.opacity ?? 1) * 100)}
          onChange={(e) => onPatch({ opacity: Number(e.target.value) / 100 })}
          className="w-full"
          aria-label={m.elements.elementOpacity}
        />
      </div>

      <RotationSlider
        rotation={el.transform.rotation ?? 0}
        onRotate={onRotate}
        label={m.elements.element}
      />
      <LayerRow onReorder={onReorder} />
    </div>
  );
}

function TextControls({
  el,
  onPatch,
}: {
  el: TextElement;
  onPatch: (patch: Partial<TextElement>) => void;
}) {
  const { messages: m } = useI18n();
  const fonts = useFonts();
  const families = familiesOf(fonts);

  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">{m.elements.font}</Label>
        <div className="flex items-center gap-1">
          <Select value={el.fontFamily} onValueChange={(fontFamily) => onPatch({ fontFamily })}>
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {families.map((f) => (
                <SelectItem key={f} value={f}>
                  <span style={{ fontFamily: f === "System" ? undefined : `"${f}"` }}>{f}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FontUploadButton />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">{m.elements.size}</Label>
          <NumberField
            min={8}
            className="h-8 text-xs"
            value={el.fontSize}
            onCommit={(v) => onPatch({ fontSize: v })}
            ariaLabel={m.elements.fontSize}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">{m.elements.weight}</Label>
          <Select
            value={String(el.fontWeight)}
            onValueChange={(w) => onPatch({ fontWeight: Number(w) })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEIGHTS.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ColorField label={m.elements.color} value={el.color} onChange={(color) => onPatch({ color })} />
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">{m.elements.align}</Label>
          <div className="grid grid-cols-3 gap-1">
            {(
              [
                ["left", AlignLeft],
                ["center", AlignCenter],
                ["right", AlignRight],
              ] as const
            ).map(([align, Icon]) => (
              <Button
                key={align}
                type="button"
                size="sm"
                variant={el.align === align ? "default" : "outline"}
                className="h-8 px-0"
                onClick={() => onPatch({ align })}
                title={
                  align === "left"
                    ? m.elements.alignLeft
                    : align === "center"
                      ? m.elements.alignCenter
                      : m.elements.alignRight
                }
                aria-label={
                  align === "left"
                    ? m.elements.alignLeft
                    : align === "center"
                      ? m.elements.alignCenter
                      : m.elements.alignRight
                }
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">{m.elements.lineHeight}</Label>
          <NumberField
            step={0.05}
            min={0.5}
            max={3}
            className="h-8 text-xs"
            value={el.lineHeight}
            onCommit={(v) => onPatch({ lineHeight: v })}
            ariaLabel={m.elements.lineHeight}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">{m.elements.letterSpacing}</Label>
          <NumberField
            step={0.5}
            className="h-8 text-xs"
            value={el.letterSpacing ?? 0}
            onCommit={(v) => onPatch({ letterSpacing: v })}
            ariaLabel={m.elements.letterSpacing}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <input
          type="checkbox"
          checked={el.textTransform === "uppercase"}
          onChange={(e) => onPatch({ textTransform: e.target.checked ? "uppercase" : "none" })}
        />
        {m.elements.uppercase}
      </label>

      <BoxControls el={el} onPatch={onPatch} />
    </div>
  );
}

function BoxControls({
  el,
  onPatch,
}: {
  el: TextElement;
  onPatch: (patch: Partial<TextElement>) => void;
}) {
  const { messages: m } = useI18n();
  const box = el.box;
  return (
    <div className="space-y-2 rounded border border-dashed p-2">
      <label className="flex items-center gap-2 text-[11px] font-medium">
        <input
          type="checkbox"
          checked={!!box}
          onChange={(e) =>
            onPatch({
              box: e.target.checked
                ? { color: "#FFFFFF", padding: Math.round(el.fontSize * 0.4), radius: Math.round(el.fontSize * 0.35) }
                : undefined,
            })
          }
        />
        {m.elements.fieldBackground}
      </label>
      {box && (
        <div className="grid grid-cols-3 gap-2">
          <ColorField
            label={m.elements.fill}
            value={box.color}
            onChange={(color) => onPatch({ box: { ...box, color } })}
          />
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{m.elements.padding}</Label>
            <NumberField
              min={0}
              className="h-8 text-xs"
              value={box.padding}
              onCommit={(v) => onPatch({ box: { ...box, padding: v } })}
              ariaLabel={m.elements.fieldPadding}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{m.elements.radius}</Label>
            <NumberField
              min={0}
              className="h-8 text-xs"
              value={box.radius}
              onCommit={(v) => onPatch({ box: { ...box, radius: v } })}
              ariaLabel={m.elements.fieldCornerRadius}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Numeric input that buffers typing and only clamps on commit. A controlled
// number input that clamps on every keystroke makes intermediate values (e.g.
// "5" on the way to "50") snap to the min and the caret jump — this holds the
// raw draft while focused, applies complete in-range values live (so spinners
// and valid typing update immediately), and clamps to [min,max] on blur/Enter.
export function NumberField({
  value,
  onCommit,
  min,
  max,
  step,
  className,
  ariaLabel,
}: {
  value: number;
  onCommit: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const clamp = (n: number) => {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };
  const display = draft !== null ? draft : String(value);

  return (
    <Input
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      className={className}
      value={display}
      aria-label={ariaLabel}
      onFocus={(e) => setDraft(e.currentTarget.value)}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        const n = Number(raw);
        // Apply live only when the entry is a complete, already-in-range number;
        // partial/out-of-range drafts wait for commit so they don't snap.
        if (raw.trim() !== "" && !Number.isNaN(n) && n === clamp(n)) onCommit(n);
      }}
      onBlur={(e) => {
        const raw = e.target.value;
        const n = Number(raw);
        setDraft(null);
        if (raw.trim() !== "" && !Number.isNaN(n)) {
          const c = clamp(n);
          if (c !== value) onCommit(c);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        else if (e.key === "Escape") {
          setDraft(null);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { messages: m } = useI18n();
  // Native color input only understands #rrggbb — feed it a normalized value
  // but let the text field hold whatever the user types until it parses.
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
          aria-label={m.elements.colorPicker(label)}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 flex-1 font-mono text-[11px]"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function LayerButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 px-0"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {children}
    </Button>
  );
}
