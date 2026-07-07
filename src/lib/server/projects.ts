// Server-side project file store. Each project is a pretty-printed local JSON
// file at projects/<slug>.json. Project files are git-ignored user data.
import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_PROJECT } from "@/lib/defaults";
import type { ProjectState, ProjectSummary } from "@/lib/types";

export const PROJECTS_DIR = path.join(process.cwd(), "projects");
const LEGACY_FILE = path.join(process.cwd(), "app-store-screenshots.json");

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
  return SLUG_RE.test(s) ? s : "";
}

function fileFor(slug: string): string {
  return path.join(PROJECTS_DIR, `${slug}.json`);
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// One-time import: a template-era app-store-screenshots.json at the repo root
// becomes projects/default.json (the client migrates its schema on load).
export async function ensureProjectsDir(): Promise<void> {
  await fs.mkdir(PROJECTS_DIR, { recursive: true });
  const entries = await fs.readdir(PROJECTS_DIR);
  if (entries.some((f) => f.endsWith(".json"))) return;
  if (await exists(LEGACY_FILE)) {
    const raw = await fs.readFile(LEGACY_FILE, "utf8");
    await fs.writeFile(fileFor("default"), raw, "utf8");
    return;
  }
  await fs.writeFile(fileFor("default"), JSON.stringify(DEFAULT_PROJECT, null, 2) + "\n", "utf8");
}

export async function listProjects(): Promise<ProjectSummary[]> {
  await ensureProjectsDir();
  const entries = (await fs.readdir(PROJECTS_DIR)).filter((f) => f.endsWith(".json"));
  const out: ProjectSummary[] = [];
  for (const entry of entries) {
    const slug = entry.replace(/\.json$/, "");
    if (!isValidSlug(slug)) continue;
    try {
      const [raw, stat] = await Promise.all([
        fs.readFile(fileFor(slug), "utf8"),
        fs.stat(fileFor(slug)),
      ]);
      const parsed = JSON.parse(raw) as Partial<ProjectState>;
      out.push({
        slug,
        name: parsed.name || parsed.appName || slug,
        appName: parsed.appName || "",
        updatedAt: stat.mtime.toISOString(),
      });
    } catch {
      // Skip unreadable/corrupt files rather than failing the whole listing.
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export async function readProject(slug: string): Promise<Partial<ProjectState> | null> {
  await ensureProjectsDir();
  try {
    const raw = await fs.readFile(fileFor(slug), "utf8");
    return JSON.parse(raw) as Partial<ProjectState>;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

export async function writeProject(slug: string, state: unknown): Promise<void> {
  await ensureProjectsDir();
  const pretty = JSON.stringify(state, null, 2) + "\n";
  await fs.writeFile(fileFor(slug), pretty, "utf8");
}

export async function deleteProject(slug: string): Promise<boolean> {
  try {
    await fs.unlink(fileFor(slug));
    return true;
  } catch {
    return false;
  }
}

export async function projectExists(slug: string): Promise<boolean> {
  return exists(fileFor(slug));
}

// Find a free slug: base, base-2, base-3, ...
export async function freeSlug(base: string): Promise<string> {
  const clean = slugify(base) || "project";
  if (!(await projectExists(clean))) return clean;
  for (let i = 2; i < 100; i++) {
    const candidate = `${clean}-${i}`;
    if (!(await projectExists(candidate))) return candidate;
  }
  return `${clean}-${Date.now().toString(36)}`;
}
