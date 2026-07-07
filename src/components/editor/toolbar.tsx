"use client";
import * as React from "react";
import { AlertTriangle, Check, Cloud, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supportsLandscape } from "@/lib/constants";
import { detectPlatform } from "@/lib/defaults";
import { useI18n } from "@/lib/i18n";
import type { Device, Orientation } from "@/lib/types";
import { LanguageSelect } from "./language-select";
import { ProjectSwitcher } from "./project-switcher";
import { ThemeToggle } from "./theme-toggle";

export type EditorViewMode = "edit" | "row";

type Props = {
  projectSlug: string;
  projectName: string;
  onSwitchProject: (slug: string) => void;
  onRenameProject: (name: string) => void;
  appName: string;
  setAppName: (v: string) => void;
  locale: string;
  setLocale: (v: string) => void;
  locales: string[];
  device: Device;
  setDevice: (v: Device) => void;
  orientation: Orientation;
  setOrientation: (v: Orientation) => void;
  onExport: () => void;
  onResetAll: () => void;
  onResetDevice: () => void;
  viewMode: EditorViewMode;
  setViewMode: (mode: EditorViewMode) => void;
  exporting: string | null;
  savedAt: number | null;
  saveError: string | null;
  busy: boolean;
};

export function Toolbar(props: Props) {
  const {
    deviceLabel: labelDevice,
    messages: m,
  } = useI18n();
  const platform = detectPlatform(props.device);
  const hasLandscape = supportsLandscape(props.device);
  const [resetOpen, setResetOpen] = React.useState(false);

  // Track last device per platform so iOS/Android tabs preserve user's choice.
  const lastByPlatform = React.useRef<{ ios: Device; android: Device }>({
    ios: platform === "ios" ? props.device : "iphone",
    android: platform === "android" ? props.device : "android",
  });
  React.useEffect(() => {
    lastByPlatform.current[platform] = props.device;
  }, [platform, props.device]);

  const showLocale = props.locales.length > 1;

  const deviceLabel = labelDevice(props.device);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b bg-card/40 px-4 py-2">
      <ProjectSwitcher
        slug={props.projectSlug}
        name={props.projectName}
        disabled={props.busy}
        onSwitch={props.onSwitchProject}
        onRename={props.onRenameProject}
      />
      <Input
        value={props.appName}
        onChange={(e) => props.setAppName(e.target.value)}
        className="h-8 w-40 border-dashed text-sm font-semibold focus-visible:border-input focus-visible:border-solid focus-visible:bg-background"
        placeholder={m.toolbar.appNamePlaceholder}
        aria-label={m.toolbar.appNameAria}
        title={m.toolbar.appNameTitle}
        disabled={props.busy}
      />

      <span aria-hidden className="mx-1 h-5 w-px bg-border" />

      <Tabs
        value={platform}
        onValueChange={(p) => {
          if (props.busy) return;
          const next = p === "ios" ? lastByPlatform.current.ios : lastByPlatform.current.android;
          props.setDevice(next);
        }}
      >
        <TabsList className="h-8 p-0.5">
          <TabsTrigger value="ios" className="h-7 px-3 text-xs" disabled={props.busy}>
            iOS
          </TabsTrigger>
          <TabsTrigger value="android" className="h-7 px-3 text-xs" disabled={props.busy}>
            Android
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Select
        value={props.device}
        onValueChange={(v) => props.setDevice(v as Device)}
        disabled={props.busy}
      >
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue placeholder={m.toolbar.devicePlaceholder}>{deviceLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {platform === "ios" ? (
            <>
              <SelectItem value="iphone">{labelDevice("iphone")}</SelectItem>
              <SelectItem value="ipad">{labelDevice("ipad")}</SelectItem>
            </>
          ) : (
            <>
              <SelectItem value="android">{labelDevice("android")}</SelectItem>
              <SelectItem value="android-7">{labelDevice("android-7")}</SelectItem>
              <SelectItem value="android-10">{labelDevice("android-10")}</SelectItem>
              <SelectItem value="feature-graphic">{labelDevice("feature-graphic")}</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

      {hasLandscape && (
        <Select
          value={props.orientation}
          onValueChange={(v) => props.setOrientation(v as Orientation)}
          disabled={props.busy}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">{m.toolbar.portrait}</SelectItem>
            <SelectItem value="landscape">{m.toolbar.landscape}</SelectItem>
          </SelectContent>
        </Select>
      )}

      {showLocale && (
        <Select value={props.locale} onValueChange={props.setLocale} disabled={props.busy}>
          <SelectTrigger className="h-8 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {props.locales.map((l) => (
              <SelectItem key={l} value={l}>
                {l.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Tabs
        value={props.viewMode}
        onValueChange={(value) => props.setViewMode(value as EditorViewMode)}
      >
        <TabsList className="h-8 p-0.5" aria-label={m.toolbar.viewModeAria}>
          <TabsTrigger value="edit" className="h-7 px-3 text-xs" disabled={props.busy}>
            {m.toolbar.viewEdit}
          </TabsTrigger>
          <TabsTrigger value="row" className="h-7 px-3 text-xs" disabled={props.busy}>
            {m.toolbar.viewStoreRow}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <SaveStatus savedAt={props.savedAt} saveError={props.saveError} />
        <span aria-hidden className="h-5 w-px bg-border" />
        <LanguageSelect disabled={props.busy} triggerClassName="w-28" />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setResetOpen(true)}
          title={m.toolbar.resetTitle}
          aria-label={m.toolbar.resetAria}
          disabled={props.busy}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          onClick={props.onExport}
          disabled={!!props.exporting}
          size="sm"
          className="h-8"
          title={m.toolbar.exportTitle}
        >
          <Download className="h-4 w-4" />
          {props.exporting ? m.toolbar.exporting(props.exporting) : `${m.common.export}...`}
        </Button>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{m.toolbar.resetDialogTitle}</DialogTitle>
            <DialogDescription>
              {m.toolbar.resetDialogDescription(deviceLabel)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setResetOpen(false)}>
              {m.common.cancel}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResetOpen(false);
                props.onResetDevice();
              }}
            >
              {m.toolbar.resetDeviceOnly(deviceLabel)}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setResetOpen(false);
                props.onResetAll();
              }}
            >
              {m.toolbar.resetAllDevices}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SaveStatus({ savedAt, saveError }: { savedAt: number | null; saveError: string | null }) {
  const [, setTick] = React.useState(0);
  const { messages: m } = useI18n();
  React.useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  if (saveError) {
    return (
      <span
        className="flex items-center gap-1 text-xs text-destructive"
        title={saveError}
      >
        <AlertTriangle className="h-3.5 w-3.5" /> {m.toolbar.saveFailed}
      </span>
    );
  }

  if (!savedAt) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Cloud className="h-3.5 w-3.5" /> {m.toolbar.notSavedYet}
      </span>
    );
  }
  const seconds = Math.max(0, Math.round((Date.now() - savedAt) / 1000));
  const label =
    seconds < 5
      ? m.toolbar.saved
      : seconds < 60
        ? m.toolbar.savedSecondsAgo(seconds)
        : seconds < 3600
          ? m.toolbar.savedMinutesAgo(Math.round(seconds / 60))
          : m.toolbar.savedHoursAgo(Math.round(seconds / 3600));
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Check className="h-3.5 w-3.5 text-green-500" /> {label}
    </span>
  );
}
