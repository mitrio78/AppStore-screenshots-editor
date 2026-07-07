"use client";
import * as React from "react";
import { Check, ChevronsUpDown, Copy, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import type { ProjectSummary } from "@/lib/types";

type Props = {
  slug: string;
  name: string;
  disabled?: boolean;
  onSwitch: (slug: string) => void;
  onRename: (name: string) => void;
};

type DialogMode = "new" | "duplicate" | "rename" | "delete" | null;

async function fetchProjects(): Promise<ProjectSummary[]> {
  try {
    const resp = await fetch("/api/projects", { cache: "no-store" });
    const json = (await resp.json()) as { ok: boolean; projects?: ProjectSummary[] };
    return json.ok && json.projects ? json.projects : [];
  } catch {
    return [];
  }
}

export function ProjectSwitcher({ slug, name, disabled, onSwitch, onRename }: Props) {
  const { messages: m } = useI18n();
  const [projects, setProjects] = React.useState<ProjectSummary[]>([]);
  const [mode, setMode] = React.useState<DialogMode>(null);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(() => {
    void fetchProjects().then(setProjects);
  }, []);

  React.useEffect(refresh, [refresh, slug]);

  async function createProject(from?: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const resp = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed, from }),
      });
      const json = (await resp.json()) as { ok: boolean; slug?: string; error?: string };
      if (!json.ok || !json.slug) throw new Error(json.error || `HTTP ${resp.status}`);
      toast.success(from ? m.projects.duplicatedTo(trimmed) : m.projects.created(trimmed));
      setMode(null);
      onSwitch(json.slug);
    } catch (e) {
      toast.error(m.projects.createError, {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeProject() {
    setBusy(true);
    try {
      const resp = await fetch(`/api/projects/${slug}`, { method: "DELETE" });
      const json = (await resp.json()) as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error || `HTTP ${resp.status}`);
      // Also drop the localStorage cache so the slug can be reused cleanly.
      try {
        window.localStorage.removeItem(`screenshot-studio:project:${slug}:v2`);
      } catch {
        /* ignore */
      }
      const rest = projects.filter((p) => p.slug !== slug);
      toast.success(m.projects.deleted(name));
      setMode(null);
      onSwitch(rest[0]?.slug || "default");
    } catch (e) {
      toast.error(m.projects.deleteError, {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  }

  function openDialog(next: Exclude<DialogMode, null>) {
    setText(next === "rename" ? name : next === "duplicate" ? m.projects.duplicateName(name) : "");
    setMode(next);
  }

  return (
    <>
      <DropdownMenu onOpenChange={(open) => open && refresh()}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 max-w-52 justify-start gap-1.5 text-xs font-semibold"
            disabled={disabled}
            title={m.projects.switchTitle}
          >
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{name}</span>
            <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {m.projects.menuLabel}
          </DropdownMenuLabel>
          {projects.map((p) => (
            <DropdownMenuItem
              key={p.slug}
              onSelect={() => p.slug !== slug && onSwitch(p.slug)}
              className="gap-2 text-xs"
            >
              <Check className={`h-3.5 w-3.5 ${p.slug === slug ? "opacity-100" : "opacity-0"}`} />
              <span className="truncate">{p.name}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">{p.slug}</span>
            </DropdownMenuItem>
          ))}
          {projects.length === 0 && (
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              {m.projects.noSavedProjects}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => openDialog("new")} className="gap-2 text-xs">
            <Plus className="h-3.5 w-3.5" /> {m.projects.newProject}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openDialog("duplicate")} className="gap-2 text-xs">
            <Copy className="h-3.5 w-3.5" /> {m.projects.duplicateAsPreset}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openDialog("rename")} className="gap-2 text-xs">
            <Pencil className="h-3.5 w-3.5" /> {m.projects.rename}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => openDialog("delete")}
            className="gap-2 text-xs text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> {m.projects.deleteProject}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && !busy && setMode(null)}>
        <DialogContent className="max-w-sm">
          {mode === "delete" ? (
            <>
              <DialogHeader>
                <DialogTitle>{m.projects.deleteTitle(name)}</DialogTitle>
                <DialogDescription>
                  {m.projects.deleteDescription(slug)}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => setMode(null)}>
                  {m.common.cancel}
                </Button>
                <Button variant="destructive" size="sm" disabled={busy} onClick={() => void removeProject()}>
                  {busy ? m.projects.deleting : m.common.delete}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  {mode === "new" && m.projects.dialogTitleNew}
                  {mode === "duplicate" && m.projects.dialogTitleDuplicate}
                  {mode === "rename" && m.projects.dialogTitleRename}
                </DialogTitle>
                <DialogDescription>
                  {mode === "duplicate"
                    ? m.projects.duplicateDescription(name)
                    : mode === "new"
                      ? m.projects.newDescription
                      : m.projects.renameDescription}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label className="text-xs">{m.projects.projectName}</Label>
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    if (mode === "rename") {
                      onRename(text.trim());
                      setMode(null);
                    } else {
                      void createProject(mode === "duplicate" ? slug : undefined);
                    }
                  }}
                  placeholder="FitLinkPro"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => setMode(null)}>
                  {m.common.cancel}
                </Button>
                <Button
                  size="sm"
                  disabled={busy || !text.trim()}
                  onClick={() => {
                    if (mode === "rename") {
                      onRename(text.trim());
                      setMode(null);
                    } else {
                      void createProject(mode === "duplicate" ? slug : undefined);
                    }
                  }}
                >
                  {busy ? m.common.working : mode === "rename" ? m.projects.renameAction : m.common.create}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
