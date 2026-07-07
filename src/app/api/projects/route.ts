import { NextResponse } from "next/server";
import { DEFAULT_PROJECT } from "@/lib/defaults";
import {
  freeSlug,
  listProjects,
  readProject,
  writeProject,
} from "@/lib/server/projects";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ ok: true, projects });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

// Create a new project. Body: { name: string, from?: string }.
// `from` duplicates an existing project (preset workflow); otherwise the
// starter deck is used.
export async function POST(req: Request) {
  let body: { name?: string; from?: string };
  try {
    body = (await req.json()) as { name?: string; from?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "Missing name" }, { status: 400 });
  }
  try {
    const slug = await freeSlug(name);
    let state: unknown;
    if (body.from) {
      const src = await readProject(body.from);
      if (!src) {
        return NextResponse.json(
          { ok: false, error: `Source project not found: ${body.from}` },
          { status: 404 },
        );
      }
      state = { ...src, name };
    } else {
      state = { ...DEFAULT_PROJECT, name };
    }
    await writeProject(slug, state);
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
