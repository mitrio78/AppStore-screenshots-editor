"use client";
import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEVICE_LABEL, getExportSizes, type ExportSize } from "@/lib/constants";
import type { Device, Orientation } from "@/lib/types";

export type ExportFormat = "png" | "jpg";
export type ExportScope = "deck" | "current";

export type ExportOptions = {
  format: ExportFormat;
  quality: number;          // 0..1, jpg only
  sizes: ExportSize[];
  locales: string[];
  scope: ExportScope;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device;
  orientation: Orientation;
  locales: string[];
  slideCount: number;
  onExport: (opts: ExportOptions) => void;
};

export function ExportDialog({
  open,
  onOpenChange,
  device,
  orientation,
  locales,
  slideCount,
  onExport,
}: Props) {
  const allSizes = getExportSizes(device, orientation);
  const [format, setFormat] = React.useState<ExportFormat>("png");
  const [quality, setQuality] = React.useState(0.9);
  const [scope, setScope] = React.useState<ExportScope>("deck");
  const [sizeKeys, setSizeKeys] = React.useState<Set<string>>(new Set());
  const [localeKeys, setLocaleKeys] = React.useState<Set<string>>(new Set());

  // Re-seed selections whenever the dialog opens for a (possibly different) device.
  React.useEffect(() => {
    if (!open) return;
    setSizeKeys(new Set(allSizes.map((s) => `${s.w}x${s.h}`)));
    setLocaleKeys(new Set(locales));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, device, orientation]);

  const sizes = allSizes.filter((s) => sizeKeys.has(`${s.w}x${s.h}`));
  const chosenLocales = locales.filter((l) => localeKeys.has(l));
  const units = sizes.length * chosenLocales.length * (scope === "deck" ? slideCount : 1);

  function toggle(set: Set<string>, key: string, next: (s: Set<string>) => void) {
    const copy = new Set(set);
    if (copy.has(key)) copy.delete(key);
    else copy.add(key);
    next(copy);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export {DEVICE_LABEL[device]}</DialogTitle>
          <DialogDescription>
            Renders at App Store resolution and bundles everything into a zip
            (single images download directly).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Format</Label>
              <Tabs value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                <TabsList className="h-8 p-0.5">
                  <TabsTrigger value="png" className="h-7 px-3 text-xs">PNG</TabsTrigger>
                  <TabsTrigger value="jpg" className="h-7 px-3 text-xs">JPG</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Scope</Label>
              <Tabs value={scope} onValueChange={(v) => setScope(v as ExportScope)}>
                <TabsList className="h-8 p-0.5">
                  <TabsTrigger value="deck" className="h-7 px-3 text-xs">
                    All {slideCount} slides
                  </TabsTrigger>
                  <TabsTrigger value="current" className="h-7 px-3 text-xs">
                    Current slide
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {format === "jpg" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">JPG quality</Label>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {Math.round(quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                step={1}
                value={Math.round(quality * 100)}
                onChange={(e) => setQuality(Number(e.target.value) / 100)}
                className="w-full"
                aria-label="JPG quality"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Sizes</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {allSizes.map((s) => {
                const key = `${s.w}x${s.h}`;
                return (
                  <label
                    key={key}
                    className="flex items-center gap-2 rounded border px-2 py-1.5 text-[11px]"
                  >
                    <input
                      type="checkbox"
                      checked={sizeKeys.has(key)}
                      onChange={() => toggle(sizeKeys, key, setSizeKeys)}
                    />
                    <span className="font-medium">{s.label}</span>
                    <span className="ml-auto tabular-nums text-muted-foreground">
                      {s.w}×{s.h}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {locales.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Locales</Label>
              <div className="flex flex-wrap gap-1.5">
                {locales.map((l) => (
                  <label
                    key={l}
                    className="flex items-center gap-1.5 rounded border px-2 py-1 text-[11px]"
                  >
                    <input
                      type="checkbox"
                      checked={localeKeys.has(l)}
                      onChange={() => toggle(localeKeys, l, setLocaleKeys)}
                    />
                    {l.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {units} image{units === 1 ? "" : "s"}
          </span>
          <Button
            size="sm"
            disabled={units === 0}
            onClick={() => {
              onOpenChange(false);
              onExport({ format, quality, sizes, locales: chosenLocales, scope });
            }}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
