import { NextResponse } from "next/server";
import {
  deleteProject,
  isValidSlug,
  readProject,
  writeProject,
} from "@/lib/server/projects";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

function badSlug() {
  return NextResponse.json({ ok: false, error: "Invalid slug" }, { status: 400 });
}

export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  if (!isValidSlug(slug)) return badSlug();
  try {
    const state = await readProject(slug);
    return NextResponse.json({ ok: true, state });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  if (!isValidSlug(slug)) return badSlug();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  try {
    await writeProject(slug, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  if (!isValidSlug(slug)) return badSlug();
  const ok = await deleteProject(slug);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
