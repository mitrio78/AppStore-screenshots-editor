import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { BUILTIN_FONTS } from "@/lib/fonts";
import type { FontAsset } from "@/lib/types";

export const dynamic = "force-dynamic";

// Uploaded fonts live under public/fonts/uploaded/ with a manifest at
// public/fonts/fonts.json so one volume mount covers files + metadata.
const UPLOAD_DIR = path.join(process.cwd(), "public", "fonts", "uploaded");
const MANIFEST = path.join(process.cwd(), "public", "fonts", "fonts.json");
const PUBLIC_PREFIX = "/fonts/uploaded";

const ALLOWED_EXT = new Set(["ttf", "otf", "woff", "woff2"]);

async function readManifest(): Promise<FontAsset[]> {
  try {
    const raw = await fs.readFile(MANIFEST, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FontAsset[]) : [];
  } catch {
    return [];
  }
}

async function writeManifest(fonts: FontAsset[]): Promise<void> {
  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
  await fs.writeFile(MANIFEST, JSON.stringify(fonts, null, 2) + "\n", "utf8");
}

export async function GET() {
  const uploaded = await readManifest();
  return NextResponse.json({ ok: true, fonts: [...BUILTIN_FONTS, ...uploaded] });
}

// Body: { dataUrl: string, filename: string, family: string, weight?: string }
export async function POST(req: Request) {
  let body: { dataUrl?: string; filename?: string; family?: string; weight?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const { dataUrl, filename, family } = body;
  if (!dataUrl || !filename || !family?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Missing dataUrl, filename or family" },
      { status: 400 },
    );
  }
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json(
      { ok: false, error: "Use .ttf, .otf, .woff or .woff2" },
      { status: 400 },
    );
  }
  const m = /^data:[^;]+;base64,(.+)$/.exec(dataUrl);
  if (!m) {
    return NextResponse.json({ ok: false, error: "Unsupported data URL" }, { status: 400 });
  }
  const bytes = Buffer.from(m[1], "base64");
  if (bytes.byteLength > 12 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "Font too large (>12MB)" }, { status: 413 });
  }

  const hash = createHash("sha1").update(bytes).digest("hex").slice(0, 12);
  const file = `${PUBLIC_PREFIX}/${hash}.${ext}`;
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, `${hash}.${ext}`), bytes);
    const fonts = await readManifest();
    const asset: FontAsset = {
      family: family.trim(),
      file,
      // Uploaded static fonts usually carry one weight; "100 900" keeps
      // variable-font uploads working too.
      weight: body.weight?.trim() || "100 900",
    };
    // Replace an existing entry for the same file, else append.
    const next = fonts.filter((f) => f.file !== file).concat(asset);
    await writeManifest(next);
    return NextResponse.json({ ok: true, font: asset });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
