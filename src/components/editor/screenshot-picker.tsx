"use client";
import * as React from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { didFail, img } from "@/lib/image-cache";
import { useI18n } from "@/lib/i18n";
import { uploadImageFile } from "@/lib/upload";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
};

export function ScreenshotPicker({ label, value, onChange }: Props) {
  const { messages: m } = useI18n();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const result = await uploadImageFile(file);
    setUploading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChange(result.path);
  }

  const hasValue = !!value;
  const isData = hasValue && value.startsWith("data:");
  // Paths with a {locale} placeholder resolve per active locale at render
  // time — the picker can't preview them, but they're perfectly valid.
  const isTemplate = hasValue && value.includes("{locale}");
  const previewSrc = isData ? value : hasValue && !isTemplate ? img(value) : "";
  // Only flag "image not found" when the path is a real URL that we tried and failed.
  const knownMissing = hasValue && !isData && !isTemplate && didFail(value);
  const valueLabel = uploading
    ? m.picker.saving
    : !hasValue
      ? m.picker.dropOrPick
      : isData
        ? m.picker.uploadedNotOnDisk
        : value.replace(/^.*\/(?=[^/]+\/[^/]+$)/, "…/");

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center gap-3 rounded-md border p-2 transition-colors ${
          dragging ? "border-primary bg-accent ring-2 ring-primary/30" : "border-input"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragging) setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={async (e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) await handleFile(file);
        }}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
              onError={() => setError(m.picker.imageFailedToLoad)}
            />
          ) : (
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-medium">{label}</span>
          <span className="truncate text-[10px] text-muted-foreground">
            {dragging ? m.picker.dropToUpload : valueLabel}
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={async (e) => {
            const input = e.currentTarget;
            const file = input.files?.[0];
            if (file) await handleFile(file);
            input.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          {m.common.pick}
        </Button>
        {hasValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              onChange("");
              setError(null);
            }}
            aria-label={m.picker.clearScreenshot}
            title={m.common.clear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : knownMissing ? (
        <p className="text-[11px] text-destructive">{m.picker.imageNotFound(value)}</p>
      ) : null}
    </div>
  );
}
