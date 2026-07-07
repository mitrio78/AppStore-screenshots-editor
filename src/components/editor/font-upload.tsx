"use client";
import * as React from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fileToDataUrl } from "@/lib/upload";
import { refreshFontRegistry } from "./font-loader";

// Small "upload a font file" affordance next to the font family select.
// Reads .ttf/.otf/.woff/.woff2, asks for the family name, POSTs to /api/fonts
// and refreshes the shared registry so the new family appears everywhere.
export function FontUploadButton() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pending, setPending] = React.useState<{ file: File; family: string } | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!pending) return;
    const family = pending.family.trim();
    if (!family) return;
    setSaving(true);
    try {
      const dataUrl = await fileToDataUrl(pending.file);
      const resp = await fetch("/api/fonts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dataUrl, filename: pending.file.name, family }),
      });
      const json = (await resp.json()) as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error || `HTTP ${resp.status}`);
      await refreshFontRegistry();
      toast.success(`Font "${family}" added`);
      setPending(null);
    } catch (e) {
      toast.error("Couldn't upload font", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => inputRef.current?.click()}
        title="Upload a font file (.ttf/.otf/.woff2)"
        aria-label="Upload font"
      >
        <Upload className="h-3.5 w-3.5" />
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
        onChange={(e) => {
          const input = e.currentTarget;
          const file = input.files?.[0];
          if (file) {
            const guess = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
            setPending({ file, family: guess });
          }
          input.value = "";
        }}
      />
      <Dialog open={!!pending} onOpenChange={(open) => !open && !saving && setPending(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add font</DialogTitle>
            <DialogDescription>
              {pending?.file.name} — set the family name to use in text fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Family name</Label>
            <Input
              value={pending?.family || ""}
              onChange={(e) =>
                setPending((p) => (p ? { ...p, family: e.target.value } : p))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") void save();
              }}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" disabled={saving} onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving || !pending?.family.trim()} onClick={() => void save()}>
              {saving ? "Saving…" : "Add font"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
